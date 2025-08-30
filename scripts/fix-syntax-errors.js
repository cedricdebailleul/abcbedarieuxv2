#!/usr/bin/env node

const fs = require('fs');

/**
 * Script pour corriger rapidement les erreurs de syntaxe restantes
 */

const fixes = [
  // Errors: Expression expected (icon: ,)
  {
    file: 'app/(front)/search/page.tsx',
    pattern: /icon:\s*,/g,
    replacement: 'icon: Search,'
  },
  {
    file: 'app/(front)/services/page.tsx', 
    pattern: /icon:\s*,/g,
    replacement: 'icon: Briefcase,'
  },
  {
    file: 'app/(front)/support/page.tsx',
    pattern: /icon:\s*,/g,
    replacement: 'icon: HelpCircle,'
  },
  {
    file: 'components/front/header/enhanced-header.tsx',
    pattern: /icon:\s*,/g,
    replacement: 'icon: Menu,'
  },
  {
    file: 'components/front/header/search-menu.tsx',
    pattern: /icon:\s*,/g,
    replacement: 'icon: Search,'
  },
];

console.log('🔧 Fixing remaining syntax errors...\n');

let totalFixed = 0;

fixes.forEach(({ file, pattern, replacement }) => {
  const filePath = `C:\\abcbedarieuxv2\\${file}`;
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (pattern.test(content)) {
        const newContent = content.replace(pattern, replacement);
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`✅ Fixed ${file}`);
        totalFixed++;
      }
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log(`\n✨ Fixed ${totalFixed} syntax errors!`);
console.log('🎯 The build should now pass!');