import { z } from "zod";
import { EventStatus, EventCategory, RecurrenceFrequency } from "@/lib/generated/prisma/browser";

// Schema de base pour un événement
export const eventSchema = z.object({
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(100, "Le titre ne peut pas dépasser 100 caractères"),
  
  slug: z
    .string()
    .optional()
    .refine((slug) => !slug || /^[a-z0-9-]+$/.test(slug), {
      message: "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets"
    }),
  
  description: z
    .string()
    .optional()
    .refine((desc) => !desc || desc.length <= 5000, {
      message: "La description ne peut pas dépasser 5000 caractères"
    }),
  
  summary: z
    .string()
    .optional()
    .refine((summary) => !summary || summary.length <= 280, {
      message: "Le résumé ne peut pas dépasser 280 caractères"
    }),
  
  status: z.nativeEnum(EventStatus).optional(),
  isFeatured: z.boolean().optional(),
  
  // Place associée
  placeId: z.string().optional(),
  
  // Contact
  email: z
    .string()
    .email("Format d'email invalide")
    .optional()
    .or(z.literal("")),
  
  phone: z
    .string()
    .optional()
    .refine((phone) => !phone || /^[+]?[\d\s\-()]{8,20}$/.test(phone), {
      message: "Format de téléphone invalide"
    }),
  
  website: z
    .string()
    .optional()
    .refine((url) => !url || url === "" || z.string().url().safeParse(url).success, {
      message: "Format d'URL invalide"
    }),
  
  ticketUrl: z
    .string()
    .optional()
    .refine((url) => !url || url === "" || z.string().url().safeParse(url).success, {
      message: "Format d'URL invalide"
    }),
  
  // Dates
  startDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Date de début invalide"
    }),
  
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Date de fin invalide"
    }),
  
  isAllDay: z.boolean().optional(),
  timezone: z.string().optional(),
  
  // Localisation
  locationName: z.string().optional(),
  locationAddress: z.string().optional(),
  locationStreet: z.string().optional(),
  locationStreetNumber: z.string().optional(),
  locationPostalCode: z.string().optional(),
  locationCity: z.string().optional(),
  locationLatitude: z.number().min(-90).max(90).optional(),
  locationLongitude: z.number().min(-180).max(180).optional(),
  googlePlaceId: z.string().optional(),
  googleMapsUrl: z
    .string()
    .optional()
    .refine((url) => !url || url === "" || z.string().url().safeParse(url).success, {
      message: "Format d'URL Google Maps invalide"
    }),
  
  // Participants
  maxParticipants: z
    .number()
    .int()
    .min(1, "Le nombre maximum de participants doit être d'au moins 1")
    .optional(),
  
  // Tarification
  isFree: z.boolean().optional(),
  price: z
    .number()
    .min(0, "Le prix ne peut pas être négatif")
    .optional(),
  priceDetails: z.string().optional(),
  currency: z.string().length(3, "Le code de devise doit contenir 3 caractères").optional(),
  
  // Médias
  coverImage: z
    .string()
    .optional()
    .refine((url) => {
      if (!url || url === "") return true;
      // Accepter les chemins relatifs commençant par /uploads/ ou les URLs complètes
      return url.startsWith("/uploads/") || z.string().url().safeParse(url).success;
    }, {
      message: "Format d'URL invalide"
    }),
  
  images: z.array(
    z.string().refine((url) => {
      if (!url || url === "") return true;
      // Accepter les chemins relatifs commençant par /uploads/ ou les URLs complètes
      return url.startsWith("/uploads/") || z.string().url().safeParse(url).success;
    }, {
      message: "Format d'URL invalide"
    })
  ).optional(),
  videos: z.array(
    z.string().refine((url) => !url || url === "" || z.string().url().safeParse(url).success, {
      message: "Format d'URL invalide"
    })
  ).optional(),
  
  // SEO
  metaTitle: z
    .string()
    .max(60, "Le titre SEO ne peut pas dépasser 60 caractères")
    .optional(),
  
  metaDescription: z
    .string()
    .max(160, "La description SEO ne peut pas dépasser 160 caractères")
    .optional(),
  
  ogImage: z
    .string()
    .optional()
    .refine((url) => {
      if (!url || url === "") return true;
      // Accepter les chemins relatifs commençant par /uploads/ ou les URLs complètes
      return url.startsWith("/uploads/") || z.string().url().safeParse(url).success;
    }, {
      message: "Format d'URL invalide"
    }),
  
  // Réseaux sociaux
  facebook: z
    .string()
    .optional()
    .refine((url) => !url || url === "" || z.string().url().safeParse(url).success, {
      message: "Format d'URL Facebook invalide"
    }),
  
  instagram: z
    .string()
    .optional()
    .refine((url) => !url || url === "" || z.string().url().safeParse(url).success, {
      message: "Format d'URL Instagram invalide"
    }),
  
  twitter: z
    .string()
    .optional()
    .refine((url) => !url || url === "" || z.string().url().safeParse(url).success, {
      message: "Format d'URL Twitter invalide"
    }),
  
  linkedin: z
    .string()
    .optional()
    .refine((url) => !url || url === "" || z.string().url().safeParse(url).success, {
      message: "Format d'URL LinkedIn invalide"
    }),
  
  tiktok: z
    .string()
    .optional()
    .refine((url) => !url || url === "" || z.string().url().safeParse(url).success, {
      message: "Format d'URL TikTok invalide"
    }),
  
  // Tags et catégories
  tags: z.array(z.string()).optional(),
  category: z.nativeEnum(EventCategory).optional(),
  
  // Récurrence
  isRecurring: z.boolean().optional(),
})
.refine((data) => {
  // Validation croisée des dates
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "La date de fin doit être après ou égale à la date de début",
  path: ["endDate"]
})
.refine((data) => {
  // Si payant, prix obligatoire
  if (data.isFree === false && !data.price) {
    return false;
  }
  return true;
}, {
  message: "Le prix est obligatoire pour un événement payant",
  path: ["price"]
});

