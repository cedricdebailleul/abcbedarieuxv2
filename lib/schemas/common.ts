import { z } from "zod";
import { Role } from "@/lib/generated/prisma";

/**
 * Schémas Zod communs pour remplacer les types 'any'
 */

// Schéma pour les coordonnées géographiques
export const CoordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export type Coordinates = z.infer<typeof CoordinatesSchema>;

// Schéma pour les données de formulaire génériques
export const FormDataSchema = z.record(z.string(), z.unknown());

export type FormData = z.infer<typeof FormDataSchema>;

// Schéma pour les paramètres d'URL
export const UrlParamsSchema = z.record(z.string(), z.string().optional());

export type UrlParams = z.infer<typeof UrlParamsSchema>;

// Schéma pour les données de session utilisateur étendues
export const ExtendedUserDataSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.nativeEnum(Role).optional(),
  image: z.string().nullable().optional(),
  emailVerified: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ExtendedUserData = z.infer<typeof ExtendedUserDataSchema>;

// Schéma pour les réponses API génériques
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

// Schéma pour les événements de callback
export const CallbackEventSchema = z.object({
  type: z.string(),
  data: z.unknown().optional(),
  timestamp: z.number().optional(),
});

export type CallbackEvent = z.infer<typeof CallbackEventSchema>;

// Schéma pour les données d'upload d'images
export const ImageUploadDataSchema = z.object({
  file: z.unknown(), // File object
  url: z.string().url().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

export type ImageUploadData = z.infer<typeof ImageUploadDataSchema>;

// Schéma pour les paramètres de hooks React
export const ReactHookParamsSchema = z.object({
  dependencies: z.array(z.unknown()).optional(),
  callback: z.any().optional(), // Function type, simplified
});

export type ReactHookParams = z.infer<typeof ReactHookParamsSchema>;

// Schéma pour les données de géolocalisation
export const GeolocationDataSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  altitude: z.number().nullable().optional(),
  altitudeAccuracy: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
});

export type GeolocationData = z.infer<typeof GeolocationDataSchema>;

// Schéma pour les événements du navigateur
export const BrowserEventSchema = z.object({
  type: z.string(),
  target: z.unknown().optional(),
  data: z.unknown().optional(),
});

export type BrowserEvent = z.infer<typeof BrowserEventSchema>;

// Schéma pour les créneaux d'horaires
export const TimeSlotSchema = z.object({
  openTime: z.string().nullable(),
  closeTime: z.string().nullable(),
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

// Schéma pour les horaires d'ouverture
export const OpeningHourSchema = z.object({
  dayOfWeek: z.string(),
  isClosed: z.boolean(),
  openTime: z.string().nullable().optional(),
  closeTime: z.string().nullable().optional(),
  slots: z.array(TimeSlotSchema).optional(),
});

export type OpeningHour = z.infer<typeof OpeningHourSchema>;

// Schéma pour les données de lieux/places avec isFeatured
export const PlaceDataSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  isFeatured: z.boolean().optional(),
  published: z.boolean().optional(),
  status: z.string().optional(),
});

export type PlaceData = z.infer<typeof PlaceDataSchema>;

// Schéma pour les données de mise à jour d'inscriptions
export const RegistrationUpdateDataSchema = z.record(z.string(), z.unknown());

export type RegistrationUpdateData = z.infer<typeof RegistrationUpdateDataSchema>;

// Schéma pour les horaires d'ouverture depuis la base de données
export const DatabaseOpeningHourSchema = z.object({
  dayOfWeek: z.string(),
  isClosed: z.boolean(),
  openTime: z.string().nullable().optional(),
  closeTime: z.string().nullable().optional(),
  slots: z.array(TimeSlotSchema).optional(),
});

export type DatabaseOpeningHour = z.infer<typeof DatabaseOpeningHourSchema>;

// Schéma pour les horaires groupés par jour
export const GroupedOpeningHoursSchema = z.record(z.string(), z.array(DatabaseOpeningHourSchema));

export type GroupedOpeningHours = z.infer<typeof GroupedOpeningHoursSchema>;