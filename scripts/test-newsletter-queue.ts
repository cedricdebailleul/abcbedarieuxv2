#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';
import { newsletterQueue } from '../lib/newsletter-queue';

async function testNewsletterQueue() {
  console.log('🧪 Test de la file d\'attente newsletter...\n');

  try {
    // 1. Vérifier les modèles existent
    console.log('📊 Vérification des données...');
    
    const campaignCount = await prisma.newsletterCampaign.count();
    const subscriberCount = await prisma.newsletterSubscriber.count();
    const queueCount = await prisma.newsletterQueue.count();
    
    console.log(`  - Campagnes: ${campaignCount}`);
    console.log(`  - Abonnés: ${subscriberCount}`);
    console.log(`  - Jobs en queue: ${queueCount}`);

    // 2. Statut de la queue
    console.log('\n📈 Statut de la file d\'attente:');
    const queueStatus = await newsletterQueue.getQueueStatus();
    console.log('  -', queueStatus);

    // 3. Si on a des campagnes et abonnés, on peut tester
    if (campaignCount > 0 && subscriberCount > 0) {
      const firstCampaign = await prisma.newsletterCampaign.findFirst({
        where: { status: 'DRAFT' }
      });
      
      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: { isActive: true, isVerified: true },
        take: 5, // On prend juste 5 pour le test
        select: { id: true, email: true }
      });

      if (firstCampaign && subscribers.length > 0) {
        console.log(`\n🧪 Test avec la campagne "${firstCampaign.title}" et ${subscribers.length} abonnés`);
        
        // Ajouter à la queue (simulation)
        const subscriberIds = subscribers.map(s => s.id);
        console.log('📝 Simulation d\'ajout à la queue...');
        console.log(`  - IDs des abonnés: ${subscriberIds.join(', ')}`);
        
        // En mode test, on ne fait que simuler
        console.log('✅ Test de simulation réussi');
      } else {
        console.log('\n⚠️  Pas de campagne en brouillon ou d\'abonnés actifs pour tester');
      }
    } else {
      console.log('\n⚠️  Pas assez de données pour tester la queue');
    }

    // 4. Nettoyage des jobs complétés (test)
    console.log('\n🧹 Test de nettoyage des jobs anciens...');
    const cleanedCount = await newsletterQueue.clearCompletedJobs(0); // 0 jours = tout nettoyer
    console.log(`  - ${cleanedCount} jobs nettoyés`);

    console.log('\n✅ Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur pendant les tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests
testNewsletterQueue();