// Schema pour la récurrence
export const recurrenceSchema = z.object({
  frequency: z.nativeEnum(RecurrenceFrequency),
  interval: z.number().int().min(1, "L'intervalle doit être d'au moins 1"),
  count: z.number().int().min(1).optional(),
  until: z.string().refine((date) => !date || !isNaN(Date.parse(date)), {
    message: "Date de fin de récurrence invalide"
  }).optional(),
  byWeekDay: z.array(z.number().int().min(1).max(7)).optional(),
  byMonthDay: z.array(z.number().int().min(1).max(31)).optional(),
  byMonth: z.array(z.number().int().min(1).max(12)).optional(),
  exceptions: z.array(z.string().refine((date) => !isNaN(Date.parse(date)))).optional(),
  workdaysOnly: z.boolean().optional()
})
.refine((data) => {
  // Au moins count OU until doit être défini
  return data.count !== undefined || data.until !== undefined;
}, {
  message: "Il faut définir soit un nombre d'occurrences, soit une date de fin"
})
.refine(() => {
  // Si count ET until sont définis, donner un avertissement
  // (pas d'erreur, mais privilégier count)
  return true; // Toujours valide, mais on privilégiera count dans le code
}, {
  message: "Si les deux sont définis, le nombre d'occurrences sera prioritaire"
});

// Schema complet avec récurrence
export const eventWithRecurrenceSchema = eventSchema.extend({
  recurrence: recurrenceSchema.optional()
}).refine((data) => {
  // Si l'événement est récurrent, la récurrence doit être définie
  if (data.isRecurring && !data.recurrence) {
    return false;
  }
  return true;
}, {
  message: "Les paramètres de récurrence sont obligatoires pour un événement récurrent",
  path: ["recurrence"]
});

