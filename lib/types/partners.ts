import { z } from "zod";

// ============================================================
//                    ENUMS ET CONSTANTES
// ============================================================

export const PARTNER_TYPES = [
  "COMMERCIAL",
  "INSTITUTIONAL",
  "MEDIA",
  "TECHNICAL",
  "SPONSOR",
  "SUPPLIER",
  "OTHER",
  "ASSOCIATIVE"
] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  COMMERCIAL: "Commercial",
  INSTITUTIONAL: "Institutionnel",
  MEDIA: "Média",
  TECHNICAL: "Technique",
  SPONSOR: "Sponsor",
  SUPPLIER: "Fournisseur",
  OTHER: "Autre",
  ASSOCIATIVE: "Associatif"
};

// ============================================================
//                    SCHEMAS ZOD
// ============================================================

export const PartnerCreateSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  slug: z
    .string()
    .min(1, "Le slug est requis")
    .regex(
      /^[a-z0-9-]+$/,
      "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets"
    ),
  description: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  partnerType: z.enum(PARTNER_TYPES),
  category: z.string().optional(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // Geolocation fields
  street: z.string().optional(),
  streetNumber: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  googlePlaceId: z.string().optional(),
  googleMapsUrl: z.string().optional(),
});

export const PartnerUpdateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").optional(),
  slug: z
    .string()
    .min(1, "Le slug est requis")
    .regex(
      /^[a-z0-9-]+$/,
      "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets"
    )
    .optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  partnerType: z.enum(PARTNER_TYPES).optional(),
  category: z.string().optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // Geolocation fields
  street: z.string().optional(),
  streetNumber: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  googlePlaceId: z.string().optional(),
  googleMapsUrl: z.string().optional(),
});

// ============================================================
//                    TYPES DERIVÉS
// ============================================================

export type PartnerCreateInput = z.infer<typeof PartnerCreateSchema>;
export type PartnerUpdateInput = z.infer<typeof PartnerUpdateSchema>;

// ============================================================
//                    TYPES POUR LES REQUÊTES
// ============================================================

export interface PartnerFilters {
  search?: string;
  type?: string;
  isActive?: string;
  featured?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PartnerWhereCondition {
  isActive?: boolean;
  partnerType?: PartnerType;
  isFeatured?: boolean;
  OR?: Array<{
    name?: { contains: string; mode: "insensitive" };
    description?: { contains: string; mode: "insensitive" };
    category?: { contains: string; mode: "insensitive" };
  }>;
  AND?:
    | Array<{
        OR: Array<{
          startDate?: null | { lte: Date };
        }>;
      }>
    | Array<{
        OR: Array<{
          endDate?: null | { gte: Date };
        }>;
      }>;
}

// ============================================================
//                    TYPES POUR LES RÉPONSES
// ============================================================

// Type flexible pour les partenaires (permet des champs optionnels pour compatibilité)
export interface Partner {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  partnerType: PartnerType | string; // Permet string pour les données de l'API
  category?: string | null;
  priority?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  // Geolocation fields
  street?: string | null;
  streetNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
  googleMapsUrl?: string | null;
}

// Type strict pour les partenaires complets (base de données)
export interface PartnerComplete {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  partnerType: PartnerType;
  category: string | null;
  priority: number;
  isActive: boolean;
  isFeatured: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  // Geolocation fields
  street: string | null;
  streetNumber: string | null;
  postalCode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string | null;
  googleMapsUrl: string | null;
}

// Alias pour la compatibilité ascendante
export type PartnerData = Partner;

export interface PartnerStats {
  total: number;
  featured: number;
  byType: Record<string, number>;
  active: number;
}

export interface PartnerListResponse {
  partners: PartnerData[]; // Utilise PartnerData[] pour représenter les enregistrements partiels provenant de la base
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  stats?: PartnerStats;
}

// ============================================================
//                    TYPES POUR LES FORMULAIRES
// ============================================================

export interface PartnerFormData {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  partnerType: PartnerType;
  category?: string;
  priority: number;
  isActive: boolean;
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  // Geolocation fields
  street?: string;
  streetNumber?: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  googleMapsUrl?: string;
}

// ============================================================
//                    HELPERS
// ============================================================

export function isValidPartnerType(type: string): type is PartnerType {
  return PARTNER_TYPES.includes(type as PartnerType);
}

export function sanitizePartnerData(
  data:
    | Partial<PartnerData>
    | Partial<PartnerFormData>
    | Record<string, unknown>
): PartnerFormData {
  const obj = data as Record<string, unknown>;

  const getString = (k: string): string => {
    const v = obj[k];
    return typeof v === "string" ? v : "";
  };

  const getNumber = (k: string): number => {
    const v = obj[k];
    return typeof v === "number" ? v : 0;
  };

  const getBoolean = (k: string, def: boolean): boolean => {
    const v = obj[k];
    return typeof v === "boolean" ? v : def;
  };

  const parseDateToIsoDay = (v: unknown): string => {
    if (typeof v === "string" && v)
      return new Date(v).toISOString().split("T")[0];
    if (v instanceof Date) return v.toISOString().split("T")[0];
    return "";
  };

  const partnerTypeValue =
    typeof obj["partnerType"] === "string" &&
    isValidPartnerType(obj["partnerType"] as string)
      ? (obj["partnerType"] as PartnerType)
      : "OTHER";

  const getNumberOpt = (k: string): number | undefined => {
    const v = obj[k];
    return typeof v === "number" ? v : undefined;
  };

  return {
    name: getString("name"),
    slug: getString("slug"),
    description: getString("description"),
    logo: getString("logo"),
    website: getString("website"),
    email: getString("email"),
    phone: getString("phone"),
    partnerType: partnerTypeValue,
    category: getString("category"),
    priority: getNumber("priority"),
    isActive: getBoolean("isActive", true),
    isFeatured: getBoolean("isFeatured", false),
    startDate: parseDateToIsoDay(obj["startDate"]),
    endDate: parseDateToIsoDay(obj["endDate"]),
    // Geolocation fields
    street: getString("street"),
    streetNumber: getString("streetNumber"),
    postalCode: getString("postalCode"),
    city: getString("city"),
    latitude: getNumberOpt("latitude"),
    longitude: getNumberOpt("longitude"),
    googlePlaceId: getString("googlePlaceId"),
    googleMapsUrl: getString("googleMapsUrl"),
  };
}

export function preparePartnerForDatabase(
  data: PartnerCreateInput | PartnerUpdateInput
) {
  return {
    ...data,
    website: data.website === "" ? null : data.website,
    email: data.email === "" ? null : data.email,
    phone: data.phone === "" ? null : data.phone,
    category: data.category === "" ? null : data.category,
    description: data.description === "" ? null : data.description,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    // Geolocation fields
    street: data.street === "" ? null : data.street,
    streetNumber: data.streetNumber === "" ? null : data.streetNumber,
    postalCode: data.postalCode === "" ? null : data.postalCode,
    city: data.city === "" ? null : data.city,
    googlePlaceId: data.googlePlaceId === "" ? null : data.googlePlaceId,
    googleMapsUrl: data.googleMapsUrl === "" ? null : data.googleMapsUrl,
  };
}
