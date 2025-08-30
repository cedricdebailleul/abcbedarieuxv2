import { z } from "zod";

/**
 * Schémas Zod pour les composants de carte et géolocalisation
 */

// Schéma pour les coordonnées
export const CoordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export type Coordinates = z.infer<typeof CoordinatesSchema>;

// Schéma pour les événements de carte interactive
export const MapEventSchema = z.object({
  type: z.string(),
  latlng: CoordinatesSchema.optional(),
  target: z.unknown().optional(),
});

export type MapEvent = z.infer<typeof MapEventSchema>;

// Schéma pour les paramètres de callback des coordonnées
export const CoordinatesCallbackSchema = z.any(); // Function type, simplified

export type CoordinatesCallback = z.infer<typeof CoordinatesCallbackSchema>;

// Schéma pour les instances de cartes
export const MapInstanceSchema = z.object({
  setView: z.any().optional(), // Function type, simplified
  panTo: z.any().optional(), // Function type, simplified
  getCenter: z.any().optional(), // Function type, simplified
  getZoom: z.any().optional(), // Function type, simplified
});

export type MapInstance = z.infer<typeof MapInstanceSchema>;

// Schéma pour les propriétés des composants de carte
export const MapComponentPropsSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  onCoordinatesChange: CoordinatesCallbackSchema.optional(),
  zoom: z.number().optional(),
  isReady: z.boolean().optional(),
});

export type MapComponentProps = z.infer<typeof MapComponentPropsSchema>;