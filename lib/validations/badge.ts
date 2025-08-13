import { z } from "zod";
import { BadgeCategory, BadgeRarity } from "@/lib/generated/prisma";

// Schéma pour créer un badge
export const createBadgeSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(100, "Le titre ne peut pas dépasser 100 caractères"),
  description: z
    .string()
    .min(1, "La description est requise")
    .max(500, "La description ne peut pas dépasser 500 caractères"),
  category: z.nativeEnum(BadgeCategory, {
    errorMap: () => ({ message: "Catégorie invalide" }),
  }),
  rarity: z.nativeEnum(BadgeRarity, {
    errorMap: () => ({ message: "Rareté invalide" }),
  }),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Couleur invalide (format: #RRGGBB)")
    .optional()
    .nullable(),
  iconUrl: z
    .string()
    .max(500, "L'URL de l'icône ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
});

// Schéma pour mettre à jour un badge
export const updateBadgeSchema = createBadgeSchema.extend({
  id: z.string().min(1, "ID requis"),
});

// Schéma pour les filtres de recherche
export const badgeFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  category: z.nativeEnum(BadgeCategory).optional(),
  rarity: z.nativeEnum(BadgeRarity).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(["title", "category", "rarity", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Schéma pour attribuer un badge manuellement
export const awardBadgeSchema = z.object({
  badgeId: z.string().min(1, "ID du badge requis"),
  userId: z.string().min(1, "ID de l'utilisateur requis"),
  reason: z
    .string()
    .min(1, "La raison est requise")
    .max(200, "La raison ne peut pas dépasser 200 caractères"),
});

// Schéma pour retirer un badge
export const revokeBadgeSchema = z.object({
  badgeId: z.string().min(1, "ID du badge requis"),
  userId: z.string().min(1, "ID de l'utilisateur requis"),
});

// Types exportés
export type CreateBadgeInput = z.infer<typeof createBadgeSchema>;
export type UpdateBadgeInput = z.infer<typeof updateBadgeSchema>;
export type BadgeFilters = z.infer<typeof badgeFiltersSchema>;
export type AwardBadgeInput = z.infer<typeof awardBadgeSchema>;
export type RevokeBadgeInput = z.infer<typeof revokeBadgeSchema>;

// Couleurs par défaut pour chaque rareté
export const RARITY_COLORS = {
  [BadgeRarity.COMMON]: "#6B7280",
  [BadgeRarity.UNCOMMON]: "#10B981",
  [BadgeRarity.RARE]: "#3B82F6",
  [BadgeRarity.EPIC]: "#8B5CF6",
  [BadgeRarity.LEGENDARY]: "#F59E0B",
} as const;

// Labels d'affichage
export const CATEGORY_LABELS = {
  [BadgeCategory.ACHIEVEMENT]: "Accomplissement",
  [BadgeCategory.COMMUNITY]: "Communauté",
  [BadgeCategory.SPECIAL]: "Spécial",
  [BadgeCategory.TIME]: "Temporel",
} as const;

export const RARITY_LABELS = {
  [BadgeRarity.COMMON]: "Commun",
  [BadgeRarity.UNCOMMON]: "Peu commun",
  [BadgeRarity.RARE]: "Rare",
  [BadgeRarity.EPIC]: "Épique",
  [BadgeRarity.LEGENDARY]: "Légendaire",
} as const;