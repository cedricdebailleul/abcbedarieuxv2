import { z } from "zod";

// Schéma pour les coordonnées géographiques
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// Schéma pour les résultats du géocodage
export const geocoderResultSchema = z.object({
  address_components: z.array(
    z.object({
      long_name: z.string(),
      short_name: z.string(),
      types: z.array(z.string()),
    })
  ),
  formatted_address: z.string(),
  geometry: z.object({
    location: coordinatesSchema,
    location_type: z.string(),
    viewport: z.object({
      northeast: coordinatesSchema,
      southwest: coordinatesSchema,
    }),
  }),
  place_id: z.string(),
  types: z.array(z.string()),
});

// Schéma pour la réponse du géocodeur
export const geocoderResponseSchema = z.object({
  results: z.array(geocoderResultSchema),
  status: z.enum([
    'OK',
    'ZERO_RESULTS', 
    'OVER_QUERY_LIMIT',
    'REQUEST_DENIED',
    'INVALID_REQUEST',
    'UNKNOWN_ERROR'
  ]),
});

// Schéma pour les paramètres de géocodage
export const geocodeRequestSchema = z.object({
  address: z.string().min(1, "L'adresse ne peut pas être vide"),
  region: z.string().optional(),
});

// Types inférés des schémas
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type GeocoderResult = z.infer<typeof geocoderResultSchema>;
export type GeocoderResponse = z.infer<typeof geocoderResponseSchema>;
export type GeocodeRequest = z.infer<typeof geocodeRequestSchema>;