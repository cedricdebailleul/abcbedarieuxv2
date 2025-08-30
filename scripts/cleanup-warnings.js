#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour nettoyer automatiquement les warnings ESLint
 */

function removeUnusedSafeUserCast(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content;
    let hasChanges = false;

    // Si le fichier importe safeUserCast mais ne l'utilise pas dans le code
    if (content.includes('safeUserCast') && 
        content.includes('import { safeUserCast }') &&
        !content.includes('safeUserCast(')) {
      
      // Supprimer l'import safeUserCast
      newContent = newContent.replace(
        /import\s*{\s*safeUserCast\s*}\s*from\s*["']@\/lib\/auth-helpers["'];\s*\n/g,
        ''
      );
      
      hasChanges = true;
    }

    // Supprimer les imports vides
    newContent = newContent.replace(/import\s*{\s*}\s*from\s*["'][^"']*["'];\s*\n/g, '');

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ Cleaned unused imports: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function removeUnusedVariables(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content;
    let hasChanges = false;

    // Patterns spécifiques trouvés dans les warnings
    const unusedPatterns = [
      // Variables assignées mais non utilisées
      { pattern: /const\s+base\s*=\s*[^;]+;\s*\n/g, name: 'base variable' },
      { pattern: /const\s+getStatusText\s*=\s*[^}]+};\s*\n/g, name: 'getStatusText function' },
      { pattern: /const\s+message\s*=\s*[^;]+;\s*\n/g, name: 'message variable' },
      { pattern: /const\s+requireVerification\s*=\s*[^;]+;\s*\n/g, name: 'requireVerification variable' },
    ];

    // Imports inutilisés spécifiques
    const unusedImports = [
      'sanitizeImageUrls',
      'IconMail',
      'IconFileText', 
      'MessageCircle',
      'MapPin',
      'Loader2',
      'ExtendedUser',
      'UserWithRole',
      'SessionLike'
    ];

    // Supprimer les variables inutilisées
    unusedPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, '');
        hasChanges = true;
        console.log(`  - Removed ${name}`);
      }
    });

    // Supprimer les imports inutilisés
    unusedImports.forEach(importName => {
      // Patterns pour différents types d'imports
      const patterns = [
        new RegExp(`import\\s*{\\s*${importName}\\s*}\\s*from\\s*["'][^"']*["'];\\s*\\n`, 'g'),
        new RegExp(`import\\s*{\\s*([^}]*,\\s*)?${importName}(\\s*,\\s*[^}]*)?\\s*}`, 'g'),
        new RegExp(`${importName}\\s*,\\s*`, 'g'),
        new RegExp(`\\s*,\\s*${importName}`, 'g'),
      ];

      patterns.forEach(pattern => {
        if (pattern.test(newContent)) {
          newContent = newContent.replace(pattern, (match) => {
            // Nettoie les virgules orphelines
            return match.replace(new RegExp(`\\b${importName}\\b`), '').replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}');
          });
          hasChanges = true;
        }
      });
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ Cleaned unused variables: ${path.relative(process.cwd(), filePath)}`);
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
      
      if (removeUnusedSafeUserCast(fullPath)) {
        stats.fixed++;
      }
      
      if (removeUnusedVariables(fullPath)) {
        stats.fixed++;
      }
    }
  }
}

// Répertoires à traiter
const directories = ['app', 'components', 'lib'];

console.log('🧹 Cleaning up ESLint warnings...\n');

const stats = { total: 0, fixed: 0 };

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`📁 Processing ${dir}/...`);
    processDirectory(dir, stats);
  }
});

console.log(`\n✨ Processed ${stats.total} TypeScript files`);
console.log(`🧹 Cleaned ${stats.fixed} files with warnings`);
console.log(`\n🎯 Next: Run 'pnpm lint' to verify improvements`);