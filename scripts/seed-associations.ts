import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🏛️ Début du seed des associations...");

  try {
    // Vérifier que les catégories de places existent
    console.log("🔍 Vérification des catégories de places...");
    let categories = await prisma.placeCategory.findMany({
      where: {
        name: {
          in: ["Associations", "Culture", "Sport", "Social", "Éducation"]
        }
      }
    });

    if (categories.length === 0) {
      console.log("⚠️ Aucune catégorie de place trouvée. Création des catégories de base...");
      
      // Créer les catégories si elles n'existent pas
      const associationCategory = await prisma.placeCategory.create({
        data: {
          name: "Associations",
          slug: "associations",
          icon: "Users",
          color: "#6366f1",
          description: "Associations locales et organisations communautaires"
        }
      });

      const cultureCategory = await prisma.placeCategory.create({
        data: {
          name: "Culture",
          slug: "culture", 
          icon: "Palette",
          color: "#8b5cf6",
          description: "Activités culturelles et artistiques",
          parentId: associationCategory.id
        }
      });

      const sportCategory = await prisma.placeCategory.create({
        data: {
          name: "Sport",
          slug: "sport",
          icon: "Trophy", 
          color: "#10b981",
          description: "Clubs et activités sportives",
          parentId: associationCategory.id
        }
      });

      categories = [associationCategory, cultureCategory, sportCategory];
    }

    // Coordonnées pour 1 rue de la République, Bédarieux
    const latitude = 43.6108;
    const longitude = 3.1612;

    // Créer les 5 associations
    console.log("🏛️ Création des associations au 1 rue de la République...");
    
    const associations = await Promise.all([
      prisma.place.create({
        data: {
          name: "Association Sportive Bédarieux",
          description: "Club omnisports proposant diverses activités : football, basket-ball, tennis de table et gymnastique. Ouvert à tous les âges, de l'école de sport aux seniors. Formation d'éducateurs sportifs et organisation de tournois locaux.",
          summary: "Club omnisports local avec activités variées pour tous âges",
          street: "1 rue de la République",
          streetNumber: "1",
          postalCode: "34600",
          city: "Bédarieux",
          phone: "04 67 95 78 90",
          email: "contact@asbedarieux.org",
          website: "https://asbedarieux.org",
          status: "ACTIVE",
          isActive: true,
          isVerified: false, // Association à revendiquer
          slug: "association-sportive-bedarieux",
          type: "ASSOCIATION",
          latitude,
          longitude,
          openingHours: {
            create: [
              { dayOfWeek: "MONDAY", isClosed: false, openTime: "18:00", closeTime: "21:00" },
              { dayOfWeek: "TUESDAY", isClosed: false, openTime: "18:00", closeTime: "21:00" },
              { dayOfWeek: "WEDNESDAY", isClosed: false, openTime: "14:00", closeTime: "17:00" },
              { dayOfWeek: "THURSDAY", isClosed: false, openTime: "18:00", closeTime: "21:00" },
              { dayOfWeek: "FRIDAY", isClosed: false, openTime: "18:00", closeTime: "21:00" },
              { dayOfWeek: "SATURDAY", isClosed: false, openTime: "09:00", closeTime: "12:00" },
              { dayOfWeek: "SUNDAY", isClosed: true },
            ]
          }
        }
      }),

      prisma.place.create({
        data: {
          name: "Chorale Les Voix du Languedoc",
          description: "Chorale associative regroupant 45 membres passionnés de chant choral. Répertoire varié : chants traditionnels, gospel, musique contemporaine. Concerts réguliers et participation aux festivals régionaux. Cours de technique vocale.",
          summary: "Chorale de 45 membres avec répertoire varié et concerts réguliers",
          street: "1 rue de la République",
          streetNumber: "1",
          postalCode: "34600",
          city: "Bédarieux",
          phone: "04 67 95 82 15",
          email: "lesvoixdulanguedoc@gmail.com",
          facebook: "https://facebook.com/voixdulanguedoc",
          status: "ACTIVE",
          isActive: true,
          isVerified: false, // Association à revendiquer
          slug: "chorale-les-voix-du-languedoc",
          type: "ASSOCIATION",
          latitude,
          longitude,
          openingHours: {
            create: [
              { dayOfWeek: "MONDAY", isClosed: true },
              { dayOfWeek: "TUESDAY", isClosed: false, openTime: "20:00", closeTime: "22:00" },
              { dayOfWeek: "WEDNESDAY", isClosed: true },
              { dayOfWeek: "THURSDAY", isClosed: false, openTime: "20:00", closeTime: "22:00" },
              { dayOfWeek: "FRIDAY", isClosed: true },
              { dayOfWeek: "SATURDAY", isClosed: true },
              { dayOfWeek: "SUNDAY", isClosed: true },
            ]
          }
        }
      }),

      prisma.place.create({
        data: {
          name: "Secours Populaire - Antenne Bédarieux",
          description: "Association de solidarité luttant contre la précarité et l'exclusion. Distribution alimentaire, aide vestimentaire, soutien aux familles en difficulté. Organisation d'activités pour les enfants et accompagnement social.",
          summary: "Association de solidarité contre la précarité et l'exclusion",
          street: "1 rue de la République",
          streetNumber: "1",
          postalCode: "34600",
          city: "Bédarieux",
          phone: "04 67 95 91 23",
          email: "bedarieux@secourspopulaire34.org",
          website: "https://secourspopulaire.fr",
          status: "ACTIVE",
          isActive: true,
          isVerified: false, // Association à revendiquer
          slug: "secours-populaire-bedarieux",
          type: "ASSOCIATION",
          latitude,
          longitude,
          openingHours: {
            create: [
              { dayOfWeek: "MONDAY", isClosed: false, openTime: "14:00", closeTime: "17:00" },
              { dayOfWeek: "TUESDAY", isClosed: true },
              { dayOfWeek: "WEDNESDAY", isClosed: false, openTime: "14:00", closeTime: "17:00" },
              { dayOfWeek: "THURSDAY", isClosed: true },
              { dayOfWeek: "FRIDAY", isClosed: false, openTime: "14:00", closeTime: "17:00" },
              { dayOfWeek: "SATURDAY", isClosed: false, openTime: "09:00", closeTime: "12:00" },
              { dayOfWeek: "SUNDAY", isClosed: true },
            ]
          }
        }
      }),

      prisma.place.create({
        data: {
          name: "Club Photo Objectif Bédarieux",
          description: "Club de photographie amateur réunissant passionnés débutants et confirmés. Sorties photo, ateliers technique, concours internes, exposition annuelle. Matériel professionnel mis à disposition des adhérents.",
          summary: "Club photo avec sorties, ateliers et exposition annuelle",
          street: "1 rue de la République",
          streetNumber: "1",
          postalCode: "34600",
          city: "Bédarieux",
          phone: "04 67 95 67 45",
          email: "objectif.bedarieux@club-photo.fr",
          instagram: "https://instagram.com/objectifbedarieux",
          status: "ACTIVE",
          isActive: true,
          isVerified: false, // Association à revendiquer
          slug: "club-photo-objectif-bedarieux",
          type: "ASSOCIATION",
          latitude,
          longitude,
          openingHours: {
            create: [
              { dayOfWeek: "MONDAY", isClosed: true },
              { dayOfWeek: "TUESDAY", isClosed: true },
              { dayOfWeek: "WEDNESDAY", isClosed: false, openTime: "19:00", closeTime: "21:30" },
              { dayOfWeek: "THURSDAY", isClosed: true },
              { dayOfWeek: "FRIDAY", isClosed: true },
              { dayOfWeek: "SATURDAY", isClosed: false, openTime: "14:00", closeTime: "18:00" },
              { dayOfWeek: "SUNDAY", isClosed: true },
            ]
          }
        }
      }),

      prisma.place.create({
        data: {
          name: "Les Amis de la Bibliothèque",
          description: "Association de bénévoles soutenant la bibliothèque municipale. Organisation d'événements littéraires, club de lecture, café littéraire mensuel, bourse aux livres. Animation d'ateliers d'écriture créative.",
          summary: "Soutien à la bibliothèque avec événements et ateliers littéraires",
          street: "1 rue de la République",
          streetNumber: "1",
          postalCode: "34600",
          city: "Bédarieux",
          phone: "04 67 95 44 78",
          email: "amis.bibliotheque.bedarieux@gmail.com",
          status: "ACTIVE",
          isActive: true,
          isVerified: false, // Association à revendiquer
          slug: "les-amis-de-la-bibliotheque",
          type: "ASSOCIATION",
          latitude,
          longitude,
          openingHours: {
            create: [
              { dayOfWeek: "MONDAY", isClosed: true },
              { dayOfWeek: "TUESDAY", isClosed: false, openTime: "18:30", closeTime: "20:30" },
              { dayOfWeek: "WEDNESDAY", isClosed: true },
              { dayOfWeek: "THURSDAY", isClosed: false, openTime: "18:30", closeTime: "20:30" },
              { dayOfWeek: "FRIDAY", isClosed: true },
              { dayOfWeek: "SATURDAY", isClosed: false, openTime: "10:00", closeTime: "12:00" },
              { dayOfWeek: "SUNDAY", isClosed: true },
            ]
          }
        }
      }),
    ]);

    // Associer les associations aux catégories
    console.log("🔗 Association des catégories...");
    const associationCategory = categories.find(c => c.name === "Associations");
    const cultureCategory = categories.find(c => c.name === "Culture");
    const sportCategory = categories.find(c => c.name === "Sport");

    if (associationCategory) {
      await Promise.all([
        // Association Sportive Bédarieux -> Sport
        prisma.placeToCategory.create({
          data: {
            placeId: associations[0].id,
            categoryId: sportCategory?.id || associationCategory.id
          }
        }),

        // Chorale -> Culture
        prisma.placeToCategory.create({
          data: {
            placeId: associations[1].id,
            categoryId: cultureCategory?.id || associationCategory.id
          }
        }),

        // Secours Populaire -> Associations (général)
        prisma.placeToCategory.create({
          data: {
            placeId: associations[2].id,
            categoryId: associationCategory.id
          }
        }),

        // Club Photo -> Culture
        prisma.placeToCategory.create({
          data: {
            placeId: associations[3].id,
            categoryId: cultureCategory?.id || associationCategory.id
          }
        }),

        // Amis de la Bibliothèque -> Culture
        prisma.placeToCategory.create({
          data: {
            placeId: associations[4].id,
            categoryId: cultureCategory?.id || associationCategory.id
          }
        }),
      ]);
    }

    console.log("✅ Seed des associations terminé avec succès !");
    console.log(`📍 ${associations.length} associations créées au 1 rue de la République, Bédarieux`);
    console.log("🔍 Associations prêtes à être revendiquées (ownerId: null)");
    console.log("📍 Toutes les associations partageront la même adresse pour tester le clustering");

    associations.forEach((association, index) => {
      console.log(`   ${index + 1}. ${association.name} (${association.slug})`);
    });

  } catch (error) {
    console.error("❌ Erreur lors du seed :", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();