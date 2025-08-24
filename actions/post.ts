"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { BadgeSystem } from "@/lib/badge-system";
import {
  createPostSchema,
  updatePostSchema,
  postFiltersSchema,
  bulkPublishSchema,
  bulkDeleteSchema,
  createCategorySchema,
  createTagSchema,
  type CreatePostInput,
  type UpdatePostInput,
  type PostFilters,
  type CategoryInput,
} from "@/lib/validations/post";
import { Prisma, PostStatus } from "@/lib/generated/prisma";

// Types pour les réponses
type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

// Utilitaire pour vérifier les permissions
async function checkPostPermissions(postId?: string, requireAdmin = false) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    throw new Error("Non authentifié");
  }

  const user = session.user;

  // Les admins et éditeurs ont tous les droits
  if (user.role === "admin" || user.role === "editor") {
    return { user, canEdit: true, canDelete: true, canPublish: true };
  }

  // Pour un post spécifique, vérifier la propriété
  if (postId) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      throw new Error("Article introuvable");
    }

    const isOwner = post.authorId === user.id;

    if (requireAdmin && !isOwner) {
      throw new Error("Permissions insuffisantes");
    }

    return {
      user,
      canEdit: isOwner,
      canDelete: isOwner,
      canPublish: user.role === "admin" || user.role === "editor",
    };
  }

  return {
    user,
    canEdit: true,
    canDelete: true,
    canPublish: user.role === "admin" || user.role === "editor",
  };
}

// CREATE - Créer un nouveau post
export async function createPostAction(input: CreatePostInput): Promise<
  ActionResult<{
    id: string;
    slug: string;
    newBadges?: Array<{
      badge: {
        title: string;
        description: string;
        iconUrl?: string | null;
        color?: string | null;
        rarity: string;
      };
      reason: string;
    }>;
  }>