// Schema pour la participation
export const participationSchema = z.object({
  eventId: z.string().cuid(),
  guestCount: z.number().int().min(0, "Le nombre d'invités ne peut pas être négatif").optional(),
  specialNeeds: z.string().optional(),
  notes: z.string().optional()
});

// Schema pour les filtres d'événements
export const eventFiltersSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date))).optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date))).optional(),
  category: z.nativeEnum(EventCategory).optional(),
  city: z.string().optional(),
  placeId: z.string().cuid().optional(),
  isFree: z.boolean().optional(),
  hasAvailableSpots: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional()
});

// Types TypeScript dérivés
export type EventFormData = z.infer<typeof eventSchema>;
export type RecurrenceData = z.infer<typeof recurrenceSchema>;
export type EventWithRecurrenceData = z.infer<typeof eventWithRecurrenceSchema>;
export type ParticipationData = z.infer<typeof participationSchema>;
export type EventFilters = z.infer<typeof eventFiltersSchema>;

// Fonction utilitaire pour valider les données d'événement
export function validateEventData(data: unknown): { 
  success: boolean; 
  data?: EventFormData; 
  errors?: z.ZodError["issues"]; 
} {
  const result = eventSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error.issues };
}

// Fonction utilitaire pour valider la récurrence
export function validateRecurrenceData(data: unknown): { 
  success: boolean; 
  data?: RecurrenceData; 
  errors?: z.ZodError["issues"]; 
} {
  const result = recurrenceSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error.issues };
}

// Constantes utiles
export const EVENT_CATEGORIES_LABELS: Record<EventCategory, string> = {
  [EventCategory.CONFERENCE]: "Conférence",
  [EventCategory.CONCERT]: "Concert",
  [EventCategory.FESTIVAL]: "Festival",
  [EventCategory.WORKSHOP]: "Atelier",
  [EventCategory.SEMINAR]: "Séminaire",
  [EventCategory.EXHIBITION]: "Exposition",
  [EventCategory.SPORT]: "Sport",
  [EventCategory.CULTURAL]: "Culturel",
  [EventCategory.SOCIAL]: "Social",
  [EventCategory.BUSINESS]: "Business",
  [EventCategory.EDUCATIONAL]: "Éducatif",
  [EventCategory.ENTERTAINMENT]: "Divertissement",
  [EventCategory.CHARITY]: "Caritatif",
  [EventCategory.RELIGIOUS]: "Religieux",
  [EventCategory.POLITICAL]: "Politique",
  [EventCategory.FAMILY]: "Famille",
  [EventCategory.FOOD]: "Gastronomie",
  [EventCategory.HEALTH]: "Santé",
  [EventCategory.TECHNOLOGY]: "Technologie",
  [EventCategory.ART]: "Art",
  [EventCategory.MUSIC]: "Musique",
  [EventCategory.THEATER]: "Théâtre",
  [EventCategory.CINEMA]: "Cinéma",
  [EventCategory.BOOK]: "Littérature",
  [EventCategory.NATURE]: "Nature",
  [EventCategory.TOURISM]: "Tourisme",
  [EventCategory.OTHER]: "Autre"
};

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  [RecurrenceFrequency.DAILY]: "Quotidienne",
  [RecurrenceFrequency.WEEKLY]: "Hebdomadaire",
  [RecurrenceFrequency.MONTHLY]: "Mensuelle",
  [RecurrenceFrequency.YEARLY]: "Annuelle"
};

// Ordre d'affichage des fréquences (quotidien en premier)
export const RECURRENCE_FREQUENCY_OPTIONS = [
  { value: RecurrenceFrequency.DAILY, label: "Quotidienne" },
  { value: RecurrenceFrequency.WEEKLY, label: "Hebdomadaire" },
  { value: RecurrenceFrequency.MONTHLY, label: "Mensuelle" },
  { value: RecurrenceFrequency.YEARLY, label: "Annuelle" }
] as const;