import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

async function seedNewsletter() {
  try {
    console.log("🌱 Début du seed des données newsletter...");

    // Récupérer l'admin
    const admin = await prisma.user.findFirst({
      where: { email: "cedric.debailleul62@gmail.com" }
    });

    if (!admin) {
      console.error("❌ Admin non trouvé. Exécutez d'abord seed-admin.ts");
      return;
    }

    // Créer des abonnés de test
    console.log("📧 Création d'abonnés de test...");
    
    const subscribers = [];
    for (let i = 1; i <= 5; i++) {
      const subscriber = await prisma.newsletterSubscriber.upsert({
        where: { email: `test${i}@example.com` },
        update: {},
        create: {
          email: `test${i}@example.com`,
          firstName: `Utilisateur${i}`,
          lastName: `Test`,
          isActive: true,
          isVerified: true,
          verificationToken: null,
          unsubscribeToken: `unsubscribe_token_${i}`,
          preferences: {
            create: {
              events: true,
              places: true,
              offers: i % 2 === 0, // Certains acceptent les offres
              news: true,
              frequency: "WEEKLY",
            }
          }
        },
        include: { preferences: true }
      });
      subscribers.push(subscriber);
    }

    console.log(`✅ ${subscribers.length} abonnés créés`);

    // Créer des campagnes de test
    console.log("📬 Création de campagnes de test...");

    const campaigns = [
      {
        title: "Newsletter Hebdomadaire",
        subject: "Les actualités de la semaine à Bédarieux",
        content: "Découvrez cette semaine les dernières actualités de notre belle ville de Bédarieux. Au programme : nouveaux commerces, événements à venir et bons plans !",
        type: "NEWSLETTER",
        status: "DRAFT",
        includedEvents: [],
        includedPlaces: [],
        includedPosts: [],
      },
      {
        title: "Nouveaux Commerces",
        subject: "Découvrez les nouveaux commerces qui viennent d'ouvrir",
        content: "Cette semaine, plusieurs nouveaux commerces ont ouvert leurs portes à Bédarieux. Venez les découvrir !",
        type: "PLACE_UPDATE",
        status: "SENT",
        includedEvents: [],
        includedPlaces: ["place1", "place2"],
        includedPosts: [],
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hier
        totalSent: 5,
        totalDelivered: 5,
        totalOpened: 3,
        totalClicked: 1,
        totalUnsubscribed: 0,
      },
      {
        title: "Événements du Week-end",
        subject: "Ne ratez pas les événements de ce week-end !",
        content: "Ce week-end s'annonce riche en animations ! Retrouvez le programme complet des événements.",
        type: "EVENT_DIGEST",
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Dans 2 jours
        includedEvents: ["event1", "event2"],
        includedPlaces: [],
        includedPosts: [],
      },
      {
        title: "Offre Spéciale Commerçants",
        subject: "🎉 Offres exceptionnelles chez nos commerçants partenaires",
        content: "Profitez des offres spéciales de nos commerçants partenaires. Des réductions jusqu'à 30% sur de nombreux articles !",
        type: "PROMOTIONAL",
        status: "DRAFT",
        includedEvents: [],
        includedPlaces: ["place3"],
        includedPosts: [],
      },
    ];

    for (const campaignData of campaigns) {
      const campaign = await prisma.newsletterCampaign.create({
        data: {
          ...campaignData,
          createdById: admin.id,
          type: campaignData.type as any,
          status: campaignData.status as any,
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });

      console.log(`📨 Campagne créée: ${campaign.title} (${campaign.status})`);
    }

    console.log("✅ Seed newsletter terminé avec succès !");

  } catch (error) {
    console.error("❌ Erreur lors du seed newsletter:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedNewsletter()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export default seedNewsletter;