> {
  try {
    const { user } = await checkPostPermissions();

    // Validation des données
    const validatedData = createPostSchema.parse(input);

    // Vérifier l'unicité du slug
    const existingPost = await prisma.post.findUnique({
      where: { slug: validatedData.slug },
      select: { id: true },
    });

    if (existingPost) {
      return {
        success: false,
        errors: {
          slug: ["Ce slug existe déjà"],
        },
      };
    }

    // Vérifier que la catégorie existe si fournie
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
        select: { id: true },
      });

      if (!category) {
        return {
          success: false,
          errors: {
            categoryId: ["Catégorie introuvable"],
          },
        };
      }
    }

    // Séparer les tagIds du reste des données
    const { tagIds, ...postData } = validatedData;

    // Créer le post
    const post = await prisma.post.create({
      data: {
        ...postData,
        authorId: user.id,
        // Si publié par un non-admin/éditeur, mettre en attente de modération
        status:
          validatedData.published &&
          user.role !== "admin" &&
          user.role !== "editor"
            ? PostStatus.PENDING_REVIEW
            : validatedData.status,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    // Gérer les tags si fournis
    if (tagIds && tagIds.length > 0) {
      await prisma.postTag.createMany({
        data: tagIds.map((tagId) => ({
          postId: post.id,
          tagId,
        })),
        skipDuplicates: true,
      });
    }

    // Attribution automatique des badges pour les articles
    const newBadges = await BadgeSystem.onPostCreated(user.id);

    revalidatePath("/dashboard/posts");
    revalidatePath("/posts");

    return {
      success: true,
      data: {
        id: post.id,
        slug: post.slug,
        newBadges, // Ajouter les nouveaux badges dans la réponse
      },
    };
  } catch (error) {
    console.error("Erreur lors de la création du post:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la création de l'article",
    };
  }
}

// READ - Obtenir un post par ID ou slug
export async function getPostAction(
  identifier: string,
  includeUnpublished = false
): Promise<
  ActionResult<{
    id: string;
    slug: string;
    author: { id: string; name: string; email: string; image: string | null };
    category: { id: string; name: string; slug: string; color: string | null } | null;
    tags: Array<{
      tag: { id: string; name: string; slug: string; color: string | null };
    }>;
  }>
> {
  try {
    const whereClause: Prisma.PostWhereInput = {
      OR: [{ id: identifier }, { slug: identifier }],
    };

    // Si includeUnpublished est false, filtrer les articles non publiés
    if (!includeUnpublished) {
      whereClause.published = true;
      whereClause.status = PostStatus.PUBLISHED;
    }

    const post = await prisma.post.findFirst({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return {
        success: false,
        error: "Article introuvable",
      };
    }

    // Incrémenter le nombre de vues
    await prisma.post.update({
      where: { id: post.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      data: {
        ...post,
        category: post.category
          ? {
              id: post.category.id,
              name: post.category.name,
              slug: post.category.slug,
              color: post.category.color,
            }
          : null,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du post:", error);

    return {
      success: false,
      error: "Erreur lors de la récupération de l'article",
    };
  }
}

// READ - Lister les posts avec filtres et pagination
export async function getPostsAction(
  filters: PostFilters
): Promise<
  ActionResult<{
    posts: Array<{
      id: string;
      title: string;
      slug: string;
      author: { id: string; name: string };
      category?: { id: string; name: string };
      tags: Array<{ tag: { id: string; name: string } }>;
    }>;
    total: number;
    pages: number;
  }>
> {
  try {
    // Vérifier l'authentification et les permissions
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    const user = session.user;
    const canSeeAll = user.role === "admin" || user.role === "editor";

    // Nettoyer les filtres avant validation
    const cleanFilters = {
      ...filters,
      status:
        filters.status &&
        Object.values(PostStatus).includes(filters.status as PostStatus)
          ? filters.status
          : undefined,
    };

    const validatedFilters = postFiltersSchema.parse(cleanFilters);
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      status,
      categoryId,
      tagId,
      authorId,
      published,
    } = validatedFilters;

    // Construire les conditions de filtre avec permissions
    const whereClause: Prisma.PostWhereInput = canSeeAll
      ? {} // Admins et éditeurs voient tout
      : { authorId: user.id }; // Utilisateurs voient seulement leurs articles

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (published !== undefined) {
      whereClause.published = published;
    }

    if (categoryId && categoryId !== "") {
      whereClause.categoryId = categoryId;
    }

    if (tagId && tagId !== "") {
      whereClause.tags = {
        some: {
          tagId: tagId,
        },
      };
    }

    // Pour les utilisateurs normaux, on garde leur filtre de sécurité
    // Seuls les admins/éditeurs peuvent filtrer par un autre auteur
    if (authorId && authorId !== "" && canSeeAll) {
      whereClause.authorId = authorId;
    }

    // Calculer le skip pour la pagination
    const skip = (page - 1) * limit;

    // Construire l'ordre de tri
    const orderBy: Prisma.PostOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Exécuter les requêtes en parallèle
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          place: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              city: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                },
              },
            },
          },
          _count: {
            select: {
              tags: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        posts: posts.map((post) => ({
          ...post,
          category: post.category
            ? {
                id: post.category.id,
                name: post.category.name,
                slug: post.category.slug,
                color: post.category.color,
              }
            : undefined,
          tags: post.tags.map((tag) => ({
            tag: { id: tag.tag.id, name: tag.tag.name },
          })),
        })),
        total,
        pages,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des posts:", error);

    return {
      success: false,
      error: "Erreur lors de la récupération des articles",
    };
  }
}

// UPDATE - Mettre à jour un post
export async function updatePostAction(
  input: UpdatePostInput
): Promise<ActionResult<{ slug: string }>> {
  try {
    if (!input.id) {
      return {
        success: false,
        error: "ID du post requis",
      };
    }

    const { canEdit } = await checkPostPermissions(input.id);

    if (!canEdit) {
      return {
        success: false,
        error: "Permissions insuffisantes",
      };
    }

    // Validation des données
    const validatedData = updatePostSchema.parse(input);

    // Vérifier l'unicité du slug si modifié
    if (validatedData.slug) {
      const existingPost = await prisma.post.findFirst({
        where: {
          slug: validatedData.slug,
          NOT: { id: validatedData.id },
        },
        select: { id: true },
      });

      if (existingPost) {
        return {
          success: false,
          errors: {
            slug: ["Ce slug existe déjà"],
          },
        };
      }
    }

    // Vérifier que la catégorie existe si fournie
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
        select: { id: true },
      });

      if (!category) {
        return {
          success: false,
          errors: {
            categoryId: ["Catégorie introuvable"],
          },
        };
      }
    }

    // Extraire les données pour la mise à jour
    const { id, tagIds, ...updateData } = validatedData;

    // Mettre à jour le post
    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        slug: true,
      },
    });

    // Gérer les tags si fournis
    if (tagIds) {
      // Supprimer les anciens tags
      await prisma.postTag.deleteMany({
        where: { postId: id },
      });

      // Ajouter les nouveaux tags
      if (tagIds.length > 0) {
        await prisma.postTag.createMany({
          data: tagIds.map((tagId) => ({
            postId: id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }
    }

    revalidatePath("/dashboard/posts");
    revalidatePath("/posts");
    revalidatePath(`/posts/${post.slug}`);

    return {
      success: true,
      data: {
        slug: post.slug,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du post:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la mise à jour de l'article",
    };
  }
}

// DELETE - Supprimer un post
export async function deletePostAction(postId: string): Promise<ActionResult> {
  try {
    const { canDelete } = await checkPostPermissions(postId);

    if (!canDelete) {
      return {
        success: false,
        error: "Permissions insuffisantes",
      };
    }

    // Supprimer le post (les relations sont supprimées automatiquement avec onDelete: Cascade)
    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/dashboard/posts");
    revalidatePath("/posts");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du post:", error);

    return {
      success: false,
      error: "Erreur lors de la suppression de l'article",
    };
  }
}

// Actions en lot
export async function bulkPublishPostsAction(input: {
  postIds: string[];
  published: boolean;
}): Promise<ActionResult> {
  try {
    const { user } = await checkPostPermissions();

    // Seuls les admins/éditeurs peuvent publier en lot
    if (user.role !== "admin" && user.role !== "editor") {
      return {
        success: false,
        error: "Permissions insuffisantes",
      };
    }

    const validatedData = bulkPublishSchema.parse(input);

    await prisma.post.updateMany({
      where: {
        id: { in: validatedData.postIds },
      },
      data: {
        published: validatedData.published,
        publishedAt: validatedData.published ? new Date() : null,
        status: validatedData.published
          ? PostStatus.PUBLISHED
          : PostStatus.DRAFT,
      },
    });

    revalidatePath("/dashboard/posts");
    revalidatePath("/posts");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la publication en lot:", error);

    return {
      success: false,
      error: "Erreur lors de la publication des articles",
    };
  }
}

export async function bulkDeletePostsAction(input: {
  postIds: string[];
}): Promise<ActionResult> {
  try {
    const { user } = await checkPostPermissions();

    // Seuls les admins peuvent supprimer en lot
    if (user.role !== "admin") {
      return {
        success: false,
        error: "Permissions insuffisantes",
      };
    }

    const validatedData = bulkDeleteSchema.parse(input);

    await prisma.post.deleteMany({
      where: {
        id: { in: validatedData.postIds },
      },
    });

    revalidatePath("/dashboard/posts");
    revalidatePath("/posts");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la suppression en lot:", error);

    return {
      success: false,
      error: "Erreur lors de la suppression des articles",
    };
  }
}

// GET STATS - Obtenir les statistiques des posts
export async function getPostsStatsAction(): Promise<
  ActionResult<{
    total: number;
    published: number;
    drafts: number;
    totalViews: number;
  }>
> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    const user = session.user;
    const canSeeAll = user.role === "admin" || user.role === "editor";

    // Construire les conditions de base
    const whereClause: Prisma.PostWhereInput = canSeeAll
      ? {}
      : { authorId: user.id };

    // Exécuter les requêtes en parallèle
    const [total, published, drafts, totalViewsResult] = await Promise.all([
      // Total des articles
      prisma.post.count({
        where: whereClause,
      }),
      // Articles publiés
      prisma.post.count({
        where: {
          ...whereClause,
          published: true,
          status: PostStatus.PUBLISHED,
        },
      }),
      // Brouillons
      prisma.post.count({
        where: {
          ...whereClause,
          OR: [{ published: false }, { status: PostStatus.DRAFT }],
        },
      }),
      // Total des vues
      prisma.post.aggregate({
        where: whereClause,
        _sum: {
          viewCount: true,
        },
      }),
    ]);

    const totalViews = totalViewsResult._sum.viewCount || 0;

    return {
      success: true,
      data: {
        total,
        published,
        drafts,
        totalViews,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);

    return {
      success: false,
      error: "Erreur lors de la récupération des statistiques",
    };
  }
}

// GET PUBLIC POSTS - Obtenir les articles publiés avec filtres (pour page articles publique)
export async function getPublicPostsAction(
  filters: Partial<PostFilters>
): Promise<
  ActionResult<{
    posts: Array<{
      id: string;
      title: string;
      slug: string;
      excerpt?: string | null;
      content?: string | null;
      published: boolean;
      publishedAt?: Date | null;
      createdAt: Date;
      updatedAt: Date;
      author: { id: string; name: string };
      category?: { id: string; name: string; slug: string; color?: string | null } | null;
      place?: { id: string; name: string; slug: string; type: string; city?: string | null } | null;
      tags: Array<{ tag: { id: string; name: string; slug: string; color?: string | null } }>;
    }>;
    total: number;
    pages: number;
  }>
> {
  try {
    const validatedFilters = postFiltersSchema.parse({
      ...filters,
      // Forcer les articles publiés seulement
      published: true,
    });

    const { page, limit, sortBy, sortOrder, search, categoryId, tagId } =
      validatedFilters;

    // Construire les conditions de filtre (seulement articles publiés)
    const whereClause: Prisma.PostWhereInput = {
      published: true,
      status: PostStatus.PUBLISHED,
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId && categoryId !== "") {
      whereClause.categoryId = categoryId;
    }

    if (tagId && tagId !== "") {
      whereClause.tags = {
        some: {
          tagId: tagId,
        },
      };
    }

    // Calculer le skip pour la pagination
    const skip = (page - 1) * limit;

    // Construire l'ordre de tri
    const orderBy: Prisma.PostOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Exécuter les requêtes en parallèle
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          place: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              city: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        posts: posts.map((post) => ({
          ...post,
          category: post.category
            ? { 
                id: post.category.id, 
                name: post.category.name, 
                slug: post.category.slug, 
                color: post.category.color 
              }
            : null,
          tags: post.tags.map((tag) => ({
            tag: { 
              id: tag.tag.id, 
              name: tag.tag.name, 
              slug: tag.tag.slug, 
              color: tag.tag.color 
            },
          })),
        })),
        total,
        pages,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des posts publics:", error);

    return {
      success: false,
      error: "Erreur lors de la récupération des articles",
    };
  }
}

// GET LATEST POSTS - Obtenir les derniers articles publiés (pour page d'accueil)
export async function getLatestPostsAction(
  limit: number = 6
): Promise<
  ActionResult<
    {
      id: string;
      title: string;
      slug: string;
      excerpt?: string | null;
      content?: string | null;
      published: boolean;
      publishedAt?: Date | null;
      createdAt: Date;
      updatedAt: Date;
      coverImage?: string | null;
      author: { id: string; name: string; image?: string | null };
      category?: { id: string; name: string; slug: string; color?: string | null } | null;
      tags: Array<{ tag: { id: string; name: string; slug: string; color?: string | null } }>;
    }[]
  >
> {
  try {
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        status: PostStatus.PUBLISHED,
        placeId: null, // Seulement les articles de l'association (non liés à un lieu)
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: limit,
    });

    return {
      success: true,
      data: posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        published: post.published,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        coverImage: post.coverImage,
        author: {
          id: post.author.id,
          name: post.author.name || "Utilisateur",
          image: post.author.image,
        },
        category: post.category ? {
          id: post.category.id,
          name: post.category.name,
          slug: post.category.slug,
          color: post.category.color,
        } : null,
        tags: post.tags.map((tag) => ({
          tag: {
            id: tag.tag.id,
            name: tag.tag.name,
            slug: tag.tag.slug,
            color: tag.tag.color,
          },
        })),
      })),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des derniers posts:", error);

    return {
      success: false,
      error: "Erreur lors de la récupération des articles",
    };
  }
}

// Actions utilitaires
export async function getCategoriesAction(): Promise<
  ActionResult<
    {
      id: string;
      name: string;
      slug: string;
      color: string | null;
      _count: { posts: number };
    }[]
  >
> {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);

    return {
      success: false,
      error: "Erreur lors de la récupération des catégories",
    };
  }
}

// GET PUBLIC CATEGORIES - Obtenir les catégories avec nombre d'articles publiés
export async function getPublicCategoriesAction(): Promise<
  ActionResult<
    {
      id: string;
      name: string;
      slug: string;
      color: string | null;
      _count: { posts: number };
    }[]
  >
> {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        _count: {
          select: {
            posts: {
              where: {
                published: true,
                status: PostStatus.PUBLISHED,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Filtrer les catégories qui ont au moins un article publié
    const categoriesWithPosts = categories.filter(
      (category) => category._count.posts > 0
    );

    return {
      success: true,
      data: categoriesWithPosts,
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des catégories publiques:",
      error
    );

    return {
      success: false,
      error: "Erreur lors de la récupération des catégories",
    };
  }
}

export async function getTagsAction(): Promise<
  ActionResult<
    {
      id: string;
      name: string;
      slug: string;
      color: string | null;
      _count: { posts: number };
    }[]
  >
> {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: tags,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);

    return {
      success: false,
      error: "Erreur lors de la récupération des tags",
    };
  }
}

// GET PUBLIC TAGS - Obtenir les tags avec nombre d'articles publiés
export async function getPublicTagsAction(): Promise<
  ActionResult<
    {
      id: string;
      name: string;
      slug: string;
      color: string | null;
      _count: { posts: number };
    }[]
  >
> {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        _count: {
          select: {
            posts: {
              where: {
                post: {
                  published: true,
                  status: PostStatus.PUBLISHED,
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Filtrer les tags qui ont au moins un article publié
    const tagsWithPosts = tags.filter((tag) => tag._count.posts > 0);

    return {
      success: true,
      data: tagsWithPosts,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des tags publics:", error);

    return {
      success: false,
      error: "Erreur lors de la récupération des tags",
    };
  }
}

// CREATE CATEGORY - Créer une nouvelle catégorie
export async function createCategoryAction(
  input: CategoryInput
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    // Vérifier les permissions
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    const user = session.user;

    // Tous les utilisateurs authentifiés peuvent créer des catégories
    // (Pour organiser leurs propres articles)
    if (!user.role) {
      return {
        success: false,
        error: "Permissions insuffisantes - rôle utilisateur requis",
      };
    }

    // Valider les données
    const validatedData = createCategorySchema.parse(input);

    // Vérifier l'unicité du nom et du slug
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: validatedData.name }, { slug: validatedData.slug }],
      },
    });

    if (existingCategory) {
      return {
        success: false,
        error:
          existingCategory.name === validatedData.name
            ? "Une catégorie avec ce nom existe déjà"
            : "Une catégorie avec ce slug existe déjà",
      };
    }

    // Créer la catégorie
    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        color: validatedData.color,
        parentId: validatedData.parentId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
      },
    });

    revalidatePath("/dashboard/posts");

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie:", error);

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Données invalides",
      };
    }

    return {
      success: false,
      error: "Erreur lors de la création de la catégorie",
    };
  }
}

