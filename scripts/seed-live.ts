import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🌱 Début du seed live...");

  try {
    // 1. Créer l'administrateur
    console.log("👑 Vérification/création de l'administrateur...");
    const adminUser = await prisma.user.upsert({
      where: { email: "cedric.debailleul62@gmail.com" },
      update: { role: "admin" },
      create: {
        name: "Cédric Debailleul",
        email: "cedric.debailleul62@gmail.com",
        emailVerified: true,
        role: "admin",
        slug: "cedric-debailleul",
        profile: {
          create: {
            bio: "Administrateur de la plateforme ABC Bédarieux",
            address: "Bédarieux, France",
          },
        },
      },
    });

    // 2. Créer quelques utilisateurs
    console.log("👥 Création des utilisateurs...");
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: "Marie Dupont",
          email: "marie.dupont@example.com",
          emailVerified: true,
          slug: "marie-dupont",
          profile: {
            create: {
              bio: "Passionnée de cuisine locale",
              address: "Bédarieux",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          name: "Pierre Martin",
          email: "pierre.martin@example.com",
          emailVerified: true,
          slug: "pierre-martin",
          profile: {
            create: {
              bio: "Commerçant local",
              address: "Bédarieux",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          name: "Sophie Leclerc",
          email: "sophie.leclerc@example.com",
          emailVerified: true,
          role: "moderator",
          slug: "sophie-leclerc",
          profile: {
            create: {
              bio: "Modératrice communauté",
              address: "Bédarieux",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          name: "Jean-Luc Moreau",
          email: "jeanluc.moreau@example.com",
          emailVerified: true,
          slug: "jean-luc-moreau",
          profile: {
            create: {
              bio: "Organisateur événements",
              address: "Bédarieux",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          name: "Claire Rousseau",
          email: "claire.rousseau@example.com",
          emailVerified: true,
          slug: "claire-rousseau",
          profile: {
            create: {
              bio: "Artisane locale",
              address: "Bédarieux",
            },
          },
        },
      }),
    ]);

    // 3. Créer les catégories avec le script existant
    console.log("📂 Lancement du seed des catégories...");
    await import("./seed-place-categories");

    // 4. Créer quelques établissements simples
    console.log("🏪 Création d'établissements de test...");
    const places = await Promise.all([
      prisma.place.create({
        data: {
          name: "Restaurant Test",
          description: "Restaurant de test pour la démonstration",
          street: "Rue de la République",
          streetNumber: "12",
          postalCode: "34600",
          city: "Bédarieux",
          phone: "04 67 95 12 34",
          status: "ACTIVE",
          isVerified: true,
          slug: "restaurant-test",
          type: "RESTAURANT",
          latitude: 43.6147,
          longitude: 3.1567,
        },
      }),
      prisma.place.create({
        data: {
          name: "Café de Test",
          description: "Café de test pour la démonstration",
          street: "Place de la République",
          streetNumber: "3",
          postalCode: "34600",
          city: "Bédarieux",
          phone: "04 67 95 23 45",
          status: "ACTIVE",
          isVerified: true,
          slug: "cafe-test",
          type: "COMMERCE",
          latitude: 43.6150,
          longitude: 3.1575,
        },
      }),
      prisma.place.create({
        data: {
          name: "Pharmacie de Test",
          description: "Pharmacie de test pour la démonstration",
          street: "Boulevard de la Liberté",
          streetNumber: "14",
          postalCode: "34600",
          city: "Bédarieux",
          phone: "04 67 95 34 56",
          status: "ACTIVE",
          isVerified: true,
          slug: "pharmacie-test",
          type: "SERVICE",
          latitude: 43.6148,
          longitude: 3.1569,
        },
      }),
    ]);

    // 5. Créer des événements
    console.log("🎉 Création d'événements de test...");
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 jours

    await Promise.all([
      prisma.event.create({
        data: {
          title: "Événement Test 1",
          description: "Premier événement de test",
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          slug: "evenement-test-1",
          status: "PUBLISHED",
          category: "CULTURAL",
          maxParticipants: 20,
          price: 25.00,
          placeId: places[0].id,
          organizerId: adminUser.id,
        },
      }),
      prisma.event.create({
        data: {
          title: "Événement Test 2",
          description: "Deuxième événement de test",
          startDate: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
          slug: "evenement-test-2",
          status: "PUBLISHED",
          category: "CONCERT",
          maxParticipants: 50,
          price: 15.00,
          placeId: places[1].id,
          organizerId: users[3].id,
        },
      }),
    ]);

    // 6. Créer quelques articles
    console.log("📝 Création d'articles de test...");
    await Promise.all([
      prisma.post.create({
        data: {
          title: "Bienvenue sur ABC Bédarieux",
          content: "Découvrez la nouvelle plateforme dédiée aux commerces et événements de Bédarieux...",
          excerpt: "La plateforme de référence pour découvrir Bédarieux",
          slug: "bienvenue-abc-bedarieux",
          status: "PUBLISHED",
          authorId: adminUser.id,
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.post.create({
        data: {
          title: "Les commerces locaux à l'honneur",
          content: "Focus sur l'économie locale et les initiatives des commerçants bédariciens...",
          excerpt: "Zoom sur l'activité commerciale locale",
          slug: "commerces-locaux-honneur",
          status: "PUBLISHED",
          authorId: users[1].id,
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // 7. Créer quelques favoris
    console.log("⭐ Création de favoris de test...");
    await Promise.all([
      prisma.favorite.create({
        data: {
          userId: users[0].id,
          placeId: places[0].id,
        },
      }),
      prisma.favorite.create({
        data: {
          userId: users[1].id,
          placeId: places[1].id,
        },
      }),
    ]);

    console.log("✅ Seed live terminé avec succès !");
    console.log(`
    📊 Données créées :
    - 1 administrateur (${adminUser.email})
    - 5 utilisateurs de test
    - Catégories de places (via script existant)
    - 3 établissements de test
    - 2 événements de test
    - 2 articles de test
    - 2 favoris de test
    `);

  } catch (error) {
    console.error("❌ Erreur lors du seed :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });