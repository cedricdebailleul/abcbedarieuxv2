#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour corriger automatiquement toutes les erreurs user.role dans la codebase
 */

function fixRoleErrorsInFile(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('.next')) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content;
    let hasChanges = false;

    // 1. Ajouter l'import getUserRole si pas présent et si nécessaire
    if (content.includes('session.user.role') || content.includes('user.role')) {
      if (!content.includes('getUserRole')) {
        const importRegex = /^(import.*from\s+["']@\/lib\/auth["'];?)$/gm;
        const match = content.match(importRegex);
        if (match) {
          const newImport = match[0].replace(
            /from\s+["']@\/lib\/auth["'];?/,
            `from "@/lib/auth";\nimport { getUserRole } from "@/lib/auth-helpers";`
          );
          newContent = newContent.replace(match[0], newImport);
          hasChanges = true;
        } else {
          // Ajouter l'import au début du fichier si il n'y a pas d'import auth existant
          const firstImport = content.match(/^import.*$/m);
          if (firstImport) {
            newContent = newContent.replace(
              firstImport[0],
              `${firstImport[0]}\nimport { getUserRole } from "@/lib/auth-helpers";`
            );
            hasChanges = true;
          }
        }
      }
    }

    // 2. Remplacer session.user.role par await getUserRole(session.user)
    if (newContent.includes('session.user.role')) {
      newContent = newContent.replace(
        /session\.user\.role/g,
        'await getUserRole(session.user)'
      );
      hasChanges = true;
    }

    // 3. Remplacer user.role par await getUserRole(user) (avec contexte)
    if (newContent.includes('user.role')) {
      // Plus délicat - on veut éviter de remplacer dans les définitions de types
      // On cible seulement les usages dans le code
      const roleUsageRegex = /(?<!interface\s+\w+\s*{[^}]*)\buser\.role\b(?!\s*[;:])/g;
      if (roleUsageRegex.test(newContent)) {
        newContent = newContent.replace(roleUsageRegex, 'await getUserRole(user)');
        hasChanges = true;
      }
    }

    // 4. Corriger les comparaisons qui ne sont plus synchrones
    // if (user.role === "admin") devient if ((await getUserRole(user)) === "admin")
    newContent = newContent.replace(
      /if\s*\(\s*(await getUserRole\([^)]+\))\s*([!=]==?)\s*["'](\w+)["']\s*\)/g,
      'if (($1) $2 "$3")'
    );

    // 5. Marquer les fonctions comme async si elles utilisent getUserRole
    if (newContent.includes('await getUserRole') && !content.includes('await getUserRole')) {
      // Trouver les fonctions qui contiennent await getUserRole et les marquer async
      const functionRegex = /(export\s+)?(async\s+)?function\s+(\w+)\s*\([^)]*\)\s*{[^}]*await getUserRole[^}]*}/gm;
      newContent = newContent.replace(functionRegex, (match, exportKeyword, asyncKeyword, functionName) => {
        if (!asyncKeyword) {
          return match.replace(`function ${functionName}`, `async function ${functionName}`);
        }
        return match;
      });
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Fichiers à traiter
const filesToProcess = [
  'actions',
  'app/api',
  'app/(dashboard)',
  'components',
  'lib'
];

console.log('🔧 Fixing role access errors in TypeScript files...\n');

let totalFixed = 0;

function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      if (fixRoleErrorsInFile(fullPath)) {
        totalFixed++;
      }
    }
  }
}

filesToProcess.forEach(dir => {
  processDirectory(dir);
});

console.log(`\n✨ Fixed ${totalFixed} files with role access errors!`);
console.log('⚠️  Note: Some functions may need manual async/await adjustments.');