#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Migration des modèles Newsletter...\n');

try {
  // Changer vers le répertoire du projet
  process.chdir(path.join(__dirname, '..'));
  
  console.log('📋 Génération du client Prisma...');
  execSync('pnpm db:generate', { stdio: 'inherit' });
  
  console.log('\n📊 Application des changements à la base de données...');
  execSync('pnpm db:push', { stdio: 'inherit' });
  
  console.log('\n✅ Migration terminée avec succès !');
  console.log('📧 Vous pouvez maintenant utiliser le système de newsletter.');
  
} catch (error) {
  console.error('\n❌ Erreur lors de la migration:');
  console.error(error.message);
  
  console.log('\n🔧 Solutions possibles:');
  console.log('1. Vérifiez que la base de données est accessible');
  console.log('2. Fermez tous les autres processus Node.js');
  console.log('3. Redémarrez votre serveur de développement');
  console.log('4. Essayez: pnpm db:push manuellement');
  
  process.exit(1);
}