"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  createPlaceCategorySchema,
  updatePlaceCategorySchema,
  placeCategoryFiltersSchema,
  generateSlug,
  type CreatePlaceCategoryInput,
  type UpdatePlaceCategoryInput,
  type PlaceCategoryFilters,
} from "@/lib/validations/place-category";
import { Prisma } from "@/lib/generated/prisma";

// Types pour les réponses
type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

// Utilitaire pour vérifier les permissions admin
async function checkAdminPermissions() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    throw new Error("Non authentifié");
  }

  const user = session.user;

  if (user.role !== "admin" && user.role !== "moderator") {
    throw new Error("Permissions administrateur ou modérateur requises");
  }

  return { user };
}

// CREATE - Créer une nouvelle catégorie
export async function createPlaceCategoryAction(
  input: CreatePlaceCategoryInput
): Promise<ActionResult<{ id: string; name: string; slug: string }>> {
  try {
    await checkAdminPermissions();

    // Validation des données
    const validatedData = createPlaceCategorySchema.parse(input);

    // Générer le slug si pas fourni
    if (!validatedData.slug) {
      validatedData.slug = generateSlug(validatedData.name);
    }

    // Vérifier l'unicité du nom et du slug
    const existing = await prisma.placeCategory.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          { slug: validatedData.slug },
        ],
      },
      select: { id: true, name: true, slug: true },
    });

    if (existing) {
      return {
        success: false,
        errors: {
          [existing.name === validatedData.name ? "name" : "slug"]: [
            existing.name === validatedData.name
              ? "Une catégorie avec ce nom existe déjà"
              : "Une catégorie avec ce slug existe déjà"
          ],
        },
      };
    }

    // Vérifier que le parent existe si spécifié
    if (validatedData.parentId) {
      const parent = await prisma.placeCategory.findUnique({
        where: { id: validatedData.parentId },
        select: { id: true },
      });

      if (!parent) {
        return {
          success: false,
          errors: {
            parentId: ["La catégorie parent n'existe pas"],
          },
        };
      }
    }

    // Créer la catégorie
    const category = await prisma.placeCategory.create({
      data: validatedData,
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    revalidatePath("/dashboard/admin/place-categories");

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la création de la catégorie",
    };
  }
}

// READ - Obtenir une catégorie par ID
export async function getPlaceCategoryAction(
  categoryId: string
): Promise<ActionResult<any>> {
  try {
    const category = await prisma.placeCategory.findUnique({
      where: { id: categoryId },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: { id: true, name: true, slug: true, isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        _count: true,
      },
    });

    if (!category) {
      return {
        success: false,
        error: "Catégorie introuvable",
      };
    }

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de la catégorie:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la récupération de la catégorie",
    };
  }
}

