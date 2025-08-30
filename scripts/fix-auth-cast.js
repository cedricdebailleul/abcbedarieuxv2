#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour corriger les erreurs de rôle avec des casts sûrs
 */

function fixAuthCastInFile(filePath) {
  if (filePath.includes('node_modules') || 
      filePath.includes('.git') || 
      filePath.includes('.next') ||
      filePath.includes('auth-helpers.ts')) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content;
    let hasChanges = false;

    // Vérifier si le fichier contient des erreurs de rôle
    if (!content.includes('.role')) {
      return false;
    }

    // 1. Ajouter l'import safeUserCast si nécessaire
    if (!content.includes('safeUserCast')) {
      const authImportRegex = /^(import.*from\s+["']@\/lib\/auth["'];?)$/gm;
      const match = content.match(authImportRegex);
      
      if (match) {
        const newImport = `${match[0]}\nimport { safeUserCast } from "@/lib/auth-helpers";`;
        newContent = newContent.replace(match[0], newImport);
        hasChanges = true;
      }
    }

    // 2. Remplacer const user = session.user; par const user = safeUserCast(session.user);
    const userAssignRegex = /const\s+user\s+=\s+session\.user;/g;
    if (userAssignRegex.test(newContent)) {
      newContent = newContent.replace(userAssignRegex, 'const user = safeUserCast(session.user);');
      hasChanges = true;
    }

    // 3. Remplacer les patterns session.user.role directement
    const sessionRoleRegex = /session\.user\.role/g;
    if (sessionRoleRegex.test(newContent)) {
      newContent = newContent.replace(sessionRoleRegex, 'safeUserCast(session.user).role');
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir, stats) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath, stats);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      stats.total++;
      if (fixAuthCastInFile(fullPath)) {
        stats.fixed++;
      }
    }
  }
}

// Répertoires à traiter
const directories = ['actions', 'app/api', 'app/(dashboard)', 'components'];

console.log('🔧 Fixing authentication role errors with safe casts...\n');

const stats = { total: 0, fixed: 0 };

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`📁 Processing ${dir}/...`);
    processDirectory(dir, stats);
  }
});

console.log(`\n✨ Processed ${stats.total} TypeScript files`);
console.log(`📝 Fixed ${stats.fixed} files with authentication cast issues`);
console.log(`\n🎯 Next: Run 'pnpm type-check' to verify improvements`);