#!/usr/bin/env tsx

import { prisma } from "@/lib/prisma";

async function testNewsletterModels() {
  console.log("🧪 Test des modèles Newsletter...\n");
  
  try {
    // Test de connexion aux tables
    console.log("📊 Test de connexion aux tables...");
    
    const subscribersCount = await prisma.newsletterSubscriber.count();
    console.log(`✅ NewsletterSubscriber: ${subscribersCount} abonnés`);
    
    const campaignsCount = await prisma.newsletterCampaign.count();
    console.log(`✅ NewsletterCampaign: ${campaignsCount} campagnes`);
    
    console.log("\n🎉 Tous les modèles newsletter sont accessibles !");
    console.log("✅ Migration réussie - Le système newsletter est prêt !");
    
  } catch (error) {
    console.error("❌ Erreur lors du test des modèles:", error.message);
    console.log("\n🔧 Solutions possibles:");
    console.log("1. Vérifiez que 'pnpm db:push' a été exécuté");
    console.log("2. Redémarrez votre serveur de développement");
    console.log("3. Exécutez 'pnpm db:generate' pour régénérer le client");
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testNewsletterModels();