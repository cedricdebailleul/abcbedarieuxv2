import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🌱 Début du seed de production...");

  try {
    // Supprimer les données existantes
    console.log("🧹 Nettoyage des données existantes...");
    await prisma.eventParticipant.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.gDPRRequest.deleteMany();
    await prisma.userConsent.deleteMany();
    await prisma.post.deleteMany();
    await prisma.event.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.placeClaim.deleteMany();
    await prisma.placeToCategory.deleteMany();
    await prisma.place.deleteMany();
    await prisma.placeCategory.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    // 1. Créer l'administrateur

    console.log("👑 Création de l'administrateur...");
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
            address: "Bédarieux, France",
            socials: JSON.stringify({
              website: "https://abc-bedarieux.fr",
            }),
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
              bio: "Passionnée de cuisine locale et de découvertes culinaires à Bédarieux",
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
              bio: "Commerçant local, toujours à la recherche de nouveaux partenaires",
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
              bio: "Modératrice de la communauté ABC Bédarieux",
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
              bio: "Organisateur d'événements locaux",
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
              bio: "Artisane locale, passionnée par les produits du terroir",
              address: "Bédarieux",
            },
          },
        },
      }),
    ]);

    // 3. Créer les catégories principales
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

    // 4. Créer les sous-catégories
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

    // 5. Créer les établissements
    console.log("🏪 Création des établissements...");
    const places = await Promise.all([
      // Restaurant gastronomique
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
        },
      }),

      // Pizzeria
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

      // Café
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
        },
      }),

      // Boulangerie
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
        },
      }),

      // Pharmacie
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
        },
      }),

      // Bar
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
        },
      }),

      // Restaurant 2
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
        },
      }),

      // Librairie
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
        },
      }),

      // Coiffeur
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
        },
      }),

      // Épicerie bio
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
        },
      }),
    ]);

    // 6. Créer les relations place-category
    console.log("🔗 Création des relations places-catégories...");
    await Promise.all([
      // La Table du Terroir - Restaurant
      prisma.placeToCategory.create({
        data: { placeId: places[0].id, categoryId: restaurantsCategory.id },
      }),

      // Pizzeria Bella Vista - Restaurant + Pizzeria
      prisma.placeToCategory.create({
        data: { placeId: places[1].id, categoryId: restaurantsCategory.id },
      }),
      prisma.placeToCategory.create({
        data: { placeId: places[1].id, categoryId: pizzeriaCategory.id },
      }),

      // Café de la Place - Restaurant + Café
      prisma.placeToCategory.create({
        data: { placeId: places[2].id, categoryId: restaurantsCategory.id },
      }),
      prisma.placeToCategory.create({
        data: { placeId: places[2].id, categoryId: cafeCategory.id },
      }),

      // Boulangerie - Commerce + Boulangerie
      prisma.placeToCategory.create({
        data: { placeId: places[3].id, categoryId: commercesCategory.id },
      }),
      prisma.placeToCategory.create({
        data: { placeId: places[3].id, categoryId: boulangerieCategory.id },
      }),

      // Pharmacie - Service + Pharmacie
      prisma.placeToCategory.create({
        data: { placeId: places[4].id, categoryId: servicesCategory.id },
      }),
      prisma.placeToCategory.create({
        data: { placeId: places[4].id, categoryId: pharmacieCategory.id },
      }),

      // Bar Le Central - Restaurant + Café
      prisma.placeToCategory.create({
        data: { placeId: places[5].id, categoryId: restaurantsCategory.id },
      }),
      prisma.placeToCategory.create({
        data: { placeId: places[5].id, categoryId: cafeCategory.id },
      }),

      // Restaurant L'Authentique - Restaurant
      prisma.placeToCategory.create({
        data: { placeId: places[6].id, categoryId: restaurantsCategory.id },
      }),

      // Librairie - Commerce
      prisma.placeToCategory.create({
        data: { placeId: places[7].id, categoryId: commercesCategory.id },
      }),

      // Coiffeur - Service
      prisma.placeToCategory.create({
        data: { placeId: places[8].id, categoryId: servicesCategory.id },
      }),

      // Épicerie bio - Commerce
      prisma.placeToCategory.create({
        data: { placeId: places[9].id, categoryId: commercesCategory.id },
      }),
    ]);

    // 7. Créer quelques événements
    console.log("🎉 Création des événements...");
    const futureDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 jours
    const futureDate2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +14 jours

    await Promise.all([
      prisma.event.create({
        data: {
          title: "Soirée Dégustation - Vins et Terroir",
          description:
            "Découvrez les meilleurs vins de la région accompagnés de produits du terroir local.",
          content:
            "Une soirée exceptionnelle vous attend ! Dégustation commentée par un sommelier.",
          startDate: futureDate1,
          endDate: new Date(futureDate1.getTime() + 3 * 60 * 60 * 1000),
          slug: "soiree-degustation-vins-terroir",
          status: "PUBLISHED",
          category: "GASTRONOMIE",
          maxParticipants: 25,
          price: 35.0,
          placeId: places[0].id, // La Table du Terroir
          organizerId: adminUser.id,
          location: "La Table du Terroir",
        },
      }),

      prisma.event.create({
        data: {
          title: "Atelier Pizza - Apprenez avec le Chef",
          description:
            "Atelier culinaire pour apprendre à faire sa pizza comme un professionnel.",
          content:
            "Apprenez les secrets de notre pâte maison et créez votre propre pizza.",
          startDate: futureDate2,
          endDate: new Date(futureDate2.getTime() + 2 * 60 * 60 * 1000),
          slug: "atelier-pizza-chef",
          status: "PUBLISHED",
          category: "ATELIER",
          maxParticipants: 12,
          price: 25.0,
          placeId: places[1].id, // Pizzeria Bella Vista
          organizerId: users[3].id, // Jean-Luc Moreau
          location: "Pizzeria Bella Vista",
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
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // -2 jours
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
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // -5 jours
        },
      }),
    ]);

    // 9. Créer quelques favoris
    console.log("⭐ Création des favoris...");
    await Promise.all([
      prisma.favorite.create({
        data: {
          userId: users[0].id, // Marie
          placeId: places[0].id, // La Table du Terroir
        },
      }),
      prisma.favorite.create({
        data: {
          userId: users[0].id, // Marie
          placeId: places[3].id, // Boulangerie
        },
      }),
      prisma.favorite.create({
        data: {
          userId: users[1].id, // Pierre
          placeId: places[1].id, // Pizzeria
        },
      }),
    ]);

    console.log("✅ Seed terminé avec succès !");
    console.log(`
    📊 Données créées :
    - 1 administrateur (${adminUser.email})
    - 5 utilisateurs
    - 8 catégories (4 principales + 4 sous-catégories)
    - 10 établissements avec leurs relations
    - 2 événements
    - 2 articles
    - 3 favoris
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
