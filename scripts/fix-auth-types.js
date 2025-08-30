#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script pour corriger automatiquement les erreurs de type auth dans toute la codebase
 */

// Patterns à rechercher et leurs remplacements
const fixes = [
  // Import à ajouter si pas présent
  {
    pattern: /^(import.*from.*["']@\/lib\/auth["'];?)$/gm,
    replacement: `$1\nimport { getExtendedSession, requireAdmin, requireAdminOrModerator } from "@/lib/auth-extended";`
  },

  // Remplacer les vérifications de rôle direct
  {
    pattern: /if\s*\(\s*session\.user\.role\s*!==\s*["']admin["']\s*\)/g,
    replacement: 'if (!(await requireAdmin()))'
  },

  // Remplacer les vérifications de rôle pour admin/moderator
  {
    pattern: /if\s*\(\s*session\.user\.role\s*!==\s*["']admin["']\s*&&\s*session\.user\.role\s*!==\s*["']moderator["']\s*\)/g,
    replacement: 'if (!(await requireAdminOrModerator()))'
  },

  // Remplacer les accès direct au rôle
  {
    pattern: /session\.user\.role/g,
    replacement: '(await getExtendedSession())?.user?.role'
  },

  // Remplacer les accès user.role 
  {
    pattern: /user\.role/g,
    replacement: '(await getExtendedSession())?.user?.role'
  }
];

// Fichiers à traiter
const filesToProcess = [
  'actions/**/*.ts',
  'app/**/*.ts',
  'app/**/*.tsx',
  'components/**/*.ts',
  'components/**/*.tsx',
  'lib/**/*.ts'
];

function processFile(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('.git')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  let hasChanges = false;

  // Appliquer chaque correction
  for (const fix of fixes) {
    const before = newContent;
    newContent = newContent.replace(fix.pattern, fix.replacement);
    if (before !== newContent) {
      hasChanges = true;
    }
  }

  // Écrire le fichier modifié
  if (hasChanges) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Corrected: ${filePath}`);
  }
}

// Traiter tous les fichiers
console.log('🔧 Fixing authentication type errors...\n');

filesToProcess.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: process.cwd() });
  files.forEach(processFile);
});

console.log('\n✨ Authentication type fixes completed!');