import { prisma } from "./prisma-client";

async function seedHistory() {
  try {
    console.log("🌱 Seeding history data...");

    // Créer la configuration principale
    const config = await prisma.historyConfig.create({
      data: {
        title: "Notre Histoire",
        subtitle: "Notre parcours",
        description: "De l'idée initiale à la plateforme d'aujourd'hui, découvrez le parcours d'ABC Bédarieux au service de l'économie locale.",
        visionTitle: "Et demain ?",
        visionDescription: "ABC Bédarieux continue d'évoluer pour mieux servir l'économie locale. Nouvelles fonctionnalités, partenariats renforcés, et toujours plus de services pour connecter habitants et commerçants de notre territoire.",
        primaryButtonText: "Découvrir nos partenaires",
        primaryButtonUrl: "/places",
        secondaryButtonText: "Nous rejoindre",
        secondaryButtonUrl: "/contact",
        isActive: true,
        updatedBy: "system", // Vous devrez peut-être ajuster avec un vrai ID d'utilisateur admin
      },
    });

    console.log("✅ Configuration créée:", config.id);

    // Créer les milestones (étapes clés)
    const milestones = [
      { number: "2019", label: "Année de création", icon: "Calendar", order: 1 },
      { number: "200+", label: "Établissements partenaires", icon: "Users", order: 2 },
      { number: "15+", label: "Communes couvertes", icon: "MapPin", order: 3 },
      { number: "5", label: "Années d'expérience", icon: "Star", order: 4 },
    ];

    for (const milestone of milestones) {
      const created = await prisma.historyMilestone.create({
        data: {
          ...milestone,
          configId: config.id,
        },
      });
      console.log(`✅ Milestone créée: ${created.number} - ${created.label}`);
    }

    // Créer les événements de timeline
    const timelineEvents = [
      {
        year: "2019",
        title: "L'idée prend forme",
        description: "Constatant le manque de visibilité des commerces locaux sur internet, l'idée d'ABC Bédarieux germe dans l'esprit de ses fondateurs.",
        icon: "Lightbulb",
        color: "bg-blue-100 text-blue-600",
        order: 1,
      },
      {
        year: "2020",
        title: "Lancement du projet",
        description: "Malgré les défis de la pandémie, ABC Bédarieux voit officiellement le jour avec les premiers référencements d'établissements locaux.",
        icon: "Rocket",
        color: "bg-green-100 text-green-600",
        order: 2,
      },
      {
        year: "2021",
        title: "Première communauté",
        description: "100 établissements rejoignent la plateforme. La communauté ABC Bédarieux prend forme et commence à créer du lien sur le territoire.",
        icon: "Users",
        color: "bg-purple-100 text-purple-600",
        order: 3,
      },
      {
        year: "2022",
        title: "Extension territoriale",
        description: "ABC Bédarieux étend son rayonnement aux communes voisines, créant un véritable réseau économique intercommunal.",
        icon: "Star",
        color: "bg-orange-100 text-orange-600",
        order: 4,
      },
      {
        year: "2023",
        title: "Reconnaissance locale",
        description: "La plateforme devient une référence incontournable, reconnue par les acteurs économiques et institutionnels du territoire.",
        icon: "Trophy",
        color: "bg-red-100 text-red-600",
        order: 5,
      },
      {
        year: "2024",
        title: "Aujourd'hui",
        description: "Plus de 200 établissements font confiance à ABC Bédarieux pour leur visibilité locale. L'aventure continue !",
        icon: "Heart",
        color: "bg-pink-100 text-pink-600",
        order: 6,
      },
    ];

    for (const event of timelineEvents) {
      const created = await prisma.historyTimelineEvent.create({
        data: {
          ...event,
          configId: config.id,
        },
      });
      console.log(`✅ Événement créé: ${created.year} - ${created.title}`);
    }

    console.log("\n🎉 Seeding terminé avec succès !");
    console.log(`📊 Résumé:`);
    console.log(`   - 1 configuration créée`);
    console.log(`   - ${milestones.length} étapes clés créées`);
    console.log(`   - ${timelineEvents.length} événements de timeline créés`);
    
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedHistory()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedHistory };