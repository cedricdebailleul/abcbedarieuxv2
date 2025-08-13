import { z } from "zod";

// Schéma pour créer une catégorie de place
export const createPlaceCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  slug: z
    .string()
    .min(1, "Le slug est requis")
    .max(100, "Le slug ne peut pas dépasser 100 caractères")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug doit être en minuscules avec des tirets uniquement"),
  description: z
    .string()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional()
    .nullable(),
  
  // Apparence visuelle
  icon: z
    .string()
    .max(50, "L'icône ne peut pas dépasser 50 caractères")
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Couleur invalide (format: #RRGGBB)")
    .optional()
    .nullable(),
  bgColor: z
    .string()
    .max(50, "La classe background ne peut pas dépasser 50 caractères")
    .optional()
    .nullable(),
  textColor: z
    .string()
    .max(50, "La classe texte ne peut pas dépasser 50 caractères")
    .optional()
    .nullable(),
  borderColor: z
    .string()
    .max(50, "La classe bordure ne peut pas dépasser 50 caractères")
    .optional()
    .nullable(),
  
  // Configuration
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  
  // Relations hiérarchiques
  parentId: z.string().optional().nullable(),
});

// Schéma pour mettre à jour une catégorie
export const updatePlaceCategorySchema = createPlaceCategorySchema.extend({
  id: z.string().min(1, "ID requis"),
});

// Schéma pour les filtres de recherche
export const placeCategoryFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().optional().nullable(),
  sortBy: z.enum(["name", "sortOrder", "createdAt", "placeCount"]).default("sortOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Types exportés
export type CreatePlaceCategoryInput = z.infer<typeof createPlaceCategorySchema>;
export type UpdatePlaceCategoryInput = z.infer<typeof updatePlaceCategorySchema>;
export type PlaceCategoryFilters = z.infer<typeof placeCategoryFiltersSchema>;

// Classes Tailwind prédéfinies pour les apparences
export const PREDEFINED_COLORS = [
  { name: "Gris", hex: "#6B7280", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  { name: "Rouge", hex: "#EF4444", bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  { name: "Orange", hex: "#F97316", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  { name: "Jaune", hex: "#EAB308", bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  { name: "Vert", hex: "#22C55E", bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  { name: "Bleu", hex: "#3B82F6", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  { name: "Indigo", hex: "#6366F1", bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  { name: "Violet", hex: "#8B5CF6", bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
  { name: "Rose", hex: "#EC4899", bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
  { name: "Cyan", hex: "#06B6D4", bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
] as const;

// Icônes prédéfinies (noms d'icônes Lucide)
export const PREDEFINED_ICONS = [
  // Commerce
  { name: "Magasin", icon: "Store", category: "Commerce" },
  { name: "Panier", icon: "ShoppingBag", category: "Commerce" },
  { name: "Tag", icon: "Tag", category: "Commerce" },
  { name: "Carte bancaire", icon: "CreditCard", category: "Commerce" },
  
  // Restaurant
  { name: "Restaurant", icon: "UtensilsCrossed", category: "Restaurant" },
  { name: "Chef", icon: "ChefHat", category: "Restaurant" },
  { name: "Café", icon: "Coffee", category: "Restaurant" },
  { name: "Verre", icon: "Wine", category: "Restaurant" },
  { name: "Pizza", icon: "Pizza", category: "Restaurant" },
  
  // Service
  { name: "Engrenage", icon: "Settings", category: "Service" },
  { name: "Outil", icon: "Wrench", category: "Service" },
  { name: "Marteau", icon: "Hammer", category: "Service" },
  { name: "Clé", icon: "Key", category: "Service" },
  { name: "Ampoule", icon: "Lightbulb", category: "Service" },
  
  // Santé
  { name: "Cœur", icon: "Heart", category: "Santé" },
  { name: "Croix médicale", icon: "Plus", category: "Santé" },
  { name: "Stéthoscope", icon: "Stethoscope", category: "Santé" },
  { name: "Pilule", icon: "Pill", category: "Santé" },
  
  // Loisirs
  { name: "Jeu", icon: "Gamepad2", category: "Loisirs" },
  { name: "Caméra", icon: "Camera", category: "Loisirs" },
  { name: "Musique", icon: "Music", category: "Loisirs" },
  { name: "Livre", icon: "Book", category: "Loisirs" },
  { name: "Film", icon: "Film", category: "Loisirs" },
  
  // Transport
  { name: "Voiture", icon: "Car", category: "Transport" },
  { name: "Bus", icon: "Bus", category: "Transport" },
  { name: "Train", icon: "Train", category: "Transport" },
  { name: "Vélo", icon: "Bike", category: "Transport" },
  { name: "Avion", icon: "Plane", category: "Transport" },
  
  // Éducation
  { name: "École", icon: "GraduationCap", category: "Éducation" },
  { name: "Livre ouvert", icon: "BookOpen", category: "Éducation" },
  { name: "Calculatrice", icon: "Calculator", category: "Éducation" },
  { name: "Microscope", icon: "Microscope", category: "Éducation" },
  
  // Nature & Parcs
  { name: "Arbre", icon: "Tree", category: "Nature" },
  { name: "Fleur", icon: "Flower", category: "Nature" },
  { name: "Montagne", icon: "Mountain", category: "Nature" },
  { name: "Soleil", icon: "Sun", category: "Nature" },
  { name: "Eau", icon: "Waves", category: "Nature" },
  
  // Administration
  { name: "Bâtiment", icon: "Building", category: "Administration" },
  { name: "Balance", icon: "Scale", category: "Administration" },
  { name: "Couronne", icon: "Crown", category: "Administration" },
  { name: "Fichier", icon: "FileText", category: "Administration" },
  { name: "Bouclier", icon: "Shield", category: "Administration" },
] as const;

// Fonction utilitaire pour générer un slug
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, "") // Supprime les caractères spéciaux
    .trim()
    .replace(/\s+/g, "-") // Remplace les espaces par des tirets
    .replace(/-+/g, "-"); // Supprime les tirets multiples
}