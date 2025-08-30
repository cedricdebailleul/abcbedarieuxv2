"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth-extended";
import { revalidatePath } from "next/cache";
// Badge system functionality is now handled by the new badge engine
import {
  createBadgeSchema,
  updateBadgeSchema,
  badgeFiltersSchema,
  awardBadgeSchema,
  revokeBadgeSchema,
  type CreateBadgeInput,
  type UpdateBadgeInput,
  type BadgeFilters,
  type AwardBadgeInput,
  type RevokeBadgeInput,
} from "@/lib/validations/badge";
import {
  BadgeWithUsers,
  BadgeListItem,
  BadgeStats,
} from "@/lib/types/badge";
import { Prisma, BadgeCategory, BadgeRarity } from "@/lib/generated/prisma";

// Types pour les réponses
type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

// Utilitaire pour vérifier les permissions admin
async function checkAdminPermissions() {
  const session = await requireAdmin();
  return { user: session.user };
}

// CREATE - Créer un nouveau badge
export async function createBadgeAction(
  input: CreateBadgeInput
): Promise<ActionResult<{ id: string; title: string }>> {
  try {
    await checkAdminPermissions();

    // Validation des données
    const validatedData = createBadgeSchema.parse(input);

    // Vérifier l'unicité du titre
    const existingBadge = await prisma.badge.findFirst({
      where: { title: validatedData.title },
      select: { id: true },
    });

    if (existingBadge) {
      return {
        success: false,
        errors: {
          title: ["Un badge avec ce titre existe déjà"],
        },
      };
    }

    // Créer le badge
    const badge = await prisma.badge.create({
      data: validatedData,
      select: {
        id: true,
        title: true,
      },
    });

    // Le nouveau système de badges n'utilise plus de cache global

    revalidatePath("/dashboard/admin/badges");

    return {
      success: true,
      data: badge,
    };
  } catch (error) {
    console.error("Erreur lors de la création du badge:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la création du badge",
    };
  }
}

// READ - Obtenir un badge par ID
export async function getBadgeAction(
  badgeId: string
): Promise<ActionResult<BadgeWithUsers>> {
  try {
    await checkAdminPermissions();

    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { earnedAt: "desc" },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!badge) {
      return {
        success: false,
        error: "Badge introuvable",
      };
    }

    return {
      success: true,
      data: badge,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du badge:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la récupération du badge",
    };
  }
}

// READ - Lister les badges avec filtres et pagination
export async function getBadgesAction(
  filters: BadgeFilters
): Promise<
  ActionResult<{
    badges: BadgeListItem[];
    total: number;
    pages: number;
  }>
> {
  try {
    await checkAdminPermissions();

    const validatedFilters = badgeFiltersSchema.parse(filters);
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      category,
      rarity,
      isActive,
    } = validatedFilters;

    // Construire les conditions de filtre
    const whereClause: Prisma.BadgeWhereInput = {};

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (rarity) {
      whereClause.rarity = rarity;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    // Calculer le skip pour la pagination
    const skip = (page - 1) * limit;

    // Construire l'ordre de tri
    const orderBy: Prisma.BadgeOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Exécuter les requêtes en parallèle
    const [badges, total] = await Promise.all([
      prisma.badge.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.badge.count({ where: whereClause }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        badges,
        total,
        pages,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des badges:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la récupération des badges",
    };
  }
}

// UPDATE - Mettre à jour un badge
export async function updateBadgeAction(
  input: UpdateBadgeInput
): Promise<ActionResult<{ title: string }>> {
  try {
    await checkAdminPermissions();

    if (!input.id) {
      return {
        success: false,
        error: "ID du badge requis",
      };
    }

    // Validation des données
    const validatedData = updateBadgeSchema.parse(input);

    // Vérifier l'unicité du titre si modifié
    if (validatedData.title) {
      const existingBadge = await prisma.badge.findFirst({
        where: {
          title: validatedData.title,
          NOT: { id: validatedData.id },
        },
        select: { id: true },
      });

      if (existingBadge) {
        return {
          success: false,
          errors: {
            title: ["Un badge avec ce titre existe déjà"],
          },
        };
      }
    }

    // Extraire l'ID pour la mise à jour
    const { id, ...updateData } = validatedData;

    // Mettre à jour le badge
    const badge = await prisma.badge.update({
      where: { id },
      data: updateData,
      select: {
        title: true,
      },
    });

    // Le nouveau système de badges n'utilise plus de cache global

    revalidatePath("/dashboard/admin/badges");

    return {
      success: true,
      data: {
        title: badge.title,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du badge:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la mise à jour du badge",
    };
  }
}

// DELETE - Supprimer un badge
export async function deleteBadgeAction(
  badgeId: string
): Promise<ActionResult> {
  try {
    await checkAdminPermissions();

    // Vérifier que le badge existe
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!badge) {
      return {
        success: false,
        error: "Badge introuvable",
      };
    }

    // Avertir si le badge est attribué à des utilisateurs
    if (badge._count.users > 0) {
      return {
        success: false,
        error: `Impossible de supprimer ce badge car il est attribué à ${badge._count.users} utilisateur(s)`,
      };
    }

    // Supprimer le badge
    await prisma.badge.delete({
      where: { id: badgeId },
    });

    // Le nouveau système de badges n'utilise plus de cache global

    revalidatePath("/dashboard/admin/badges");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du badge:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la suppression du badge",
    };
  }
}

// AWARD - Attribuer un badge manuellement
export async function awardBadgeAction(
  input: AwardBadgeInput
): Promise<ActionResult> {
  try {
    await checkAdminPermissions();

    // Validation des données
    const validatedData = awardBadgeSchema.parse(input);

    // Vérifier que le badge et l'utilisateur existent
    const [badge, user] = await Promise.all([
      prisma.badge.findUnique({
        where: { id: validatedData.badgeId },
        select: { id: true, title: true },
      }),
      prisma.user.findUnique({
        where: { id: validatedData.userId },
        select: { id: true, email: true },
      }),
    ]);

    if (!badge) {
      return {
        success: false,
        error: "Badge introuvable",
      };
    }

    if (!user) {
      return {
        success: false,
        error: "Utilisateur introuvable",
      };
    }

    // Vérifier si l'utilisateur a déjà ce badge
    const existingUserBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: validatedData.userId,
          badgeId: validatedData.badgeId,
        },
      },
    });

    if (existingUserBadge) {
      return {
        success: false,
        error: "L'utilisateur possède déjà ce badge",
      };
    }

    // Attribuer le badge
    await prisma.userBadge.create({
      data: {
        userId: validatedData.userId,
        badgeId: validatedData.badgeId,
        reason: validatedData.reason,
        isVisible: true,
      },
    });

    revalidatePath("/dashboard/admin/badges");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de l'attribution du badge:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de l'attribution du badge",
    };
  }
}

