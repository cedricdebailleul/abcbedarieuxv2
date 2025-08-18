import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🌱 Début du seed de production...");

  try {
    // Supprimer les données existantes en ordre inverse des dépendances
    console.log("🧹 Nettoyage des données existantes...");
    await prisma.eventParticipant.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.gDPRRequest.deleteMany();
    await prisma.userConsent.deleteMany();
    await prisma.post.deleteMany();
    await prisma.event.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.placeClaim.deleteMany();
    await prisma.placeCategory.deleteMany();
    await prisma.place.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    // 1. Créer les badges
    console.log("🏆 Création des badges...");
    const badges = await Promise.all([
      prisma.badge.create({
        data: {
          title: "Bienvenue",
          description: "Badge obtenu lors de l'inscription sur la plateforme",
          color: "#3B82F6",
          category: "GENERAL",
          rarity: "COMMON",
        },
      }),
      prisma.badge.create({
        data: {
          title: "Premier pas",
          description: "Badge obtenu lors de la première connexion",
          color: "#10B981",
          category: "ACHIEVEMENT",
          rarity: "COMMON",
        },
      }),
      prisma.badge.create({
        data: {
          title: "Explorateur local",
          description: "Badge obtenu en visitant 5 établissements différents",
          color: "#F59E0B",
          category: "PARTICIPATION",
          rarity: "UNCOMMON",
        },
      }),
      prisma.badge.create({
        data: {
          title: "Critique gastronome",
          description: "Badge obtenu en laissant des avis sur 3 restaurants",
          color: "#EF4444",
          category: "SPECIAL",
          rarity: "RARE",
        },
      }),
    ]);

    // 2. Créer les catégories principales
    console.log("📂 Création des catégories principales...");
    const restaurantsCategory = await prisma.placeCategory.create({
      data: {
        name: "Restaurants",
        description: "Établissements de restauration et cafés",
        icon: "UtensilsCrossed",
        color: "#ef4444",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200",
        sortOrder: 1,
        slug: "restaurants",
      },
    });

    const commercesCategory = await prisma.placeCategory.create({
      data: {
        name: "Commerces",
        description: "Magasins et boutiques",
        icon: "Store",
        color: "#3b82f6",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        sortOrder: 2,
        slug: "commerces",
      },
    });

    const servicesCategory = await prisma.placeCategory.create({
      data: {
        name: "Services",
        description: "Services professionnels et publics",
        icon: "Briefcase",
        color: "#10b981",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        sortOrder: 3,
        slug: "services",
      },
    });

    // 3. Créer les sous-catégories
    console.log("📋 Création des sous-catégories...");
    const pizzeriaCategory = await prisma.placeCategory.create({
      data: {
        name: "Pizzeria",
        description: "Restaurants spécialisés en pizza",
        icon: "🍕",
        color: "#f97316",
        bgColor: "bg-orange-50",
        textColor: "text-orange-700",
        borderColor: "border-orange-200",
        sortOrder: 1,
        slug: "pizzeria",
        parentId: restaurantsCategory.id,
      },
    });

    const cafeCategory = await prisma.placeCategory.create({
      data: {
        name: "Café & Bar",
        description: "Cafés, bars et brasseries",
        icon: "☕",
        color: "#8b5cf6",
        bgColor: "bg-purple-50",
        textColor: "text-purple-700",
        borderColor: "border-purple-200",
        sortOrder: 2,
        slug: "cafe-bar",
        parentId: restaurantsCategory.id,
      },
    });

    const boulangerieCategory = await prisma.placeCategory.create({
      data: {
        name: "Boulangerie",
        description: "Boulangeries et pâtisseries",
        icon: "🥖",
        color: "#f59e0b",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700",
        borderColor: "border-yellow-200",
        sortOrder: 3,
        slug: "boulangerie",
        parentId: commercesCategory.id,
      },
    });

    const pharmacieCategory = await prisma.placeCategory.create({
      data: {
        name: "Pharmacie",
        description: "Pharmacies et parapharmacies",
        icon: "🏥",
        color: "#059669",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        sortOrder: 1,
        slug: "pharmacie",
        parentId: servicesCategory.id,
      },
    });

    // 4. Créer les utilisateurs
    console.log("👥 Création des utilisateurs...");
    const adminUser = await prisma.user.create({
      data: {
        name: "Cédric Debailleul",
        email: "cedric.debailleul62@gmail.com",
        emailVerified: true,
        role: "admin",
        slug: "cedric-debailleul",
        profile: {
          create: {
            bio: "Administrateur de la plateforme ABC Bédarieux",
            // location: "Bédarieux, France", // Removed as it is not part of the Profile model
            // website: "https://abc-bedarieux.fr", // Removed as it is not part of the Profile model
            socialLinks: JSON.stringify({
              github: "https://github.com/cedricdebailleul",
              linkedin: "https://linkedin.com/in/cedric-debailleul",
            }),
          },
        },
      },
    });

    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: "Marie Dupont",
          email: "marie.dupont@example.com",
          emailVerified: true,
          slug: "marie-dupont",
          profile: {
            create: {
              bio: "Passionnée de cuisine locale et de découvertes culinaires à Bédarieux",
              location: "Bédarieux",
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
              bio: "Commerçant local, toujours à la recherche de nouveaux partenaires",
              location: "Bédarieux",
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
              bio: "Modératrice de la communauté ABC Bédarieux",
              location: "Bédarieux",
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
              bio: "Organisateur d'événements locaux",
              location: "Bédarieux",
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
              bio: "Artisane locale, passionnée par les produits du terroir",
              location: "Bédarieux",
            },
          },
        },
      }),
    ]);

    // 5. Attribuer des badges aux utilisateurs
    console.log("🎖️ Attribution des badges...");
    await Promise.all([
      prisma.userBadge.create({
        data: {
          userId: adminUser.id,
          badgeId: badges[0].id,
          earnedAt: new Date(),
        },
      }),
      prisma.userBadge.create({
        data: {
          userId: adminUser.id,
          badgeId: badges[1].id,
          earnedAt: new Date(),
        },
      }),
      prisma.userBadge.create({
        data: {
          userId: users[0].id,
          badgeId: badges[0].id,
          earnedAt: new Date(),
        },
      }),
      prisma.userBadge.create({
        data: {
          userId: users[1].id,
          badgeId: badges[2].id,
          earnedAt: new Date(),
        },
      }),
    ]);

    // 6. Créer les places (établissements)
    console.log("🏪 Création des établissements...");

    const places = await Promise.all([
      // Restaurants
      prisma.place.create({
        data: {
          name: "La Table du Terroir",
          description:
            "Restaurant gastronomique proposant une cuisine du terroir avec des produits locaux. Spécialités régionales dans un cadre authentique.",
          address: "12 Rue de la République, 34600 Bédarieux",
          phone: "04 67 95 12 34",
          website: "https://latabledeterroir-bedarieux.fr",
          email: "contact@latabledeterroir.fr",
          status: "ACTIVE",
          isVerified: true,
          slug: "la-table-du-terroir",
          type: "RESTAURANT",
          latitude: 43.6147,
          longitude: 3.1567,
          openingHours: JSON.stringify({
            monday: {
              open: "12:00",
              close: "14:00",
              openEvening: "19:00",
              closeEvening: "22:00",
            },
            tuesday: {
              open: "12:00",
              close: "14:00",
              openEvening: "19:00",
              closeEvening: "22:00",
            },
            wednesday: { closed: true },
            thursday: {
              open: "12:00",
              close: "14:00",
              openEvening: "19:00",
              closeEvening: "22:00",
            },
            friday: {
              open: "12:00",
              close: "14:00",
              openEvening: "19:00",
              closeEvening: "22:30",
            },
            saturday: {
              open: "12:00",
              close: "14:30",
              openEvening: "19:00",
              closeEvening: "22:30",
            },
            sunday: { open: "12:00", close: "14:30" },
          }),
          socialLinks: JSON.stringify({
            facebook: "https://facebook.com/latabledeterroir",
            instagram: "https://instagram.com/latabledeterroir",
          }),
        },
      }),

      prisma.place.create({
        data: {
          name: "Pizzeria Bella Vista",
          description:
            "Pizzeria familiale avec pâte fraîche préparée quotidiennement. Terrasse avec vue sur les collines. Pizzas au feu de bois.",
          address: "25 Avenue de Lodève, 34600 Bédarieux",
          phone: "04 67 95 45 67",
          email: "bellavista@pizzeria.fr",
          status: "ACTIVE",
          isVerified: true,
          slug: "pizzeria-bella-vista",
          type: "RESTAURANT",
          latitude: 43.6155,
          longitude: 3.158,
          openingHours: JSON.stringify({
            monday: { closed: true },
            tuesday: { openEvening: "18:30", closeEvening: "22:00" },
            wednesday: { openEvening: "18:30", closeEvening: "22:00" },
            thursday: { openEvening: "18:30", closeEvening: "22:00" },
            friday: { openEvening: "18:30", closeEvening: "22:30" },
            saturday: {
              open: "12:00",
              close: "14:00",
              openEvening: "18:30",
              closeEvening: "22:30",
            },
            sunday: {
              open: "12:00",
              close: "14:00",
              openEvening: "18:30",
              closeEvening: "22:00",
            },
          }),
        },
      }),

      prisma.place.create({
        data: {
          name: "Café de la Place",
          description:
            "Café traditionnel au cœur de Bédarieux. Petite restauration, tapas et boissons. Terrasse ensoleillée sur la place principale.",
          address: "3 Place de la République, 34600 Bédarieux",
          phone: "04 67 95 23 45",
          status: "ACTIVE",
          isVerified: true,
          slug: "cafe-de-la-place",
          type: "COMMERCE",
          latitude: 43.615,
          longitude: 3.1575,
          openingHours: JSON.stringify({
            monday: { open: "07:00", close: "20:00" },
            tuesday: { open: "07:00", close: "20:00" },
            wednesday: { open: "07:00", close: "20:00" },
            thursday: { open: "07:00", close: "20:00" },
            friday: { open: "07:00", close: "22:00" },
            saturday: { open: "08:00", close: "22:00" },
            sunday: { open: "08:00", close: "20:00" },
          }),
          categories: {
            create: [
              { categoryId: restaurantsCategory.id },
              { categoryId: cafeCategory.id },
            ],
          },
        },
      }),

      // Commerces
      prisma.place.create({
        data: {
          name: "Boulangerie Artisanale Durand",
          description:
            "Boulangerie artisanale depuis 1985. Pain traditionnel, viennoiseries, pâtisseries. Spécialités locales et pain bio.",
          address: "18 Rue Jean Jaurès, 34600 Bédarieux",
          phone: "04 67 95 78 90",
          status: "ACTIVE",
          isVerified: true,
          slug: "boulangerie-durand",
          type: "COMMERCE",
          latitude: 43.6143,
          longitude: 3.1572,
          openingHours: JSON.stringify({
            monday: {
              open: "06:30",
              close: "13:00",
              openEvening: "15:30",
              closeEvening: "19:30",
            },
            tuesday: {
              open: "06:30",
              close: "13:00",
              openEvening: "15:30",
              closeEvening: "19:30",
            },
            wednesday: { closed: true },
            thursday: {
              open: "06:30",
              close: "13:00",
              openEvening: "15:30",
              closeEvening: "19:30",
            },
            friday: {
              open: "06:30",
              close: "13:00",
              openEvening: "15:30",
              closeEvening: "19:30",
            },
            saturday: {
              open: "06:30",
              close: "13:00",
              openEvening: "15:30",
              closeEvening: "19:30",
            },
            sunday: { open: "07:00", close: "13:00" },
          }),
          categories: {
            create: [
              { categoryId: commercesCategory.id },
              { categoryId: boulangerieCategory.id },
            ],
          },
        },
      }),

      prisma.place.create({
        data: {
          name: "Pharmacie Centrale",
          description:
            "Pharmacie au centre de Bédarieux. Services de parapharmacie, orthopédie, matériel médical. Préparations magistrales.",
          address: "14 Boulevard de la Liberté, 34600 Bédarieux",
          phone: "04 67 95 34 56",
          website: "https://pharmacie-centrale-bedarieux.fr",
          email: "contact@pharmacie-centrale.fr",
          status: "ACTIVE",
          isVerified: true,
          slug: "pharmacie-centrale",
          type: "SERVICE",
          latitude: 43.6148,
          longitude: 3.1569,
          openingHours: JSON.stringify({
            monday: {
              open: "08:30",
              close: "12:30",
              openEvening: "14:00",
              closeEvening: "19:30",
            },
            tuesday: {
              open: "08:30",
              close: "12:30",
              openEvening: "14:00",
              closeEvening: "19:30",
            },
            wednesday: {
              open: "08:30",
              close: "12:30",
              openEvening: "14:00",
              closeEvening: "19:30",
            },
            thursday: {
              open: "08:30",
              close: "12:30",
              openEvening: "14:00",
              closeEvening: "19:30",
            },
            friday: {
              open: "08:30",
              close: "12:30",
              openEvening: "14:00",
              closeEvening: "19:30",
            },
            saturday: {
              open: "08:30",
              close: "12:30",
              openEvening: "14:00",
              closeEvening: "19:00",
            },
            sunday: { closed: true },
          }),
          categories: {
            create: [
              { categoryId: servicesCategory.id },
              { categoryId: pharmacieCategory.id },
            ],
          },
        },
      }),

      prisma.place.create({
        data: {
          name: "Épicerie Bio Nature",
          description:
            "Épicerie bio et produits naturels. Fruits et légumes locaux, produits en vrac, cosmétiques naturels.",
          address: "7 Rue du Marché, 34600 Bédarieux",
          phone: "04 67 95 67 89",
          email: "contact@nature-bio.fr",
          status: "ACTIVE",
          isVerified: true,
          slug: "epicerie-bio-nature",
          type: "COMMERCE",
          latitude: 43.6145,
          longitude: 3.1573,
          openingHours: JSON.stringify({
            monday: {
              open: "09:00",
              close: "12:30",
              openEvening: "15:00",
              closeEvening: "19:00",
            },
            tuesday: {
              open: "09:00",
              close: "12:30",
              openEvening: "15:00",
              closeEvening: "19:00",
            },
            wednesday: { closed: true },
            thursday: {
              open: "09:00",
              close: "12:30",
              openEvening: "15:00",
              closeEvening: "19:00",
            },
            friday: {
              open: "09:00",
              close: "12:30",
              openEvening: "15:00",
              closeEvening: "19:00",
            },
            saturday: { open: "09:00", close: "18:00" },
            sunday: { closed: true },
          }),
          categories: {
            create: [{ categoryId: commercesCategory.id }],
          },
        },
      }),

      prisma.place.create({
        data: {
          name: "Bar Le Central",
          description:
            "Bar traditionnel avec ambiance conviviale. Billard, jeux, retransmissions sportives. Terrasse ombragée.",
          address: "9 Place Jean Moulin, 34600 Bédarieux",
          phone: "04 67 95 12 78",
          status: "ACTIVE",
          isVerified: true,
          slug: "bar-le-central",
          type: "COMMERCE",
          latitude: 43.6152,
          longitude: 3.1576,
          openingHours: JSON.stringify({
            monday: { open: "08:00", close: "21:00" },
            tuesday: { open: "08:00", close: "21:00" },
            wednesday: { open: "08:00", close: "21:00" },
            thursday: { open: "08:00", close: "21:00" },
            friday: { open: "08:00", close: "01:00" },
            saturday: { open: "08:00", close: "01:00" },
            sunday: { open: "09:00", close: "21:00" },
          }),
          categories: {
            create: [
              { categoryId: restaurantsCategory.id },
              { categoryId: cafeCategory.id },
            ],
          },
        },
      }),

      prisma.place.create({
        data: {
          name: "Librairie Papeterie du Centre",
          description:
            "Librairie généraliste avec rayon papeterie. Livres régionaux, presse, jeux, articles scolaires et de bureau.",
          address: "22 Rue de la Paix, 34600 Bédarieux",
          phone: "04 67 95 56 78",
          email: "librairie@centre-bedarieux.fr",
          status: "ACTIVE",
          isVerified: true,
          slug: "librairie-papeterie-centre",
          type: "COMMERCE",
          latitude: 43.6149,
          longitude: 3.1571,
          openingHours: JSON.stringify({
            monday: {
              open: "09:00",
              close: "12:00",
              openEvening: "14:00",
              closeEvening: "18:30",
            },
            tuesday: {
              open: "09:00",
              close: "12:00",
              openEvening: "14:00",
              closeEvening: "18:30",
            },
            wednesday: {
              open: "09:00",
              close: "12:00",
              openEvening: "14:00",
              closeEvening: "18:30",
            },
            thursday: {
              open: "09:00",
              close: "12:00",
              openEvening: "14:00",
              closeEvening: "18:30",
            },
            friday: {
              open: "09:00",
              close: "12:00",
              openEvening: "14:00",
              closeEvening: "18:30",
            },
            saturday: { open: "09:00", close: "18:00" },
            sunday: { closed: true },
          }),
          categories: {
            create: [{ categoryId: commercesCategory.id }],
          },
        },
      }),

      prisma.place.create({
        data: {
          name: "Coiffure & Style Beauté",
          description:
            "Salon de coiffure mixte. Coupe, coloration, soins capillaires. Service esthétique et manucure.",
          address: "16 Avenue de Béziers, 34600 Bédarieux",
          phone: "04 67 95 89 01",
          status: "ACTIVE",
          isVerified: true,
          slug: "coiffure-style-beaute",
          type: "SERVICE",
          latitude: 43.6144,
          longitude: 3.1578,
          openingHours: JSON.stringify({
            monday: { closed: true },
            tuesday: { open: "09:00", close: "18:00" },
            wednesday: { open: "09:00", close: "18:00" },
            thursday: { open: "09:00", close: "18:00" },
            friday: { open: "09:00", close: "19:00" },
            saturday: { open: "08:30", close: "17:00" },
            sunday: { closed: true },
          }),
          categories: {
            create: [{ categoryId: servicesCategory.id }],
          },
        },
      }),

      prisma.place.create({
        data: {
          name: "Restaurant L'Authentique",
          description:
            "Restaurant de spécialités méditerranéennes. Cuisine faite maison avec produits frais et de saison. Menu du jour.",
          address: "31 Rue des Jardins, 34600 Bédarieux",
          phone: "04 67 95 45 23",
          website: "https://restaurant-authentique.fr",
          email: "reservation@authentique.fr",
          status: "ACTIVE",
          isVerified: true,
          slug: "restaurant-authentique",
          type: "RESTAURANT",
          latitude: 43.6146,
          longitude: 3.1574,
          openingHours: JSON.stringify({
            monday: { closed: true },
            tuesday: {
              open: "12:00",
              close: "14:00",
              openEvening: "19:30",
              closeEvening: "21:30",
            },
            wednesday: {
              open: "12:00",
              close: "14:00",
              openEvening: "19:30",
              closeEvening: "21:30",
            },
            thursday: {
              open: "12:00",
              close: "14:00",
              openEvening: "19:30",
              closeEvening: "21:30",
            },
            friday: {
              open: "12:00",
              close: "14:00",
              openEvening: "19:30",
              closeEvening: "22:00",
            },
            saturday: {
              open: "12:00",
              close: "14:00",
              openEvening: "19:30",
              closeEvening: "22:00",
            },
            sunday: { open: "12:00", close: "14:00" },
          }),
          socialLinks: JSON.stringify({
            facebook: "https://facebook.com/authentique.bedarieux",
            instagram: "https://instagram.com/authentique_bedarieux",
          }),
          categories: {
            create: [{ categoryId: restaurantsCategory.id }],
          },
        },
      }),
    ]);

    // 7. Créer des événements
    console.log("🎉 Création des événements...");

    const currentDate = new Date();
    const futureDate1 = new Date(
      currentDate.getTime() + 7 * 24 * 60 * 60 * 1000
    ); // +7 jours
    const futureDate2 = new Date(
      currentDate.getTime() + 14 * 24 * 60 * 60 * 1000
    ); // +14 jours
    const futureDate3 = new Date(
      currentDate.getTime() + 21 * 24 * 60 * 60 * 1000
    ); // +21 jours

    await Promise.all([
      prisma.event.create({
        data: {
          title: "Soirée Dégustation - Vins et Terroir",
          description:
            "Découvrez les meilleurs vins de la région accompagnés de produits du terroir local. Dégustation commentée par un sommelier.",
          content:
            "Une soirée exceptionnelle vous attend à La Table du Terroir ! Notre sommelier vous guidera à travers une sélection de vins locaux accompagnés de fromages et charcuteries de la région. Places limitées, réservation obligatoire.",
          startDate: futureDate1,
          endDate: new Date(futureDate1.getTime() + 3 * 60 * 60 * 1000), // +3h
          slug: "soiree-degustation-vins-terroir",
          status: "PUBLISHED",
          category: "GASTRONOMIE",
          maxParticipants: 25,
          price: 35.0,
          placeId: places[0].id, // La Table du Terroir
          organizerId: adminUser.id,
          location: "La Table du Terroir",
          isRecurring: false,
        },
      }),

      prisma.event.create({
        data: {
          title: "Atelier Pizza - Apprenez avec le Chef",
          description:
            "Atelier culinaire pour apprendre à faire sa pizza comme un professionnel. Pâte fraîche et garnitures au choix.",
          content:
            "Rejoignez-nous pour un atelier pizza interactif ! Apprenez les secrets de notre pâte maison et créez votre propre pizza sous les conseils de notre chef pizzaïolo. Dégustation incluse avec boisson.",
          startDate: futureDate2,
          endDate: new Date(futureDate2.getTime() + 2 * 60 * 60 * 1000), // +2h
          slug: "atelier-pizza-chef",
          status: "PUBLISHED",
          category: "ATELIER",
          maxParticipants: 12,
          price: 25.0,
          placeId: places[1].id, // Pizzeria Bella Vista
          organizerId: users[3].id, // Jean-Luc Moreau
          location: "Pizzeria Bella Vista",
          isRecurring: false,
        },
      }),

      prisma.event.create({
        data: {
          title: "Marché Bio et Artisanal",
          description:
            "Marché hebdomadaire des producteurs locaux et artisans. Produits bio, créations artisanales et spécialités régionales.",
          content:
            "Tous les samedis matin, découvrez notre marché bio et artisanal sur la place de la République. Producteurs locaux, artisans créateurs, et bien plus encore !",
          startDate: new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 jours (samedi)
          endDate: new Date(
            currentDate.getTime() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000
          ), // +4h
          slug: "marche-bio-artisanal",
          status: "PUBLISHED",
          category: "MARCHE",
          price: 0, // Gratuit
          organizerId: users[4].id, // Claire Rousseau
          location: "Place de la République, Bédarieux",
          isRecurring: true,
          recurringPattern: "weekly",
        },
      }),

      prisma.event.create({
        data: {
          title: "Concert Jazz au Café de la Place",
          description:
            "Soirée jazz avec le trio 'Bédarieux Blues'. Ambiance intimiste et cocktails d'exception.",
          content:
            "Le Café de la Place vous invite à une soirée jazz exceptionnelle avec le trio local 'Bédarieux Blues'. Répertoire jazz classique et créations originales dans une ambiance chaleureuse. Cocktails et tapas disponibles.",
          startDate: futureDate3,
          endDate: new Date(futureDate3.getTime() + 3 * 60 * 60 * 1000), // +3h
          slug: "concert-jazz-cafe-place",
          status: "PUBLISHED",
          category: "CONCERT",
          maxParticipants: 40,
          price: 15.0,
          placeId: places[2].id, // Café de la Place
          organizerId: users[1].id, // Pierre Martin
          location: "Café de la Place",
          isRecurring: false,
        },
      }),
    ]);

    // 8. Créer quelques articles
    console.log("📝 Création des articles...");

    await Promise.all([
      prisma.post.create({
        data: {
          title: "Bédarieux, un terroir d'exception",
          content:
            "Découvrez les richesses gastronomiques de notre belle région...",
          excerpt:
            "Plongée dans l'univers culinaire local avec nos producteurs et chefs passionnés.",
          slug: "bedarieux-terroir-exception",
          status: "PUBLISHED",
          authorId: adminUser.id,
          featuredImage: "/images/terroir-bedarieux.jpg",
          tags: JSON.stringify(["terroir", "gastronomie", "producteurs"]),
          publishedAt: new Date(
            currentDate.getTime() - 2 * 24 * 60 * 60 * 1000
          ), // -2 jours
        },
      }),

      prisma.post.create({
        data: {
          title: "Les nouveaux commerces s'installent",
          content:
            "Tour d'horizon des dernières ouvertures qui dynamisent le centre-ville...",
          excerpt:
            "De nouvelles enseignes rejoignent l'écosystème commercial bédaricien.",
          slug: "nouveaux-commerces-installation",
          status: "PUBLISHED",
          authorId: users[1].id, // Pierre Martin
          featuredImage: "/images/commerces-bedarieux.jpg",
          tags: JSON.stringify(["commerce", "économie locale", "centre-ville"]),
          publishedAt: new Date(
            currentDate.getTime() - 5 * 24 * 60 * 60 * 1000
          ), // -5 jours
        },
      }),
    ]);

    // 9. Créer quelques favoris et claims
    console.log("⭐ Création des favoris et réclamations...");

    await Promise.all([
      prisma.favorite.create({
        data: {
          userId: users[0].id,
          placeId: places[0].id, // Marie aime La Table du Terroir
        },
      }),
      prisma.favorite.create({
        data: {
          userId: users[0].id,
          placeId: places[3].id, // Marie aime la boulangerie
        },
      }),
      prisma.favorite.create({
        data: {
          userId: users[1].id,
          placeId: places[1].id, // Pierre aime la pizzeria
        },
      }),
    ]);

    // Claim pour un propriétaire
    await prisma.placeClaim.create({
      data: {
        placeId: places[0].id, // La Table du Terroir
        userId: users[2].id, // Sophie Leclerc
        status: "APPROVED",
        message: "Je suis la propriétaire de cet établissement",
        reviewedAt: new Date(),
        reviewedBy: adminUser.id,
      },
    });

    console.log("✅ Seed terminé avec succès !");
    console.log(`
    📊 Données créées :
    - 1 administrateur (${adminUser.email})
    - 5 utilisateurs
    - 4 badges
    - 4 catégories principales + 4 sous-catégories
    - 10 établissements
    - 4 événements
    - 2 articles
    - 3 favoris
    - 1 réclamation approuvée
    `);
  } catch (error) {
    console.error("❌ Erreur lors du seed :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