// CREATE TAGS - Créer un ou plusieurs tags
export async function createTagsAction(input: {
  names: string;
  color?: string;
}): Promise<
  ActionResult<{
    created: Array<{
      id: string;
      name: string;
      slug: string;
      color?: string | null;
    }>;
    existing: Array<{
      id: string;
      name: string;
      slug: string;
      color?: string | null;
    }>;
  }>
> {
  try {
    // Vérifier les permissions
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    const user = session.user;

    // Tous les utilisateurs authentifiés peuvent créer des tags
    // (Pour organiser leurs propres articles)
    if (!user.role) {
      return {
        success: false,
        error: "Permissions insuffisantes - rôle utilisateur requis",
      };
    }

    // Traiter les noms de tags (séparer par virgule et nettoyer)
    const tagNames = input.names
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .filter((name, index, arr) => arr.indexOf(name) === index); // Supprimer les doublons

    if (tagNames.length === 0) {
      return {
        success: false,
        error: "Aucun nom de tag valide fourni",
      };
    }

    // Vérifier les tags existants
    const existingTags = await prisma.tag.findMany({
      where: {
        name: { in: tagNames },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
      },
    });

    const existingNames = existingTags.map((tag) => tag.name);
    const newTagNames = tagNames.filter(
      (name) => !existingNames.includes(name)
    );

    // Créer les nouveaux tags
    const createdTags = [];
    for (const name of newTagNames) {
      try {
        const validatedData = createTagSchema.parse({
          name,
          color: input.color,
        });

        const tag = await prisma.tag.create({
          data: validatedData,
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        });

        createdTags.push(tag);
      } catch (error) {
        console.error(`Erreur lors de la création du tag "${name}":`, error);
        // Continuer avec les autres tags
      }
    }

    revalidatePath("/dashboard/posts");

    return {
      success: true,
      data: {
        created: createdTags,
        existing: existingTags,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la création des tags:", error);

    return {
      success: false,
      error: "Erreur lors de la création des tags",
    };
  }
}