// READ - Lister les catégories avec filtres et pagination
export async function getPlaceCategoriesAction(
  filters: PlaceCategoryFilters
): Promise<ActionResult<{ categories: any[]; total: number; pages: number }>> {
  try {
    const validatedFilters = placeCategoryFiltersSchema.parse(filters);
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      isActive,
      parentId,
    } = validatedFilters;

    // Construire les conditions de filtre
    const whereClause: Prisma.PlaceCategoryWhereInput = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (parentId !== undefined) {
      whereClause.parentId = parentId;
    }

    // Calculer le skip pour la pagination
    const skip = (page - 1) * limit;

    // Construire l'ordre de tri
    const orderBy: Prisma.PlaceCategoryOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Exécuter les requêtes en parallèle
    const [categories, total] = await Promise.all([
      prisma.placeCategory.findMany({
        where: whereClause,
        include: {
          parent: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { children: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.placeCategory.count({ where: whereClause }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        categories,
        total,
        pages,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la récupération des catégories",
    };
  }
}

// UPDATE - Mettre à jour une catégorie
export async function updatePlaceCategoryAction(
  input: UpdatePlaceCategoryInput
): Promise<ActionResult<{ name: string; slug: string }>> {
  try {
    await checkAdminPermissions();

    if (!input.id) {
      return {
        success: false,
        error: "ID de la catégorie requis",
      };
    }

    // Validation des données
    const validatedData = updatePlaceCategorySchema.parse(input);

    // Générer le slug si le nom a changé
    if (validatedData.name && !validatedData.slug) {
      validatedData.slug = generateSlug(validatedData.name);
    }

    // Vérifier l'unicité du nom et du slug si modifiés
    if (validatedData.name || validatedData.slug) {
      const existing = await prisma.placeCategory.findFirst({
        where: {
          AND: [
            { NOT: { id: validatedData.id } },
            {
              OR: [
                ...(validatedData.name ? [{ name: validatedData.name }] : []),
                ...(validatedData.slug ? [{ slug: validatedData.slug }] : []),
              ],
            },
          ],
        },
        select: { id: true, name: true, slug: true },
      });

      if (existing) {
        return {
          success: false,
          errors: {
            [existing.name === validatedData.name ? "name" : "slug"]: [
              existing.name === validatedData.name
                ? "Une catégorie avec ce nom existe déjà"
                : "Une catégorie avec ce slug existe déjà"
            ],
          },
        };
      }
    }

    // Vérifier que le parent existe si spécifié et différent
    if (validatedData.parentId) {
      // Empêcher qu'une catégorie soit son propre parent
      if (validatedData.parentId === validatedData.id) {
        return {
          success: false,
          errors: {
            parentId: ["Une catégorie ne peut pas être son propre parent"],
          },
        };
      }

      const parent = await prisma.placeCategory.findUnique({
        where: { id: validatedData.parentId },
        select: { id: true },
      });

      if (!parent) {
        return {
          success: false,
          errors: {
            parentId: ["La catégorie parent n'existe pas"],
          },
        };
      }
    }

    // Extraire l'ID pour la mise à jour
    const { id, ...updateData } = validatedData;

    // Mettre à jour la catégorie
    const category = await prisma.placeCategory.update({
      where: { id },
      data: updateData,
      select: {
        name: true,
        slug: true,
      },
    });

    revalidatePath("/dashboard/admin/place-categories");

    return {
      success: true,
      data: {
        name: category.name,
        slug: category.slug,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la catégorie:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la mise à jour de la catégorie",
    };
  }
}

// DELETE - Supprimer une catégorie
export async function deletePlaceCategoryAction(categoryId: string): Promise<ActionResult> {
  try {
    await checkAdminPermissions();

    // Vérifier que la catégorie existe
    const category = await prisma.placeCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { children: true },
        },
      },
    });

    if (!category) {
      return {
        success: false,
        error: "Catégorie introuvable",
      };
    }

    // Empêcher la suppression si elle a des enfants
    if (category._count.children > 0) {
      return {
        success: false,
        error: `Impossible de supprimer cette catégorie car elle contient ${category._count.children} sous-catégorie(s)`,
      };
    }

    // Vérifier si des places utilisent cette catégorie (si on a une relation)
    // Pour l'instant, on suppose que les places utilisent le champ category comme string
    // Plus tard, on pourra ajouter une vraie relation

    // Supprimer la catégorie
    await prisma.placeCategory.delete({
      where: { id: categoryId },
    });

    revalidatePath("/dashboard/admin/place-categories");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la suppression de la catégorie:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la suppression de la catégorie",
    };
  }
}

// STATS - Obtenir les statistiques des catégories
export async function getPlaceCategoryStatsAction(): Promise<
  ActionResult<{
    total: number;
    active: number;
    inactive: number;
    rootCategories: number;
    subCategories: number;
  }>
> {
  try {
    // Exécuter les requêtes en parallèle
    const [
      total,
      active,
      inactive,
      rootCategories,
      subCategories,
    ] = await Promise.all([
      // Total des catégories
      prisma.placeCategory.count(),
      // Catégories actives
      prisma.placeCategory.count({ where: { isActive: true } }),
      // Catégories inactives
      prisma.placeCategory.count({ where: { isActive: false } }),
      // Catégories racines (sans parent)
      prisma.placeCategory.count({ where: { parentId: null } }),
      // Sous-catégories (avec parent)
      prisma.placeCategory.count({ where: { parentId: { not: null } } }),
    ]);

    return {
      success: true,
      data: {
        total,
        active,
        inactive,
        rootCategories,
        subCategories,
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

// GET HIERARCHICAL - Obtenir toutes les catégories en arbre hiérarchique
export async function getPlaceCategoriesHierarchyAction(): Promise<ActionResult<any[]>> {
  try {
    // Récupérer toutes les catégories actives
    const categories = await prisma.placeCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Filtrer pour ne garder que les catégories racines (sans parent)
    const rootCategories = categories.filter(cat => !cat.parentId);

    return {
      success: true,
      data: rootCategories,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de la hiérarchie:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la récupération de la hiérarchie",
    };
  }
}

// REORDER - Réorganiser l'ordre des catégories
export async function reorderPlaceCategoriesAction(
  categoryIds: string[]
): Promise<ActionResult> {
  try {
    await checkAdminPermissions();

    // Mettre à jour l'ordre de tri de chaque catégorie
    const updatePromises = categoryIds.map((categoryId, index) =>
      prisma.placeCategory.update({
        where: { id: categoryId },
        data: { sortOrder: index },
      })
    );

    await Promise.all(updatePromises);

    revalidatePath("/dashboard/admin/place-categories");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la réorganisation:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la réorganisation",
    };
  }
}