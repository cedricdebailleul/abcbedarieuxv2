import { BadgeCategory, BadgeRarity } from "@/lib/generated/prisma/client";

// Types de base pour les badges
export interface Badge {
  id: string;
  title: string;
  description: string;
  iconUrl: string | null;
  color: string | null;
  category: BadgeCategory;
  rarity: BadgeRarity;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Badge avec informations d'utilisateur
export interface BadgeWithUsers extends Badge {
  users: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    earnedAt: Date;
  }>;
  _count: { users: number };
}

// Badge pour les listes et tableaux
export interface BadgeListItem extends Badge {
  _count: { users: number };
}

// Badge pour les formulaires
export interface BadgeFormData {
  id?: string;
  title: string;
  description: string;
  iconUrl: string;
  color: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  isActive: boolean;
}

// Badge pour la création
export interface CreateBadgeData {
  title: string;
  description: string;
  iconUrl?: string | null;
  color?: string | null;
  category: BadgeCategory;
  rarity: BadgeRarity;
  isActive?: boolean;
}

// Badge pour la mise à jour
export interface UpdateBadgeData extends CreateBadgeData {
  id: string;
}

// Distribution des badges par catégorie/rareté
export interface BadgeDistribution {
  category: BadgeCategory;
  rarity: BadgeRarity;
  count: number;
  badges: BadgeListItem[];
}

// Statistiques des badges
export interface BadgeStats {
  total: number;
  active: number;
  inactive: number;
  totalAwarded: number;
  byCategory: Record<BadgeCategory, number>;
  byRarity: Record<BadgeRarity, number>;
  categoriesStats: Record<BadgeCategory, number>;
  raritiesStats: Record<BadgeRarity, number>;
}

// Résultat d'attribution de badge
export interface BadgeAwardResult {
  badge: {
    id: string;
    title: string;
    description: string;
    iconUrl?: string | null;
    color?: string | null;
    rarity: BadgeRarity;
  };
  reason: string;
}

// Exports des enums pour faciliter l'utilisation
export { BadgeCategory, BadgeRarity } from "@/lib/generated/prisma/client";

// Types pour les filtres
export interface BadgeFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: BadgeCategory;
  rarity?: BadgeRarity;
  isActive?: boolean;
  sortBy?: "title" | "category" | "rarity" | "createdAt" | "userCount";
  sortOrder?: "asc" | "desc";
}

// Types pour les validations
export interface BadgeValidationErrors {
  title?: string[];
  description?: string[];
  iconUrl?: string[];
  color?: string[];
  category?: string[];
  rarity?: string[];
  isActive?: string[];
}

// Types pour les utilisateurs dans le contexte badges
export interface UserSearchResult {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
}