import { z } from "zod";

// ============================================================
//                    TYPES DE BASE
// ============================================================

export interface HistoryConfig {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  heroImage?: string | null;
  
  // Vision future
  visionTitle?: string | null;
  visionDescription?: string | null;
  visionImage?: string | null;
  
  // Boutons d'action
  primaryButtonText?: string | null;
  primaryButtonUrl?: string | null;
  secondaryButtonText?: string | null;
  secondaryButtonUrl?: string | null;
  
  // Métadonnées
  isActive: boolean;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations optionnelles
  milestones?: HistoryMilestone[];
  timelineEvents?: HistoryTimelineEvent[];
  updatedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface HistoryMilestone {
  id: string;
  configId: string;
  number: string;
  label: string;
  icon: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryTimelineEvent {
  id: string;
  configId: string;
  year: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
//                    SCHÉMAS DE VALIDATION ZOD
// ============================================================

export const HistoryConfigCreateSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  subtitle: z.string().max(500).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  heroImage: z.string().url().optional().nullable(),
  
  // Vision future
  visionTitle: z.string().max(200).optional().nullable(),
  visionDescription: z.string().max(1000).optional().nullable(),
  visionImage: z.string().url().optional().nullable(),
  
  // Boutons d'action
  primaryButtonText: z.string().max(100).optional().nullable(),
  primaryButtonUrl: z.string().max(500).optional().nullable(),
  secondaryButtonText: z.string().max(100).optional().nullable(),
  secondaryButtonUrl: z.string().max(500).optional().nullable(),
  
  // Métadonnées
  isActive: z.boolean().default(true),
});

export const HistoryConfigUpdateSchema = HistoryConfigCreateSchema.partial();

export const HistoryMilestoneCreateSchema = z.object({
  number: z.string().min(1, "Le numéro est requis").max(50),
  label: z.string().min(1, "Le libellé est requis").max(200),
  icon: z.string().min(1, "L'icône est requise").max(50),
  order: z.number().int().min(0),
  isActive: z.boolean().default(true),
});

export const HistoryMilestoneUpdateSchema = HistoryMilestoneCreateSchema.partial();

export const HistoryTimelineEventCreateSchema = z.object({
  year: z.string().min(1, "L'année est requise").max(10),
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().min(1, "La description est requise").max(1000),
  icon: z.string().min(1, "L'icône est requise").max(50),
  color: z.string().min(1, "La couleur est requise").max(100),
  order: z.number().int().min(0),
  isActive: z.boolean().default(true),
});

export const HistoryTimelineEventUpdateSchema = HistoryTimelineEventCreateSchema.partial();

// ============================================================
//                    TYPES POUR LES FORMULAIRES
// ============================================================

export type HistoryConfigFormData = z.infer<typeof HistoryConfigCreateSchema>;
export type HistoryMilestoneFormData = z.infer<typeof HistoryMilestoneCreateSchema>;
export type HistoryTimelineEventFormData = z.infer<typeof HistoryTimelineEventCreateSchema>;

// ============================================================
//                    TYPES POUR LES API RESPONSES
// ============================================================

export interface HistoryApiResponse {
  config: HistoryConfig | null;
  milestones: HistoryMilestone[];
  timelineEvents: HistoryTimelineEvent[];
}

export interface HistoryConfigResponse {
  config: HistoryConfig;
}

export interface HistoryMilestoneResponse {
  milestone: HistoryMilestone;
}

export interface HistoryTimelineEventResponse {
  event: HistoryTimelineEvent;
}

// ============================================================
//                    TYPES POUR LES FILTRES
// ============================================================

export interface HistoryFilters {
  isActive?: boolean;
  orderBy?: 'createdAt' | 'updatedAt' | 'order';
  orderDirection?: 'asc' | 'desc';
}

// ============================================================
//                    CONSTANTES
// ============================================================

export const LUCIDE_ICONS = [
  'Calendar',
  'MapPin', 
  'Lightbulb',
  'Rocket',
  'Users',
  'Star',
  'Trophy',
  'Heart',
  'Award',
  'Target',
  'Zap',
  'Gift',
  'Crown',
  'Shield',
  'Flag',
  'Home',
  'Building',
  'Store',
  'Coffee',
  'Camera',
  'Music',
  'Palette',
  'Scissors',
  'Wrench',
  'Book',
  'Newspaper',
  'Phone',
  'Mail',
  'Globe',
  'Map',
  'Navigation',
  'Compass',
  'Clock',
  'CheckCircle',
  'XCircle',
  'Plus',
  'Minus',
  'Edit',
  'Trash',
  'Settings',
  'Info',
  'AlertCircle',
  'HelpCircle',
  'Eye',
  'EyeOff',
  'ThumbsUp',
  'ThumbsDown',
  'MessageCircle',
  'Share',
  'Download',
  'Upload',
  'Link',
  'ExternalLink',
] as const;

export const COLOR_CLASSES = [
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600', 
  'bg-purple-100 text-purple-600',
  'bg-orange-100 text-orange-600',
  'bg-red-100 text-red-600',
  'bg-pink-100 text-pink-600',
  'bg-yellow-100 text-yellow-600',
  'bg-indigo-100 text-indigo-600',
  'bg-teal-100 text-teal-600',
  'bg-gray-100 text-gray-600',
  'bg-emerald-100 text-emerald-600',
  'bg-cyan-100 text-cyan-600',
  'bg-rose-100 text-rose-600',
  'bg-violet-100 text-violet-600',
  'bg-amber-100 text-amber-600',
] as const;

export type LucideIcon = typeof LUCIDE_ICONS[number];
export type ColorClass = typeof COLOR_CLASSES[number];