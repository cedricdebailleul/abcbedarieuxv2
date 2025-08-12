import { z } from "zod";
import { PostStatus } from "@/lib/generated/prisma";

// Fonction utilitaire pour générer un slug
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, "") // Garde seulement lettres, chiffres, espaces et tirets
    .trim()
    .replace(/\s+/g, "-") // Remplace les espaces par des tirets
    .replace(/-+/g, "-") // Évite les tirets multiples
    .substring(0, 100); // Limite la longueur
}

// Schéma de base pour Post
export const postSchema = z.object({
  id: z.string().cuid().optional(),
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(200, "Le titre ne peut pas dépasser 200 caractères")
    .trim(),
  slug: z
    .string()
    .min(3, "Le slug doit contenir au moins 3 caractères")
    .max(100, "Le slug ne peut pas dépasser 100 caractères")
    .regex(
      /^[a-z0-9-]+$/,
      "Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets"
    )
    .optional(),
  content: z
    .string()
    .max(50000, "Le contenu ne peut pas dépasser 50 000 caractères")
    .optional()
    .nullable(),
  excerpt: z
    .string()
    .max(500, "L'extrait ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  published: z.boolean().default(false),
  publishedAt: z.date().optional().nullable(),

  // Relations
  categoryId: z.string().cuid().optional().nullable(),
  tagIds: z.array(z.string().cuid()).default([]),

  // Image de couverture
  coverImage: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        // Accepter les URLs absolues ET relatives
        return z.string().url().safeParse(val).success || val.startsWith("/");
      },
      {
        message: "L'image de couverture doit être une URL valide ou vide",
      }
    ),

  // SEO
  metaTitle: z
    .string()
    .max(60, "Le titre SEO ne peut pas dépasser 60 caractères")
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(160, "La description SEO ne peut pas dépasser 160 caractères")
    .optional()
    .nullable(),
  ogImage: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        // Accepter les URLs absolues ET relatives
        return z.string().url().safeParse(val).success || val.startsWith("/");
      },
      {
        message: "L'image OG doit être une URL valide ou vide",
      }
    ),
  canonicalUrl: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val === "" || z.string().url().safeParse(val).success, {
      message: "L'URL canonique doit être une URL valide ou vide",
    }),

  // Status
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
});

// Schéma pour la création (sans ID)
export const createPostSchema = postSchema
  .omit({ id: true })
  .extend({
    // Le slug est généré automatiquement si non fourni
    slug: z.string().optional(),
  })
  .refine(
    (data) => {
      // Si publié, doit avoir un contenu
      if (data.published && !data.content?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: "Un article publié doit avoir un contenu",
      path: ["content"],
    }
  )
  .transform((data) => ({
    ...data,
    // Génère automatiquement le slug si non fourni
    slug: data.slug || generateSlug(data.title),
    // Met à jour publishedAt si published change
    publishedAt: data.published ? data.publishedAt || new Date() : null,
    // Convertir "none" en null pour categoryId
    categoryId: data.categoryId === "none" ? null : data.categoryId,
    // Convertir les chaînes vides en null pour les URLs et images
    coverImage: data.coverImage === "" ? null : data.coverImage,
    ogImage: data.ogImage === "" ? null : data.ogImage,
    canonicalUrl: data.canonicalUrl === "" ? null : data.canonicalUrl,
  }));

// Schéma pour la mise à jour (ID requis)
export const updatePostSchema = postSchema
  .extend({
    id: z.string().cuid(),
  })
  .partial()
  .extend({
    id: z.string().cuid(), // ID toujours requis pour update
    title: z
      .string()
      .min(3, "Le titre doit contenir au moins 3 caractères")
      .max(200, "Le titre ne peut pas dépasser 200 caractères")
      .trim()
      .optional(), // Optionnel pour update
  })
  .refine(
    (data) => {
      // Si publié, doit avoir un contenu
      if (data.published && !data.content?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: "Un article publié doit avoir un contenu",
      path: ["content"],
    }
  )
  .transform((data) => {
    const result = { ...data };

    // Génère le slug si le titre change et pas de slug fourni
    if (data.title && !data.slug) {
      result.slug = generateSlug(data.title);
    }

    // Met à jour publishedAt si published change
    if (data.published !== undefined) {
      result.publishedAt = data.published ? new Date() : null;
    }

    // Convertir "none" en null pour categoryId
    if (data.categoryId === "none") {
      result.categoryId = null;
    }

    // Convertir les chaînes vides en null pour les URLs et images
    if (data.coverImage === "") {
      result.coverImage = null;
    }
    if (data.ogImage === "") {
      result.ogImage = null;
    }
    if (data.canonicalUrl === "") {
      result.canonicalUrl = null;
    }

    return result;
  });

// Schéma pour les filtres de recherche
export const postFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(PostStatus).optional(),
  categoryId: z
    .string()
    .refine((val) => !val || z.string().cuid().safeParse(val).success)
    .optional(),
  tagId: z
    .string()
    .refine((val) => !val || z.string().cuid().safeParse(val).success)
    .optional(),
  authorId: z
    .string()
    .refine((val) => !val || z.string().cuid().safeParse(val).success)
    .optional(),
  published: z.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z
    .enum(["createdAt", "updatedAt", "publishedAt", "title", "viewCount"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Schéma pour la publication/dépublication en lot
export const bulkPublishSchema = z.object({
  postIds: z.array(z.string().cuid()).min(1, "Au moins un article doit être sélectionné"),
  published: z.boolean(),
});

// Schéma pour la suppression en lot
export const bulkDeleteSchema = z.object({
  postIds: z.array(z.string().cuid()).min(1, "Au moins un article doit être sélectionné"),
});

// Types TypeScript dérivés des schémas
export type PostInput = z.infer<typeof postSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostFilters = z.infer<typeof postFiltersSchema>;
export type BulkPublishInput = z.infer<typeof bulkPublishSchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;

// Schémas pour les relations

// Catégorie
export const categorySchema = z.object({
  id: z.string().cuid().optional(),
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(100, "Le slug ne peut pas dépasser 100 caractères")
    .regex(
      /^[a-z0-9-]+$/,
      "Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets"
    )
    .optional(),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être un code hexadécimal valide")
    .optional()
    .nullable(),
  parentId: z.string().cuid().optional().nullable(),
});

export const createCategorySchema = categorySchema.omit({ id: true }).transform((data) => ({
  ...data,
  slug: data.slug || generateSlug(data.name),
}));

// Tag
export const tagSchema = z.object({
  id: z.string().cuid().optional(),
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .trim(),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(50, "Le slug ne peut pas dépasser 50 caractères")
    .regex(
      /^[a-z0-9-]+$/,
      "Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets"
    )
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être un code hexadécimal valide")
    .optional()
    .nullable(),
});

export const createTagSchema = tagSchema.omit({ id: true }).transform((data) => ({
  ...data,
  slug: data.slug || generateSlug(data.name),
}));

export type CategoryInput = z.infer<typeof categorySchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type CreateCategoryOutput = z.infer<typeof createCategorySchema>;
