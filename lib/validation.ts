import { z } from "zod";

// Schéma pour la validation des emails
export const emailSchema = z.string()
  .email("Format d'email invalide")
  .max(254, "Email trop long")
  .toLowerCase()
  .trim();

// Schéma pour les noms
export const nameSchema = z.string()
  .max(100, "Nom trop long")
  .regex(/^[a-zA-ZÀ-ÿ\s\-']*$/, "Caractères invalides dans le nom")
  .trim()
  .optional();

// Schémas pour les campagnes newsletter
export const campaignTypeSchema = z.enum([
  "NEWSLETTER", 
  "ANNOUNCEMENT", 
  "EVENT_DIGEST", 
  "PLACE_UPDATE", 
  "PROMOTIONAL"
]);

export const campaignStatusSchema = z.enum([
  "DRAFT",
  "SCHEDULED", 
  "SENDING",
  "SENT",
  "CANCELLED",
  "ERROR"
]);

// Schéma pour la création de campagne
export const createCampaignSchema = z.object({
  title: z.string()
    .min(1, "Le titre est requis")
    .max(200, "Titre trop long")
    .trim(),
  
  subject: z.string()
    .min(1, "Le sujet est requis")
    .max(255, "Sujet trop long")
    .regex(/^[^<>\r\n]*$/, "Caractères non autorisés dans le sujet")
    .trim(),
    
  content: z.string()
    .min(1, "Le contenu est requis")
    .max(50000, "Contenu trop long")
    .trim(),
    
  type: campaignTypeSchema,
  
  scheduledAt: z.string()
    .datetime("Date/heure invalide")
    .optional(),
    
  eventIds: z.array(z.string().cuid()).max(50, "Trop d'événements sélectionnés").optional(),
  placeIds: z.array(z.string().cuid()).max(50, "Trop de commerces sélectionnés").optional(),
  postIds: z.array(z.string().cuid()).max(50, "Trop d'articles sélectionnés").optional(),
  attachmentIds: z.array(z.string().cuid()).max(10, "Trop de pièces jointes").optional()
});

// Schéma pour la mise à jour de campagne
export const updateCampaignSchema = createCampaignSchema.partial();

// Schéma pour la souscription newsletter
export const subscribeSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  preferences: z.record(z.boolean()).optional(),
  source: z.string().max(50).optional().default("website")
});

// Schéma pour la désinscription
export const unsubscribeSchema = z.object({
  email: emailSchema.optional(),
  token: z.string().min(1, "Token requis").optional()
}).refine(data => data.email || data.token, {
  message: "Email ou token requis"
});

// Schéma pour la vérification email
export const verifyEmailSchema = z.object({
  token: z.string()
    .min(1, "Token requis")
    .max(255, "Token invalide")
    .regex(/^[a-zA-Z0-9]+$/, "Format de token invalide")
});

// Schéma pour les paramètres de tracking
export const trackingParamsSchema = z.object({
  c: z.string().cuid("ID de campagne invalide"),
  s: z.string().cuid("ID d'abonné invalide"),
  t: z.string().optional() // token optionnel
});

// Schéma pour les paramètres de clic tracking
export const clickTrackingSchema = trackingParamsSchema.extend({
  url: z.string()
    .url("URL invalide")
    .max(2048, "URL trop longue")
});

// Schéma pour la suppression en masse
export const bulkDeleteSchema = z.object({
  campaignIds: z.array(z.string().cuid())
    .min(1, "Au moins une campagne doit être sélectionnée")
    .max(100, "Trop de campagnes sélectionnées"),
  force: z.boolean().default(false)
});

// Schéma pour les fichiers uploadés
export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, "Nom de fichier requis")
    .max(255, "Nom de fichier trop long")
    .regex(/^[^<>:"/\\|?*]+\.[a-zA-Z0-9]+$/, "Nom de fichier invalide"),
  
  size: z.number()
    .positive("Taille de fichier invalide")
    .max(10 * 1024 * 1024, "Fichier trop volumineux (max 10MB)"),
    
  type: z.string()
    .regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, "Type MIME invalide")
    .refine(type => [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(type), "Type de fichier non autorisé")
});

// Fonction helper pour valider et nettoyer les données
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');
    throw new Error(`Validation failed: ${errors}`);
  }
  
  return result.data;
}

// Types TypeScript générés à partir des schémas
export type CreateCampaignData = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignData = z.infer<typeof updateCampaignSchema>;
export type SubscribeData = z.infer<typeof subscribeSchema>;
export type UnsubscribeData = z.infer<typeof unsubscribeSchema>;
export type TrackingParams = z.infer<typeof trackingParamsSchema>;
export type ClickTrackingParams = z.infer<typeof clickTrackingSchema>;
export type BulkDeleteData = z.infer<typeof bulkDeleteSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;