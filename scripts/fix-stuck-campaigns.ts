import { newsletterQueue } from '../lib/newsletter-queue';

async function main() {
  console.log('🔧 Correction des campagnes bloquées...');
  
  try {
    await newsletterQueue.fixStuckCampaigns();
    console.log('✅ Correction terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
  
  process.exit(0);
}

main().catch(console.error);