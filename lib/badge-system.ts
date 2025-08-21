import { prisma } from "@/lib/prisma";

interface BadgeAward {
  userId: string;
  badgeTitle: string;
  reason: string;
}

export class BadgeSystem {
  // Cache des badges pour éviter les requêtes répétées
  private static badgeCache: Record<string, { id: string; title: string; description: string; iconUrl?: string | null; color?: string | null; rarity: string; isActive: boolean } | null> = {};

  private static async getBadge(title: string) {
    if (!BadgeSystem.badgeCache[title]) {
      BadgeSystem.badgeCache[title] = await prisma.badge.findFirst({
        where: { title, isActive: true },
      });
    }
    return BadgeSystem.badgeCache[title];
  }

  private static async hasUserBadge(userId: string, badgeId: string): Promise<boolean> {
    const userBadge = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });
    return !!userBadge;
  }

  private static async awardBadge(userId: string, badgeTitle: string, reason: string) {
    const badge = await BadgeSystem.getBadge(badgeTitle);
    if (!badge) {
      console.warn(`Badge "${badgeTitle}" non trouvé`);
      return null;
    }

    const hasAlready = await BadgeSystem.hasUserBadge(userId, badge.id);
    if (hasAlready) {
      return null; // Déjà attribué
    }

    try {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          reason,
          isVisible: true,
        },
      });

      console.log(`🎖️ Badge "${badgeTitle}" attribué à l'utilisateur ${userId} (${reason})`);
      return {
        title: badge.title,
        description: badge.description,
        iconUrl: badge.iconUrl,
        color: badge.color,
        rarity: badge.rarity,
      };
    } catch (error) {
      console.error(`Erreur lors de l'attribution du badge "${badgeTitle}":`, error);
      return null;
    }
  }

  // Attribution lors de l'inscription
  static async onUserRegistration(userId: string) {
    await BadgeSystem.awardBadge(userId, "Bienvenue !", "Inscription sur ABC Bédarieux");

    // Badge Pionnier pour les 100 premiers
    const userCount = await prisma.user.count();
    if (userCount <= 100) {
      await BadgeSystem.awardBadge(userId, "Pionnier", `${userCount}ème membre de la plateforme`);
    }
  }

  // Attribution lors de la mise à jour du profil
  static async onProfileUpdate(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) return;

    // Badge Profil complété
    if (user.profile.bio && user.profile.firstname && user.profile.lastname) {
      await BadgeSystem.awardBadge(
        userId,
        "Profil complété",
        "Profil utilisateur complètement renseigné"
      );
    }

    // Badge Ambassadeur (profil public + réseaux sociaux)
    if (user.profile.isPublic && user.profile.socials) {
      try {
        const socials =
          typeof user.profile.socials === "string"
            ? JSON.parse(user.profile.socials)
            : user.profile.socials;
        const hasSocials = socials && Object.keys(socials).some((key) => socials[key]);

        if (hasSocials) {
          await BadgeSystem.awardBadge(userId, "Ambassadeur", "Profil public avec réseaux sociaux");
        }
      } catch {
        // Ignore JSON parse errors
        console.warn("Erreur lors de la lecture des réseaux sociaux du profil");
      }
    }
  }

  // Attribution lors de la création d'une place
  static async onPlaceCreated(userId: string) {
    const placeCount = await prisma.place.count({
      where: { ownerId: userId, status: "ACTIVE" },
    });

    if (placeCount === 1) {
      await BadgeSystem.awardBadge(userId, "Premier lieu", "Première place ajoutée");
    } else if (placeCount === 3) {
      await BadgeSystem.awardBadge(userId, "Explorateur", "3 lieux ajoutés");
    } else if (placeCount === 5) {
      await BadgeSystem.awardBadge(userId, "Contributeur actif", "5 lieux ajoutés");
    }
  }

  // Attribution lors de la création d'un avis
  static async onReviewCreated(userId: string) {
    const reviewCount = await prisma.review.count({
      where: { userId },
    });

    if (reviewCount === 1) {
      await BadgeSystem.awardBadge(userId, "Premier avis", "Premier avis laissé");
    } else if (reviewCount === 10) {
      await BadgeSystem.awardBadge(userId, "Critique constructif", "10 avis laissés");
    }
  }

  // Attribution lors de la création d'un article
  static async onPostCreated(userId: string) {
    const postCount = await prisma.post.count({
      where: { authorId: userId },
    });

    const newBadges: Array<{
      badge: {
        title: string;
        description: string;
        iconUrl?: string | null;
        color?: string | null;
        rarity: string;
      };
      reason: string;
    }> = [];

    if (postCount === 1) {
      const awarded = await BadgeSystem.awardBadge(userId, "Premier article", "Premier article publié");
      if (awarded) {
        newBadges.push({ badge: awarded, reason: "Premier article publié" });
      }
    } else if (postCount === 5) {
      const awarded = await BadgeSystem.awardBadge(userId, "Auteur régulier", "5 articles publiés");
      if (awarded) {
        newBadges.push({ badge: awarded, reason: "5 articles publiés" });
      }
    } else if (postCount === 10) {
      const awarded = await BadgeSystem.awardBadge(userId, "Rédacteur prolifique", "10 articles publiés");
      if (awarded) {
        newBadges.push({ badge: awarded, reason: "10 articles publiés" });
      }
    } else if (postCount === 25) {
      const awarded = await BadgeSystem.awardBadge(userId, "Maître écrivain", "25 articles publiés");
      if (awarded) {
        newBadges.push({ badge: awarded, reason: "25 articles publiés" });
      }
    }

    return newBadges;
  }

  // Attribution périodique (à exécuter régulièrement)
  static async checkTimeBadges(userId?: string) {
    const whereClause = userId ? { id: userId } : {};
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        badges: { select: { badgeId: true } },
      },
    });

    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (const user of users) {
      // Badge Membre fidèle (3 mois)
      if (user.createdAt <= threeMonthsAgo) {
        await BadgeSystem.awardBadge(user.id, "Membre fidèle", "Membre depuis plus de 3 mois");
      }

      // Badge Vétéran (1 an)
      if (user.createdAt <= oneYearAgo) {
        await BadgeSystem.awardBadge(user.id, "Vétéran", "Membre depuis plus d'un an");
      }
    }
  }

  // Badge spécial Bédarieux native (attribution manuelle)
  static async awardBedarieuxNative(
    userId: string,
    reason: string = "Résident authentique de Bédarieux"
  ) {
    return await BadgeSystem.awardBadge(userId, "Bédarieux native", reason);
  }

  // Vérifier et attribuer tous les badges pour un utilisateur
  static async checkAllBadgesForUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        badges: { select: { badgeId: true } },
        _count: {
          select: {
            places: { where: { status: "ACTIVE" } },
            reviews: true,
          },
        },
      },
    });

    if (!user) return;

    // Vérifier tous les badges automatiques
    await BadgeSystem.onUserRegistration(userId);
    await BadgeSystem.onProfileUpdate(userId);

    // Badges basés sur les compteurs
    for (let i = 1; i <= user._count.places; i++) {
      if (i === 1 || i === 3 || i === 5) {
        // Simuler l'événement de création pour chaque place
        await BadgeSystem.onPlaceCreated(userId);
      }
    }

    for (let i = 1; i <= user._count.reviews; i++) {
      if (i === 1 || i === 10) {
        // Simuler l'événement de création pour chaque avis
        await BadgeSystem.onReviewCreated(userId);
      }
    }

    await BadgeSystem.checkTimeBadges(userId);
  }

  // Obtenir les statistiques des badges
  static async getBadgeStats() {
    const stats = await prisma.badge.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: [{ category: "asc" }, { rarity: "asc" }],
    });

    return stats.map((badge) => ({
      ...badge,
      userCount: badge._count.users,
      percentage: 0, // Calculer si nécessaire
    }));
  }

  // Nettoyer le cache (utile après des modifications de badges)
  static clearCache() {
    BadgeSystem.badgeCache = {};
  }
}

// Types pour l'export
export type { BadgeAward };
