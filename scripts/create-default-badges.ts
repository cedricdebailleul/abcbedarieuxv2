import { type BadgeCategory, type BadgeRarity, PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

const DEFAULT_BADGES = [
  // Badges d'accueil
  {
    title: "Bienvenue !",
    description: "Premier pas dans la communauté ABC Bédarieux",
    category: "GENERAL",
    rarity: "COMMON",
    color: "#10B981",
    iconUrl: "👋",
  },
  {
    title: "Profil complété",
    description: "Profil utilisateur complètement renseigné",
    category: "ACHIEVEMENT",
    rarity: "COMMON",
    color: "#3B82F6",
    iconUrl: "✅",
  },

  // Badges de participation
  {
    title: "Premier lieu",
    description: "Première place ajoutée sur la plateforme",
    category: "ACHIEVEMENT",
    rarity: "UNCOMMON",
    color: "#8B5CF6",
    iconUrl: "🏪",
  },
  {
    title: "Explorateur",
    description: "3 lieux ajoutés avec succès",
    category: "ACHIEVEMENT",
    rarity: "UNCOMMON",
    color: "#8B5CF6",
    iconUrl: "🗺️",
  },
  {
    title: "Contributeur actif",
    description: "5 lieux ajoutés avec succès",
    category: "ACHIEVEMENT",
    rarity: "RARE",
    color: "#EF4444",
    iconUrl: "🌟",
  },

  // Badges de qualité
  {
    title: "Premier avis",
    description: "Premier avis laissé sur un lieu",
    category: "PARTICIPATION",
    rarity: "COMMON",
    color: "#F59E0B",
    iconUrl: "💬",
  },
  {
    title: "Critique constructif",
    description: "10 avis laissés sur des lieux",
    category: "PARTICIPATION",
    rarity: "UNCOMMON",
    color: "#F59E0B",
    iconUrl: "📝",
  },

  // Badges sociaux
  {
    title: "Ambassadeur",
    description: "Profil public avec réseaux sociaux renseignés",
    category: "PARTICIPATION",
    rarity: "UNCOMMON",
    color: "#06B6D4",
    iconUrl: "📢",
  },

  // Badges temporels
  {
    title: "Membre fidèle",
    description: "Membre depuis plus de 3 mois",
    category: "SPECIAL",
    rarity: "RARE",
    color: "#DC2626",
    iconUrl: "🎖️",
  },
  {
    title: "Vétéran",
    description: "Membre depuis plus d'un an",
    category: "SPECIAL",
    rarity: "EPIC",
    color: "#7C3AED",
    iconUrl: "🏅",
  },

  // Badges spéciaux
  {
    title: "Bédarieux native",
    description: "Résident authentique de Bédarieux",
    category: "SPECIAL",
    rarity: "RARE",
    color: "#059669",
    iconUrl: "🏡",
  },
  {
    title: "Pionnier",
    description: "L'un des 100 premiers membres de la plateforme",
    category: "SPECIAL",
    rarity: "LEGENDARY",
    color: "#DC2626",
    iconUrl: "🚀",
  },
];

async function createDefaultBadges() {
  console.log("🏆 Création des badges par défaut...\n");

  for (const badgeData of DEFAULT_BADGES) {
    try {
      // Vérifier si le badge existe déjà
      const existingBadge = await prisma.badge.findFirst({
        where: { title: badgeData.title },
      });

      if (existingBadge) {
        console.log(`⏭️  Badge "${badgeData.title}" existe déjà`);
        continue;
      }

      // Créer le badge
      const badge = await prisma.badge.create({
        data: {
          ...badgeData,
          rarity: badgeData.rarity as BadgeRarity,
          category: badgeData.category as BadgeCategory,
        },
      });

      console.log(`✅ Badge créé: "${badge.title}" (${badge.rarity})`);
    } catch (error) {
      console.error(`❌ Erreur pour le badge "${badgeData.title}":`, error);
    }
  }

  console.log("\n🎉 Badges par défaut créés avec succès !");
}

// Attribution automatique des badges de base
async function awardBasicBadges() {
  console.log("\n🎯 Attribution des badges de base...\n");

  const users = await prisma.user.findMany({
    include: {
      badges: { select: { badgeId: true } },
      profile: true,
      places: { where: { status: "ACTIVE" } },
      reviews: true,
      _count: {
        select: {
          places: { where: { status: "ACTIVE" } },
          reviews: true,
        },
      },
    },
  });

  const badges = await prisma.badge.findMany();
  const badgeMap = badges.reduce(
    (map, badge) => {
      map[badge.title] = badge;
      return map;
    },
    {} as Record<string, (typeof badges)[0]>
  );

  for (const user of users) {
    const userBadgeIds = user.badges.map((ub) => ub.badgeId);
    const badgesToAward = [];

    // Badge Bienvenue (tous les utilisateurs)
    const welcomeBadge = badgeMap["Bienvenue !"];
    if (welcomeBadge && !userBadgeIds.includes(welcomeBadge.id)) {
      badgesToAward.push({
        userId: user.id,
        badgeId: welcomeBadge.id,
        reason: "Inscription sur ABC Bédarieux",
      });
    }

    // Badge Profil complété
    if (user.profile?.bio && user.profile?.firstname && user.profile?.lastname) {
      const profileBadge = badgeMap["Profil complété"];
      if (profileBadge && !userBadgeIds.includes(profileBadge.id)) {
        badgesToAward.push({
          userId: user.id,
          badgeId: profileBadge.id,
          reason: "Profil utilisateur complètement renseigné",
        });
      }
    }

    // Badges selon le nombre de lieux
    const placeCount = user._count.places;
    if (placeCount >= 1) {
      const firstPlaceBadge = badgeMap["Premier lieu"];
      if (firstPlaceBadge && !userBadgeIds.includes(firstPlaceBadge.id)) {
        badgesToAward.push({
          userId: user.id,
          badgeId: firstPlaceBadge.id,
          reason: "Première place ajoutée",
        });
      }
    }
    if (placeCount >= 3) {
      const explorerBadge = badgeMap.Explorateur;
      if (explorerBadge && !userBadgeIds.includes(explorerBadge.id)) {
        badgesToAward.push({
          userId: user.id,
          badgeId: explorerBadge.id,
          reason: "3 lieux ajoutés",
        });
      }
    }
    if (placeCount >= 5) {
      const activeBadge = badgeMap["Contributeur actif"];
      if (activeBadge && !userBadgeIds.includes(activeBadge.id)) {
        badgesToAward.push({
          userId: user.id,
          badgeId: activeBadge.id,
          reason: "5 lieux ajoutés",
        });
      }
    }

    // Badges selon le nombre d'avis
    const reviewCount = user._count.reviews;
    if (reviewCount >= 1) {
      const firstReviewBadge = badgeMap["Premier avis"];
      if (firstReviewBadge && !userBadgeIds.includes(firstReviewBadge.id)) {
        badgesToAward.push({
          userId: user.id,
          badgeId: firstReviewBadge.id,
          reason: "Premier avis laissé",
        });
      }
    }
    if (reviewCount >= 10) {
      const criticBadge = badgeMap["Critique constructif"];
      if (criticBadge && !userBadgeIds.includes(criticBadge.id)) {
        badgesToAward.push({
          userId: user.id,
          badgeId: criticBadge.id,
          reason: "10 avis laissés",
        });
      }
    }

    // Badge Ambassadeur (profil public + réseaux sociaux)
    if (user.profile?.isPublic && user.profile?.socials) {
      try {
        const socials =
          typeof user.profile.socials === "string"
            ? JSON.parse(user.profile.socials)
            : user.profile.socials;
        const hasSocials = socials && Object.keys(socials).some((key) => socials[key]);

        if (hasSocials) {
          const ambassadorBadge = badgeMap.Ambassadeur;
          if (ambassadorBadge && !userBadgeIds.includes(ambassadorBadge.id)) {
            badgesToAward.push({
              userId: user.id,
              badgeId: ambassadorBadge.id,
              reason: "Profil public avec réseaux sociaux",
            });
          }
        }
      } catch (_e) {
        // Ignore JSON parse errors
      }
    }

    // Badge Membre fidèle (3 mois)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    if (user.createdAt <= threeMonthsAgo) {
      const faithfulBadge = badgeMap["Membre fidèle"];
      if (faithfulBadge && !userBadgeIds.includes(faithfulBadge.id)) {
        badgesToAward.push({
          userId: user.id,
          badgeId: faithfulBadge.id,
          reason: "Membre depuis plus de 3 mois",
        });
      }
    }

    // Badge Vétéran (1 an)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (user.createdAt <= oneYearAgo) {
      const veteranBadge = badgeMap.Vétéran;
      if (veteranBadge && !userBadgeIds.includes(veteranBadge.id)) {
        badgesToAward.push({
          userId: user.id,
          badgeId: veteranBadge.id,
          reason: "Membre depuis plus d'un an",
        });
      }
    }

    // Attribuer tous les badges en une fois
    if (badgesToAward.length > 0) {
      await prisma.userBadge.createMany({
        data: badgesToAward,
        skipDuplicates: true,
      });

      console.log(`🎖️  ${user.name}: ${badgesToAward.length} badge(s) attribué(s)`);
      badgesToAward.forEach((badge) => {
        const badgeInfo = badges.find((b) => b.id === badge.badgeId);
        console.log(`   → ${badgeInfo?.title} (${badge.reason})`);
      });
    }
  }

  console.log("\n🎉 Attribution des badges terminée !");
}

async function main() {
  try {
    await createDefaultBadges();
    await awardBasicBadges();
  } catch (error) {
    console.error("💥 Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
