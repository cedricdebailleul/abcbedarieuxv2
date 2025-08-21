"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Types pour les réponses
type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Utilitaire pour vérifier l'authentification
async function checkAuth() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new Error("Authentification requise");
  }

  return { user: session.user };
}

// Ajouter une place aux favoris
export async function addToFavoritesAction(placeId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await checkAuth();

    // Vérifier que la place existe et est active
    const place = await prisma.place.findFirst({
      where: {
        id: placeId,
        status: "ACTIVE",
        isActive: true
      },
      select: { id: true, name: true }
    });

    if (!place) {
      return {
        success: false,
        error: "Place introuvable ou inactive"
      };
    }

    // Vérifier si déjà en favoris
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId: placeId
        }
      }
    });

    if (existingFavorite) {
      return {
        success: false,
        error: "Cette place est déjà dans vos favoris"
      };
    }

    // Ajouter aux favoris
    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        placeId: placeId
      }
    });

    // Revalider les pages concernées
    revalidatePath(`/places/${place.id}`);
    revalidatePath("/dashboard/favorites");

    return {
      success: true,
      data: { id: favorite.id }
    };

  } catch (error) {
    console.error("Erreur lors de l'ajout aux favoris:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne"
    };
  }
}

// Retirer une place des favoris
export async function removeFromFavoritesAction(placeId: string): Promise<ActionResult> {
  try {
    const { user } = await checkAuth();

    // Vérifier que le favori existe
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId: placeId
        }
      },
      include: {
        place: {
          select: { id: true, name: true }
        }
      }
    });

    if (!favorite) {
      return {
        success: false,
        error: "Cette place n'est pas dans vos favoris"
      };
    }

    // Supprimer des favoris
    await prisma.favorite.delete({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId: placeId
        }
      }
    });

    // Revalider les pages concernées
    revalidatePath(`/places/${favorite.place.id}`);
    revalidatePath("/dashboard/favorites");

    return {
      success: true
    };

  } catch (error) {
    console.error("Erreur lors de la suppression des favoris:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne"
    };
  }
}

// Toggle favori (ajouter/retirer automatiquement)
export async function toggleFavoriteAction(placeId: string): Promise<ActionResult<{ isFavorite: boolean }>> {
  try {
    const { user } = await checkAuth();

    // Vérifier si déjà en favoris
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId: placeId
        }
      }
    });

    if (existingFavorite) {
      // Retirer des favoris
      const result = await removeFromFavoritesAction(placeId);
      if (result.success) {
        return {
          success: true,
          data: { isFavorite: false }
        };
      }
      return {
        success: false,
        data: { isFavorite: false },
        error: result.error
      };
    } else {
      // Ajouter aux favoris
      const result = await addToFavoritesAction(placeId);
      if (result.success) {
        return {
          success: true,
          data: { isFavorite: true }
        };
      }
      return {
        success: false,
        data: { isFavorite: true },
        error: result.error
      };
    }

  } catch (error) {
    console.error("Erreur lors du toggle favori:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne"
    };
  }
}

// Vérifier si une place est en favoris
export async function checkIsFavoriteAction(placeId: string): Promise<ActionResult<{ isFavorite: boolean }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    // Si pas connecté, pas de favoris
    if (!session?.user) {
      return {
        success: true,
        data: { isFavorite: false }
      };
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId: session.user.id,
          placeId: placeId
        }
      }
    });

    return {
      success: true,
      data: { isFavorite: !!favorite }
    };

  } catch (error) {
    console.error("Erreur lors de la vérification des favoris:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne"
    };
  }
}

// Récupérer les favoris d'un utilisateur
export async function getUserFavoritesAction(options?: {
  page?: number;
  limit?: number;
}): Promise<ActionResult<{
  favorites: {
    id: string;
    name: string;
    slug: string;
    type: string;
    status: string;
    city: string;
    street: string;
    coverImage: string | null;
    logo: string | null;
    isFeatured: boolean;
    createdAt: Date;
    latitude: number;
    longitude: number;
    categories: {
      category: {
        id: string;
        name: string;
        slug: string;
        icon: string;
        color: string;
      };
    }[];
    _count: {
      reviews: number;
      favorites: number;
    };
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}>> {
  try {
    const { user } = await checkAuth();

    const page = options?.page || 1;
    const limit = options?.limit || 12;
    const offset = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId: user.id },
        include: {
          place: {
            include: {
              categories: {
                include: {
                  category: {
                    select: { id: true, name: true, slug: true, icon: true, color: true }
                  }
                }
              },
              _count: {
                select: { reviews: true, favorites: true }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit
      }),
      prisma.favorite.count({
        where: { userId: user.id }
      })
    ]);

    return {
      success: true,
      data: {
        favorites: favorites.map(fav => ({
          ...fav.place,
          latitude: fav.place.latitude ?? 0,
          longitude: fav.place.longitude ?? 0,
          categories: fav.place.categories.map(cat => ({
            ...cat,
            category: {
              ...cat.category,
              icon: cat.category.icon ?? "",
              color: cat.category.color ?? "",
            }
          }))
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };

  } catch (error) {
    console.error("Erreur lors de la récupération des favoris:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne"
    };
  }
}