#!/usr/bin/env tsx

import { BadgeCategory, BadgeRarity, PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// Badges basés sur les configurations de l'engine
const badges = [
  // BEGINNER BADGES
  {
    id: "welcome",
    title: "Bienvenue !",
    description: "Premier pas sur ABC Bédarieux",
    iconUrl: "👋",
    color: "#22c55e",
    category: BadgeCategory.GENERAL,
    rarity: BadgeRarity.COMMON,
  },
  {
    id: "first_place",
    title: "Premier lieu",
    description: "Première place ajoutée sur la plateforme",
    iconUrl: "🏪",
    color: "#3b82f6",
    category: BadgeCategory.GENERAL,
    rarity: BadgeRarity.COMMON,
  },
  {
    id: "profile_complete",
    title: "Profil complété",
    description: "Profil utilisateur entièrement renseigné",
    iconUrl: "✅",
    color: "#10b981",
    category: BadgeCategory.GENERAL,
    rarity: BadgeRarity.COMMON,
  },

  // PLACE CONTRIBUTION BADGES
  {
    id: "explorer",
    title: "Explorateur",
    description: "A ajouté 3 lieux sur la plateforme",
    iconUrl: "🧭",
    color: "#f59e0b",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.UNCOMMON,
  },
  {
    id: "active_contributor",
    title: "Contributeur actif",
    description: "A ajouté 5 lieux sur la plateforme",
    iconUrl: "🏛️",
    color: "#8b5cf6",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.RARE,
  },

  // WRITING BADGES
  {
    id: "regular_author",
    title: "Auteur régulier",
    description: "A publié 5 articles",
    iconUrl: "✍️",
    color: "#06b6d4",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.UNCOMMON,
  },
  {
    id: "prolific_writer",
    title: "Rédacteur prolifique",
    description: "A publié 10 articles",
    iconUrl: "📝",
    color: "#ec4899",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.RARE,
  },
  {
    id: "master_writer",
    title: "Maître écrivain",
    description: "A publié 25 articles",
    iconUrl: "📚",
    color: "#f97316",
    category: BadgeCategory.ACHIEVEMENT,
    rarity: BadgeRarity.EPIC,
  },

  // ENGAGEMENT BADGES
  {
    id: "ambassador",
    title: "Ambassadeur",
    description: "Profil public avec réseaux sociaux",
    iconUrl: "🌟",
    color: "#84cc16",
    category: BadgeCategory.GENERAL,
    rarity: BadgeRarity.UNCOMMON,
  },

  // TIME-BASED BADGES
  {
    id: "faithful_member",
    title: "Membre fidèle",
    description: "Membre depuis plus de 3 mois",
    iconUrl: "❤️",
    color: "#ef4444",
    category: BadgeCategory.ANNIVERSARY,
    rarity: BadgeRarity.UNCOMMON,
  },
  {
    id: "veteran",
    title: "Vétéran",
    description: "Membre depuis plus d'un an",
    iconUrl: "🎖️",
    color: "#dc2626",
    category: BadgeCategory.ANNIVERSARY,
    rarity: BadgeRarity.RARE,
  },

  // SPECIAL BADGES
  {
    id: "bedarieux_native",
    title: "Bédarieux native",
    description: "Résident authentique de Bédarieux",
    iconUrl: "🏘️",
    color: "#7c3aed",
    category: BadgeCategory.SPECIAL,
    rarity: BadgeRarity.EPIC,
  },
  {
    id: "pioneer",
    title: "Pionnier",
    description: "Parmi les 100 premiers membres",
    iconUrl: "🚀",
    color: "#fbbf24",
    category: BadgeCategory.SPECIAL,
    rarity: BadgeRarity.LEGENDARY,
  },
];

async function seedBadges() {
  console.log("🌱 Création des badges basés sur l'engine...");

  try {
    // Supprimer les badges existants
    await prisma.userBadge.deleteMany({});
    await prisma.badge.deleteMany({});
    console.log("🗑️ Badges existants supprimés");

    // Créer les nouveaux badges
    for (const badge of badges) {
      await prisma.badge.create({
        data: badge,
      });
      console.log(`✅ Badge créé: ${badge.title}`);
    }

    console.log("🎉 Tous les badges ont été créés avec succès!");

    // Afficher un résumé par catégorie et rareté
    const summary: Record<string, number> = {};
    badges.forEach((badge) => {
      const key = `${badge.category} - ${badge.rarity}`;
      summary[key] = (summary[key] || 0) + 1;
    });

    console.log("\n📊 Résumé:");
    Object.entries(summary).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });
    
  } catch (error) {
    console.error("❌ Erreur lors de la création des badges:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seed
seedBadges();