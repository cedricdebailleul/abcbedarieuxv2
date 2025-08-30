import { BadgeCategory, BadgeRarity, PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

const badges = [
  {
    id: "welcome",
    title: "Bienvenue",
    description: "Badge obtenu lors de l'inscription sur la plateforme",
    color: "#3B82F6",
    category: BadgeCategory.GENERAL,
    rarity: BadgeRarity.COMMON,
  },
  {
    id: "first_place",
    title: "Premier pas",
    description: "Badge obtenu lors de la première connexion",
    color: "#10B981",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.COMMON,
  },
  {
    id: "profile_complete",
    title: "Profil complété",
    description: "Badge obtenu lorsque le profil est entièrement rempli",
    color: "#F59E0B",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.UNCOMMON,
  },
  {
    title: "Premier article",
    description: "Badge obtenu lors de la publication du premier article",
    color: "#8B5CF6",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.UNCOMMON,
  },
  {
    title: "Contributeur actif",
    description: "Badge obtenu après 10 publications",
    color: "#EF4444",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.RARE,
  },
  {
    title: "Expert",
    description: "Badge obtenu après 50 publications",
    color: "#F97316",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.EPIC,
  },
  {
    title: "Légende",
    description: "Badge obtenu après 100 publications",
    color: "#FFD700",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.LEGENDARY,
  },
  {
    title: "Membre fidèle",
    description: "Badge obtenu après 30 jours d'activité",
    color: "#06B6D4",
    category: BadgeCategory.PARTICIPATION,
    rarity: BadgeRarity.UNCOMMON,
  },
  {
    title: "Vétéran",
    description: "Badge obtenu après 1 an d'inscription",
    color: "#84CC16",
    category: BadgeCategory.ANNIVERSARY,
    rarity: BadgeRarity.RARE,
  },
  {
    title: "Fondateur",
    description: "Badge spécial pour les premiers membres de la plateforme",
    color: "#DC2626",
    category: BadgeCategory.SPECIAL,
    rarity: BadgeRarity.LEGENDARY,
  },
  {
    title: "Beta testeur",
    description: "Badge pour les utilisateurs qui ont testé la version beta",
    color: "#7C3AED",
    category: BadgeCategory.SPECIAL,
    rarity: BadgeRarity.EPIC,
  },
  {
    title: "Aide précieuse",
    description: "Badge obtenu en aidant d'autres utilisateurs",
    color: "#059669",
    category: BadgeCategory.PARTICIPATION,
    rarity: BadgeRarity.RARE,
  },
];

async function seedBadges() {
  console.log("🌱 Création des badges...");

  try {
    // Supprimer tous les badges existants
    await prisma.badge.deleteMany();
    console.log("🗑️ Badges existants supprimés");

    // Créer les nouveaux badges
    for (const badgeData of badges) {
      const badge = await prisma.badge.create({
        data: badgeData,
      });
      console.log(`✅ Badge créé: ${badge.title}`);
    }

    console.log("🎉 Tous les badges ont été créés avec succès!");

    // Afficher un résumé
    const counts = await prisma.badge.groupBy({
      by: ["category", "rarity"],
      _count: true,
    });

    console.log("\n📊 Résumé:");
    counts.forEach(({ category, rarity, _count }) => {
      console.log(`  ${category} - ${rarity}: ${_count}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création des badges:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedBadges().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default seedBadges;