// REVOKE - Retirer un badge
export async function revokeBadgeAction(
  input: RevokeBadgeInput
): Promise<ActionResult> {
  try {
    await checkAdminPermissions();

    // Validation des données
    const validatedData = revokeBadgeSchema.parse(input);

    // Vérifier que l'attribution existe
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: validatedData.userId,
          badgeId: validatedData.badgeId,
        },
      },
      include: {
        badge: { select: { title: true } },
        user: { select: { email: true } },
      },
    });

    if (!userBadge) {
      return {
        success: false,
        error: "Cette attribution de badge n'existe pas",
      };
    }

    // Retirer le badge
    await prisma.userBadge.delete({
      where: {
        userId_badgeId: {
          userId: validatedData.userId,
          badgeId: validatedData.badgeId,
        },
      },
    });

    revalidatePath("/dashboard/admin/badges");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors du retrait du badge:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors du retrait du badge",
    };
  }
}

// STATS - Obtenir les statistiques des badges
export async function getBadgeStatsAction(): Promise<ActionResult<BadgeStats>> {
  try {
    await checkAdminPermissions();

    // Exécuter les requêtes en parallèle
    const [
      total,
      active,
      inactive,
      totalAwarded,
      categoriesStats,
      raritiesStats,
    ] = await Promise.all([
      // Total des badges
      prisma.badge.count(),
      // Badges actifs
      prisma.badge.count({ where: { isActive: true } }),
      // Badges inactifs
      prisma.badge.count({ where: { isActive: false } }),
      // Total des attributions
      prisma.userBadge.count(),
      // Stats par catégorie
      prisma.badge.groupBy({
        by: ["category"],
        _count: { id: true },
      }),
      // Stats par rareté
      prisma.badge.groupBy({
        by: ["rarity"],
        _count: { id: true },
      }),
    ]);

    // Transformer les stats en objets
    const categoriesStatsObj = Object.fromEntries(
      categoriesStats.map((stat) => [stat.category, stat._count.id])
    ) as Record<BadgeCategory, number>;

    const raritiesStatsObj = Object.fromEntries(
      raritiesStats.map((stat) => [stat.rarity, stat._count.id])
    ) as Record<BadgeRarity, number>;

    return {
      success: true,
      data: {
        total,
        active,
        inactive,
        totalAwarded,
        byCategory: categoriesStatsObj,
        byRarity: raritiesStatsObj,
        categoriesStats: categoriesStatsObj,
        raritiesStats: raritiesStatsObj,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la récupération des statistiques",
    };
  }
}

// GET USERS - Rechercher des utilisateurs pour attribution
export async function searchUsersAction(
  query: string
): Promise<
  ActionResult<Array<{ id: string; email: string; name: string | null }>>
> {
  try {
    await checkAdminPermissions();

    if (!query || query.length < 2) {
      return {
        success: true,
        data: [],
      };
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: 10,
      orderBy: { email: "asc" },
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Erreur lors de la recherche d'utilisateurs:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la recherche d'utilisateurs",
    };
  }
}
