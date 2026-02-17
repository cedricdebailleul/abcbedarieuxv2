import { prisma } from "@/lib/prisma";
import { BadgeCategory, BadgeRarity } from "@/lib/generated/prisma/client";

const articleBadges = [
  {
    title: "Premier article",
    description: "Félicitations pour votre premier article publié !",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.COMMON,
    color: "#10B981", // Vert
    iconUrl: "📝",
  },
  {
    title: "Auteur régulier",
    description: "Vous avez publié 5 articles, continuez sur cette lancée !",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.UNCOMMON,
    color: "#3B82F6", // Bleu
    iconUrl: "✍️",
  },
  {
    title: "Rédacteur prolifique",
    description: "10 articles publiés ! Vous êtes un vrai contributeur de contenu.",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.RARE,
    color: "#8B5CF6", // Violet
    iconUrl: "📚",
  },
  {
    title: "Maître écrivain",
    description: "25 articles publiés ! Vous êtes un maître de l'écriture.",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.EPIC,
    color: "#F59E0B", // Orange
    iconUrl: "🏆",
  },
];

async function createArticleBadges() {
  console.log("🎖️ Création des badges pour les articles...");

  for (const badge of articleBadges) {
    try {
      const existingBadge = await prisma.badge.findFirst({
        where: { title: badge.title },
      });

      if (existingBadge) {
        console.log(`Badge "${badge.title}" existe déjà, mise à jour...`);
        await prisma.badge.update({
          where: { id: existingBadge.id },
          data: {
            description: badge.description,
            category: badge.category,
            rarity: badge.rarity,
            color: badge.color,
            iconUrl: badge.iconUrl,
            isActive: true,
          },
        });
      } else {
        await prisma.badge.create({
          data: {
            title: badge.title,
            description: badge.description,
            category: badge.category,
            rarity: badge.rarity,
            color: badge.color,
            iconUrl: badge.iconUrl,
            isActive: true,
          },
        });
        console.log(`✅ Badge "${badge.title}" créé`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la création du badge "${badge.title}":`, error);
    }
  }

  console.log("🎯 Création des badges terminée !");
}

createArticleBadges()
  .catch((error) => {
    console.error("Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });