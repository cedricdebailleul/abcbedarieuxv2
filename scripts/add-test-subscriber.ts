import { prisma } from "./prisma-client";
import crypto from 'crypto';

async function addTestSubscriber() {
  try {
    // Créer un abonné de test
    const testSubscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isVerified: true, // Marquer comme vérifié pour pouvoir envoyer des emails
        unsubscribeToken: crypto.randomBytes(32).toString('hex'),
        verificationToken: null, // Pas besoin de token de vérification car déjà vérifié
        preferences: {
          create: {
            events: true,
            places: true,
            offers: true,
            news: true,
            frequency: 'WEEKLY'
          }
        }
      },
      include: {
        preferences: true
      }
    });

    console.log('✅ Abonné de test créé:', testSubscriber);

    // Vérifier le nombre total d'abonnés actifs et vérifiés
    const subscriberCount = await prisma.newsletterSubscriber.count({
      where: {
        isActive: true,
        isVerified: true
      }
    });

    console.log(`📊 Total d'abonnés actifs et vérifiés: ${subscriberCount}`);

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'abonné de test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestSubscriber();