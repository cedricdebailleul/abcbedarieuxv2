import { prisma } from "./prisma-client";
import {
  EventStatus,
  EventCategory,
  PlaceStatus,
  ParticipationStatus,
  RecurrenceFrequency,
  UserStatus
} from "../lib/generated/prisma";

async function seedEvents() {
  try {
    console.log("🌱 Début du seed des événements...");

    // 1. Rechercher ou créer un utilisateur organisateur
    let organizer = await prisma.user.findFirst({
      where: {
        email: "organizer@example.com"
      }
    });

    if (!organizer) {
      console.log("Création de l'utilisateur organisateur...");
      organizer = await prisma.user.create({
        data: {
          name: "Alexandre Dupont",
          email: "organizer@example.com",
          emailVerified: true,
          slug: "alexandre-dupont",
          role: "user",
          status: UserStatus.ACTIVE,
          profile: {
            create: {
              firstname: "Alexandre",
              lastname: "Dupont",
              bio: "Organisateur d'événements culturels et musicaux à Bédarieux depuis plus de 10 ans.",
              phone: "06 12 34 56 78",
              isPublic: true,
              showEmail: true,
              showPhone: true,
              socials: {
                facebook: "https://facebook.com/alexandre.dupont.music",
                instagram: "https://instagram.com/alex_events_bedarieux"
              }
            }
          }
        }
      });
    }

    // 2. Rechercher la place "Black Bear Studio"
    let blackBearStudio = await prisma.place.findFirst({
      where: {
        name: { contains: "Black Bear", mode: "insensitive" }
      }
    });

    if (!blackBearStudio) {
      console.log("Création de la place Black Bear Studio...");
      blackBearStudio = await prisma.place.create({
        data: {
          name: "Black Bear Studio",
          slug: "black-bear-studio",
          type: "SERVICE",
          description: "Studio d'enregistrement professionnel équipé des dernières technologies. Nous proposons l'enregistrement, le mixage et le mastering pour tous styles musicaux.",
          summary: "Studio d'enregistrement professionnel à Bédarieux - Enregistrement, mixage, mastering",
          status: PlaceStatus.ACTIVE,
          isVerified: true,
          isActive: true,
          isFeatured: true,
          email: "contact@blackbearstudio.fr",
          phone: "04 67 95 12 34",
          website: "https://blackbearstudio.fr",
          street: "15 Avenue de la Musique",
          streetNumber: "15",
          postalCode: "34600",
          city: "Bédarieux",
          latitude: 43.6543,
          longitude: 3.1687,
          facebook: "https://facebook.com/blackbearstudiobedarieux",
          instagram: "https://instagram.com/blackbear_studio",
          coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
          logo: "https://images.unsplash.com/photo-1611532736797-de8db4246439?w=200&h=200&fit=crop",
          images: JSON.stringify([
            "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1519508234439-4f23643125c1?w=800&h=600&fit=crop"
          ]),
          metaTitle: "Black Bear Studio - Studio d'enregistrement à Bédarieux",
          metaDescription: "Studio d'enregistrement professionnel à Bédarieux. Enregistrement, mixage, mastering pour tous styles musicaux. Équipement haut de gamme."
        }
      });
    }

    // 3. Créer des événements de test

    // Événement 1: Concert live au studio (événement simple)
    console.log("Création de l'événement 'Concert Acoustique Live'...");
    const concertAcoustique = await prisma.event.create({
      data: {
        title: "Concert Acoustique Live",
        slug: "concert-acoustique-live-black-bear",
        description: `Venez découvrir une soirée acoustique exceptionnelle au Black Bear Studio ! 

Nous vous proposons une expérience musicale intime dans notre studio d'enregistrement professionnel, transformé pour l'occasion en salle de concert intimiste.

Au programme :
🎵 Performances acoustiques d'artistes locaux
🎸 Découverte d'instruments rares et vintage
🎤 Possibilité d'enregistrer votre propre session live
🍷 Apéritif et petites collations offertes

Une soirée unique dans un cadre exceptionnel, où la musique prend toute sa dimension !

Nombre de places limité à 30 personnes pour préserver l'intimité de l'expérience.

Artistes confirmés :
- Julie Martin (Folk/Indie)
- Les Frères Guitare (Duo acoustique)
- Sarah K (Singer-songwriter)

Parking gratuit disponible. Accès PMR.`,
        summary: "Soirée acoustique intimiste au Black Bear Studio avec des artistes locaux. Concert live dans un studio professionnel !",
        status: EventStatus.PUBLISHED,
        isPublished: true,
        isFeatured: true,
        organizerId: organizer.id,
        placeId: blackBearStudio.id,
        email: "events@blackbearstudio.fr",
        phone: "04 67 95 12 34",
        website: "https://blackbearstudio.fr/events",
        startDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
        endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4h plus tard
        isAllDay: false,
        timezone: "Europe/Paris",
        maxParticipants: 30,
        isFree: false,
        price: 25.00,
        priceDetails: "Adulte: 25€, Étudiant: 20€ (sur présentation de la carte), Enfant -12ans: gratuit",
        currency: "EUR",
        coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop"
        ]),
        videos: JSON.stringify([
          "https://www.youtube.com/embed/dQw4w9WgXcQ" // Exemple d'embed YouTube
        ]),
        metaTitle: "Concert Acoustique Live - Black Bear Studio Bédarieux",
        metaDescription: "Concert acoustique intimiste au Black Bear Studio avec des artistes locaux. Soirée unique dans un studio professionnel. Places limitées !",
        ogImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=630&fit=crop",
        facebook: "https://facebook.com/events/concert-acoustique-black-bear",
        instagram: "https://instagram.com/p/concert-acoustique-live",
        tags: JSON.stringify(["musique", "acoustique", "concert", "live", "studio", "intime", "artistes-locaux"]),
        category: EventCategory.CONCERT
      }
    });

    // Événement 2: Atelier d'enregistrement (événement récurrent hebdomadaire)
    console.log("Création de l'événement récurrent 'Ateliers d'Enregistrement'...");
    
    // D'abord créer la règle de récurrence
    const recurrenceRule = await prisma.recurrenceRule.create({
      data: {
        frequency: RecurrenceFrequency.WEEKLY,
        interval: 1, // Chaque semaine
        count: 12, // 12 occurrences (3 mois)
        byWeekDay: JSON.stringify([6]), // Samedi (6)
        workdaysOnly: false
      }
    });

    const atelierEnregistrement = await prisma.event.create({
      data: {
        title: "Ateliers d'Enregistrement - Découvrez le Studio",
        slug: "ateliers-enregistrement-decouverte",
        description: `Participez à nos ateliers d'enregistrement tous les samedis !

Ces ateliers s'adressent à tous les musiciens, débutants ou confirmés, qui souhaitent :
🎵 Découvrir l'univers de l'enregistrement studio
🎛️ Apprendre les bases du mixage et mastering
🎤 Enregistrer vos propres compositions
🎸 Comprendre le fonctionnement d'un studio professionnel

Programme type (3h d'atelier) :
• 9h00-10h00 : Présentation du matériel et visite du studio
• 10h00-11h30 : Session d'enregistrement pratique
• 11h30-12h00 : Initiation au mixage et écoute des prises

Matériel fourni :
- Microphones professionnels
- Instruments (guitares, basse, batterie)
- Casques de monitoring
- Supports pédagogiques

Apportez vos propres instruments si vous le souhaitez !

Chaque participant repart avec l'enregistrement de sa session.

Groupe limité à 8 participants pour un encadrement personnalisé.`,
        summary: "Ateliers d'enregistrement hebdomadaires au Black Bear Studio. Apprenez les techniques de studio et enregistrez vos morceaux !",
        status: EventStatus.PUBLISHED,
        isPublished: true,
        isFeatured: false,
        organizerId: organizer.id,
        placeId: blackBearStudio.id,
        email: "ateliers@blackbearstudio.fr",
        phone: "04 67 95 12 34",
        website: "https://blackbearstudio.fr/ateliers",
        ticketUrl: "https://www.eventbrite.com/e/ateliers-enregistrement-black-bear",
        startDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours (samedi prochain)
        endDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3h plus tard
        isAllDay: false,
        timezone: "Europe/Paris",
        maxParticipants: 8,
        isFree: false,
        price: 45.00,
        priceDetails: "Tarif unique: 45€ (matériel et enregistrement inclus)",
        currency: "EUR",
        coverImage: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=600&fit=crop",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1519508234439-4f23643125c1?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=600&fit=crop"
        ]),
        metaTitle: "Ateliers d'Enregistrement - Black Bear Studio",
        metaDescription: "Ateliers d'enregistrement hebdomadaires au Black Bear Studio. Apprenez les techniques de studio, 8 participants max. Tous niveaux bienvenus.",
        ogImage: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=630&fit=crop",
        instagram: "https://instagram.com/explore/tags/atelierstudio",
        tags: JSON.stringify(["atelier", "enregistrement", "formation", "studio", "musique", "apprentissage", "technique"]),
        category: EventCategory.WORKSHOP,
        isRecurring: true,
        recurrenceRuleId: recurrenceRule.id
      }
    });

    // Événement 3: Festival de musique (événement multi-jours)
    console.log("Création du festival 'Bédarieux Music Days'...");
    const festivalStart = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000); // Dans 30 jours
    const festivalEnd = new Date(festivalStart.getTime() + 2 * 24 * 60 * 60 * 1000); // 3 jours plus tard

    const festival = await prisma.event.create({
      data: {
        title: "Bédarieux Music Days - Festival 2024",
        slug: "bedarieux-music-days-2024",
        description: `Le plus grand festival de musique de Bédarieux revient pour sa 5ème édition !

3 jours de musique non-stop avec des artistes locaux et nationaux, dans un cadre exceptionnel mêlant lieux emblématiques de la ville et notre studio Black Bear.

🎪 PROGRAMMATION :

JOUR 1 - VENDREDI : "Soirée Découverte"
• 18h-20h : Plateau jeunes talents (Black Bear Studio)
• 20h-22h : Concert folk/indie (Place de la République)
• 22h-00h : DJ Set électro (Black Bear Studio)

JOUR 2 - SAMEDI : "Journée Festive"
• 14h-16h : Ateliers musicaux familles
• 16h-18h : Concert rock/pop
• 18h-20h : Apéro-concert jazz
• 20h-23h : Têtes d'affiche nationales
• 23h-02h : After-party

JOUR 3 - DIMANCHE : "Clôture en Beauté"
• 11h-13h : Brunch musical
• 14h-17h : Concerts acoustiques
• 17h-19h : Cérémonie de clôture

🎫 PASS FESTIVAL inclut :
- Accès à tous les concerts
- Ateliers et masterclasses
- Restauration partenaire (tarifs préférentiels)
- Accès backstage pour les VIP
- Goodies exclusifs

🚗 Navettes gratuites entre les différents lieux
🍽️ Food trucks et stands locaux
🎨 Expositions d'artistes locaux
👶 Espace famille et garde d'enfants`,
        summary: "Le festival incontournable de Bédarieux ! 3 jours de musique avec des artistes locaux et nationaux. 5ème édition au Black Bear Studio.",
        status: EventStatus.PUBLISHED,
        isPublished: true,
        isFeatured: true,
        organizerId: organizer.id,
        placeId: blackBearStudio.id,
        email: "festival@bedarieuxmusicdays.fr",
        phone: "04 67 95 12 34",
        website: "https://bedarieuxmusicdays.fr",
        ticketUrl: "https://www.ticketmaster.fr/bedarieux-music-days-2024",
        startDate: festivalStart,
        endDate: festivalEnd,
        isAllDay: false,
        timezone: "Europe/Paris",
        locationName: "Black Bear Studio & Centre-ville de Bédarieux",
        locationAddress: "15 Avenue de la Musique et centre-ville",
        locationCity: "Bédarieux",
        locationLatitude: 43.6543,
        locationLongitude: 3.1687,
        maxParticipants: 500,
        isFree: false,
        price: 89.00,
        priceDetails: "Pass 3 jours: 89€, Pass jour: 35€, Tarif réduit étudiant: 65€, VIP: 150€",
        currency: "EUR",
        coverImage: "https://images.unsplash.com/photo-1549451371-64aa98a6f632?w=1200&h=600&fit=crop",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&h=600&fit=crop"
        ]),
        videos: JSON.stringify([
          "https://www.youtube.com/embed/festival-teaser-2024",
          "https://www.youtube.com/embed/best-of-festival-2023"
        ]),
        metaTitle: "Bédarieux Music Days 2024 - Festival de Musique",
        metaDescription: "5ème édition du festival Bédarieux Music Days ! 3 jours de concerts avec artistes locaux et nationaux. Black Bear Studio et centre-ville.",
        ogImage: "https://images.unsplash.com/photo-1549451371-64aa98a6f632?w=1200&h=630&fit=crop",
        facebook: "https://facebook.com/BedarieuxMusicDays",
        instagram: "https://instagram.com/bedarieux_music_days",
        twitter: "https://twitter.com/BMD_Festival",
        tiktok: "https://tiktok.com/@bedarieux_music",
        tags: JSON.stringify(["festival", "musique", "bedarieux", "3-jours", "concert", "live", "artistes", "local", "national"]),
        category: EventCategory.FESTIVAL
      }
    });

    // 4. Créer quelques participants pour les événements
    console.log("Création de participants de test...");
    
    // Créer quelques utilisateurs participants s'ils n'existent pas
    const participants = await Promise.all([
      prisma.user.upsert({
        where: { email: "julie.martin@example.com" },
        update: {},
        create: {
          name: "Julie Martin",
          email: "julie.martin@example.com",
          emailVerified: true,
          slug: "julie-martin",
          role: "user",
          status: UserStatus.ACTIVE
        }
      }),
      prisma.user.upsert({
        where: { email: "pierre.dubois@example.com" },
        update: {},
        create: {
          name: "Pierre Dubois",
          email: "pierre.dubois@example.com",
          emailVerified: true,
          slug: "pierre-dubois",
          role: "user",
          status: UserStatus.ACTIVE
        }
      }),
      prisma.user.upsert({
        where: { email: "marie.lambert@example.com" },
        update: {},
        create: {
          name: "Marie Lambert",
          email: "marie.lambert@example.com",
          emailVerified: true,
          slug: "marie-lambert",
          role: "user",
          status: UserStatus.ACTIVE
        }
      })
    ]);

    // Ajouter des participations
    await prisma.eventParticipant.createMany({
      data: [
        // Concert acoustique
        {
          eventId: concertAcoustique.id,
          userId: participants[0].id,
          status: ParticipationStatus.GOING,
          guestCount: 1,
          specialNeeds: "Régime végétarien"
        },
        {
          eventId: concertAcoustique.id,
          userId: participants[1].id,
          status: ParticipationStatus.GOING,
          guestCount: 0
        },
        {
          eventId: concertAcoustique.id,
          userId: participants[2].id,
          status: ParticipationStatus.INTERESTED,
          guestCount: 2
        },
        
        // Ateliers d'enregistrement
        {
          eventId: atelierEnregistrement.id,
          userId: participants[0].id,
          status: ParticipationStatus.GOING,
          guestCount: 0,
          specialNeeds: "Débutant complet en enregistrement"
        },
        {
          eventId: atelierEnregistrement.id,
          userId: participants[1].id,
          status: ParticipationStatus.GOING,
          guestCount: 0
        },
        
        // Festival
        {
          eventId: festival.id,
          userId: participants[0].id,
          status: ParticipationStatus.GOING,
          guestCount: 2
        },
        {
          eventId: festival.id,
          userId: participants[1].id,
          status: ParticipationStatus.GOING,
          guestCount: 1
        },
        {
          eventId: festival.id,
          userId: participants[2].id,
          status: ParticipationStatus.MAYBE,
          guestCount: 0
        }
      ],
      skipDuplicates: true
    });

    // Mettre à jour les compteurs de participants
    await Promise.all([
      prisma.event.update({
        where: { id: concertAcoustique.id },
        data: { participantCount: 3 }
      }),
      prisma.event.update({
        where: { id: atelierEnregistrement.id },
        data: { participantCount: 2 }
      }),
      prisma.event.update({
        where: { id: festival.id },
        data: { participantCount: 3 }
      })
    ]);

    console.log("✅ Seed des événements terminé avec succès !");
    console.log(`
📅 Événements créés :
- ${concertAcoustique.title} (${concertAcoustique.slug})
- ${atelierEnregistrement.title} (${atelierEnregistrement.slug}) - RÉCURRENT
- ${festival.title} (${festival.slug}) - MULTI-JOURS

🏢 Place liée :
- ${blackBearStudio.name} (${blackBearStudio.slug})

👤 Organisateur :
- ${organizer.name} (${organizer.email})

👥 Participants créés : ${participants.length}

🌐 Vous pouvez maintenant :
- Consulter l'agenda : http://localhost:3000/events
- Voir les détails : http://localhost:3000/events/[slug]
- Gérer depuis le dashboard : http://localhost:3000/dashboard/events
    `);

  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seed si appelé directement
if (require.main === module) {
  seedEvents()
    .then(() => {
      console.log("🎉 Seed terminé !");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erreur fatale:", error);
      process.exit(1);
    });
}

export { seedEvents };