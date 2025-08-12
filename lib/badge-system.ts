import { prisma } from '@/lib/prisma';
import { BadgeCategory, BadgeRarity } from '@/lib/generated/prisma';

interface BadgeAward {
  userId: string;
  badgeTitle: string;
  reason: string;
}

export class BadgeSystem {
  // Cache des badges pour éviter les requêtes répétées
  private static badgeCache: Record<string, any> = {};

  private static async getBadge(title: string) {
    if (!this.badgeCache[title]) {
      this.badgeCache[title] = await prisma.badge.findFirst({
        where: { title, isActive: true }
      });
    }
    return this.badgeCache[title];
  }

  private static async hasUserBadge(userId: string, badgeId: string): Promise<boolean> {
    const userBadge = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } }
    });
    return !!userBadge;
  }

  private static async awardBadge(userId: string, badgeTitle: string, reason: string) {
    const badge = await this.getBadge(badgeTitle);
    if (!badge) {
      console.warn(`Badge "${badgeTitle}" non trouvé`);
      return false;
    }

    const hasAlready = await this.hasUserBadge(userId, badge.id);
    if (hasAlready) {
      return false; // Déjà attribué
    }

    try {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          reason,
          isVisible: true,
        }
      });

      console.log(`🎖️ Badge "${badgeTitle}" attribué à l'utilisateur ${userId} (${reason})`);
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'attribution du badge "${badgeTitle}":`, error);
      return false;
    }
  }

  // Attribution lors de l'inscription
  static async onUserRegistration(userId: string) {
    await this.awardBadge(userId, 'Bienvenue !', 'Inscription sur ABC Bédarieux');
    
    // Badge Pionnier pour les 100 premiers
    const userCount = await prisma.user.count();
    if (userCount <= 100) {
      await this.awardBadge(userId, 'Pionnier', `${userCount}ème membre de la plateforme`);
    }
  }

  // Attribution lors de la mise à jour du profil
  static async onProfileUpdate(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user || !user.profile) return;

    // Badge Profil complété
    if (user.profile.bio && user.profile.firstname && user.profile.lastname) {
      await this.awardBadge(userId, 'Profil complété', 'Profil utilisateur complètement renseigné');
    }

    // Badge Ambassadeur (profil public + réseaux sociaux)
    if (user.profile.isPublic && user.profile.socials) {
      try {
        const socials = typeof user.profile.socials === 'string' 
          ? JSON.parse(user.profile.socials) 
          : user.profile.socials;
        const hasSocials = socials && Object.keys(socials).some(key => socials[key]);
        
        if (hasSocials) {
          await this.awardBadge(userId, 'Ambassadeur', 'Profil public avec réseaux sociaux');
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
  }

  // Attribution lors de la création d'une place
  static async onPlaceCreated(userId: string) {
    const placeCount = await prisma.place.count({
      where: { ownerId: userId, status: 'ACTIVE' }
    });

    if (placeCount === 1) {
      await this.awardBadge(userId, 'Premier lieu', 'Première place ajoutée');
    } else if (placeCount === 3) {
      await this.awardBadge(userId, 'Explorateur', '3 lieux ajoutés');
    } else if (placeCount === 5) {
      await this.awardBadge(userId, 'Contributeur actif', '5 lieux ajoutés');
    }
  }

  // Attribution lors de la création d'un avis
  static async onReviewCreated(userId: string) {
    const reviewCount = await prisma.review.count({
      where: { userId }
    });

    if (reviewCount === 1) {
      await this.awardBadge(userId, 'Premier avis', 'Premier avis laissé');
    } else if (reviewCount === 10) {
      await this.awardBadge(userId, 'Critique constructif', '10 avis laissés');
    }
  }

  // Attribution périodique (à exécuter régulièrement)
  static async checkTimeBadges(userId?: string) {
    const whereClause = userId ? { id: userId } : {};
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        badges: { select: { badgeId: true } }
      }
    });

    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (const user of users) {
      // Badge Membre fidèle (3 mois)
      if (user.createdAt <= threeMonthsAgo) {
        await this.awardBadge(user.id, 'Membre fidèle', 'Membre depuis plus de 3 mois');
      }

      // Badge Vétéran (1 an)
      if (user.createdAt <= oneYearAgo) {
        await this.awardBadge(user.id, 'Vétéran', 'Membre depuis plus d\'un an');
      }
    }
  }

  // Badge spécial Bédarieux native (attribution manuelle)
  static async awardBedarieuxNative(userId: string, reason: string = 'Résident authentique de Bédarieux') {
    return await this.awardBadge(userId, 'Bédarieux native', reason);
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
            places: { where: { status: 'ACTIVE' } },
            reviews: true,
          }
        }
      }
    });

    if (!user) return;

    // Vérifier tous les badges automatiques
    await this.onUserRegistration(userId);
    await this.onProfileUpdate(userId);
    
    // Badges basés sur les compteurs
    for (let i = 1; i <= user._count.places; i++) {
      if (i === 1 || i === 3 || i === 5) {
        // Simuler l'événement de création pour chaque place
        await this.onPlaceCreated(userId);
      }
    }

    for (let i = 1; i <= user._count.reviews; i++) {
      if (i === 1 || i === 10) {
        // Simuler l'événement de création pour chaque avis
        await this.onReviewCreated(userId);
      }
    }

    await this.checkTimeBadges(userId);
  }

  // Obtenir les statistiques des badges
  static async getBadgeStats() {
    const stats = await prisma.badge.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: [
        { category: 'asc' },
        { rarity: 'asc' }
      ]
    });

    return stats.map(badge => ({
      ...badge,
      userCount: badge._count.users,
      percentage: 0 // Calculer si nécessaire
    }));
  }

  // Nettoyer le cache (utile après des modifications de badges)
  static clearCache() {
    this.badgeCache = {};
  }
}

// Types pour l'export
export type { BadgeAward };