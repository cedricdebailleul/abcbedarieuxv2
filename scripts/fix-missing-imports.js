#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour corriger automatiquement les imports manquants identifiés par ESLint
 */

// Map des imports manquants courants
const missingImports = {
  'Loader2': { from: 'lucide-react', type: 'named' },
  'IconMail': { from: '@tabler/icons-react', type: 'named' },
  'IconFileText': { from: '@tabler/icons-react', type: 'named' },
  'MessageCircle': { from: 'lucide-react', type: 'named' },
  'MapPin': { from: 'lucide-react', type: 'named' },
  'Eye': { from: 'lucide-react', type: 'named' },
  'EyeOff': { from: 'lucide-react', type: 'named' },
};

function addMissingImport(filePath, importName) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (!missingImports[importName]) {
      console.log(`⚠️  Unknown import: ${importName}`);
      return false;
    }

    const { from, type } = missingImports[importName];
    let newContent = content;
    let hasChanges = false;

    // Vérifier si l'import existe déjà dans le fichier
    if (content.includes(importName)) {
      return false;
    }

    // Chercher un import existant du même package
    const importRegex = new RegExp(`import\\s*{([^}]*)}\\s*from\\s*["']${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'];?`, 'g');
    const match = content.match(importRegex);

    if (match) {
      // Ajouter à l'import existant
      const fullMatch = match[0];
      const imports = fullMatch.match(/{([^}]*)}/)[1];
      const newImports = imports.trim() ? `${imports.trim()}, ${importName}` : importName;
      const newImportLine = fullMatch.replace(/{[^}]*}/, `{ ${newImports} }`);
      
      newContent = newContent.replace(fullMatch, newImportLine);
      hasChanges = true;
    } else {
      // Créer un nouvel import
      const firstImport = content.match(/^import.*$/m);
      if (firstImport) {
        const newImportLine = `import { ${importName} } from "${from}";`;
        newContent = newContent.replace(firstImport[0], `${firstImport[0]}\n${newImportLine}`);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ Added ${importName} to ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Fichiers spécifiques et leurs imports manquants identifiés par ESLint
const fixMap = [
  { file: 'app/(auth)/login/_components/TabLoginForm.tsx', imports: ['Loader2'] },
  { file: 'app/(auth)/verify-email/page.tsx', imports: ['Loader2'] },
  { file: 'app/(dashboard)/dashboard/admin/abc/bulletins/page.tsx', imports: ['IconMail'] },
  { file: 'app/(dashboard)/dashboard/admin/abc/documents/page.tsx', imports: ['IconFileText'] },
  { file: 'app/(dashboard)/dashboard/admin/abc/registrations/page.tsx', imports: ['IconMail'] },
];

console.log('🔧 Fixing missing imports from ESLint errors...\n');

let totalFixed = 0;

fixMap.forEach(({ file, imports }) => {
  const filePath = path.join(process.cwd(), file);
  
  if (fs.existsSync(filePath)) {
    console.log(`📁 Processing ${file}...`);
    
    imports.forEach(importName => {
      if (addMissingImport(filePath, importName)) {
        totalFixed++;
      }
    });
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n✨ Fixed ${totalFixed} missing imports!`);
console.log(`🎯 Next: Run 'pnpm lint' to verify fixes`);