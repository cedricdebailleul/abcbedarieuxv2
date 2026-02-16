"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlaceForm } from "@/components/forms/place-form";
import { useSession } from "@/hooks/use-session";
import { filterGooglePhotosUrls } from "@/lib/image-utils";
import { OpeningHour, PlaceData } from "@/lib/schemas/common";

interface Place {
  id: string;
  name: string;
  type: string;
  category?: string;
  categories?: Array<{ 
    category: { id: string; name: string; slug: string; color?: string | null; parentId?: string | null }
  }>;
  description?: string;
  summary?: string;
  street: string;
  streetNumber?: string;
  postalCode: string;
  city: string;
  latitude?: number;
  longitude?: number;
  email?: string;
  phone?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  logo?: string;
  coverImage?: string;
  images?: string[] | string; // JSON field contenant les images sauvegardées
  openingHours?: Array<{
    dayOfWeek: string;
    isClosed: boolean;
    openTime: string | null;
    closeTime: string | null;
  }>;
  googleBusinessData?: {
    openingHours?: { day: string; open: string; close: string }[];
    images?: string[];
  };
  status: string;
  ownerId?: string | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

type PlaceFormData = Omit<Partial<Place>, "openingHours" | "categories"> & {
  categories?: string[]; // Array of category IDs for the form
  openingHours?: Array<{
    dayOfWeek?: string;
    day?: string;
    isClosed?: boolean | string | number;
    openTime?: string | null;
    closeTime?: string | null;
    slots?: Array<{ openTime?: string | null; closeTime?: string | null }>;
  }>;
};

type OpeningHourForm = NonNullable<PlaceFormData["openingHours"]>[number];

export default function EditPlacePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const placeId = useParams().placeId;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [makingClaimable, setMakingClaimable] = useState(false);

  useEffect(() => {
    if (!placeId) return;
    (async () => {
      try {
        const res = await fetch(`/api/places/${placeId}`);
        if (!res.ok) {
          if (res.status === 404) return setError("Place non trouvée");
          if (res.status === 403) return setError("Accès non autorisé");
          throw new Error("Erreur lors du chargement");
        }
        const data = await res.json();
        console.log("EditPage - API Response:", data);
        setPlace(data.place as Place);
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : String(e) || "Erreur inconnue"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [placeId]);
  const handleSubmit = async (data: PlaceFormData) => {
    if (!placeId) {
      toast.error("ID de la place manquant.");
      return;
    }

    // Normalize incoming form data to match the Place type expected by the API.
    // Handle both old format (openTime/closeTime) and new format (slots)
    
    // Filtrer les images pour ne garder que celles déjà uploadées (qui commencent par /uploads/)
    // Les URLs Google sont laissées dans le state du formulaire mais pas envoyées à l'API
    const filteredImages = Array.isArray(data.images) 
      ? data.images.filter(img => 
          typeof img === 'string' && 
          (img.startsWith('/uploads/') || img.startsWith('data:') || !img.includes('googleusercontent.com'))
        )
      : [];

    console.log("Original images:", data.images);
    console.log("Filtered images:", filteredImages);
    console.log("EditPage - data.type before normalization:", data.type);
    
    const normalized = {
      ...data,
      // Ne pas envoyer les URLs Google à l'API - seulement les images déjà uploadées
      images: filteredImages,
      openingHours: Array.isArray(data?.openingHours)
        ? data.openingHours.map((h: OpeningHourForm) => {
            console.log("Normalizing opening hour:", h);
            
            // New format with slots
            if (h.slots && Array.isArray(h.slots)) {
              return {
                dayOfWeek: h.dayOfWeek ?? h.day ?? "",
                isClosed: Boolean(h.isClosed),
                slots: h.slots.map(slot => ({
                  openTime: slot.openTime,
                  closeTime: slot.closeTime,
                })),
              };
            }
            
            // Old format fallback
            return {
              dayOfWeek: h.dayOfWeek ?? h.day ?? "",
              isClosed: Boolean(h.isClosed),
              openTime: h.openTime ?? null,
              closeTime: h.closeTime ?? null,
            };
          })
        : undefined,
    } as Partial<Place>;
    
    console.log("Normalized data with openingHours:", normalized);
    console.log("EditPage - normalized.type:", normalized.type);

    try {
      const res = await fetch(`/api/places/${placeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de la modification");
      }
      const result = await res.json();
      if (result.place?.status === "PENDING" && place?.status === "ACTIVE") {
        toast.success("Place mise à jour! Elle sera re-validée par un admin.");
      } else {
        toast.success("Place mise à jour avec succès!");
      }
      router.push("/dashboard/places");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Erreur lors de la modification";
      toast.error(errorMessage);
      throw e instanceof Error ? e : new Error(errorMessage); // pour que PlaceForm stoppe son spinner si besoin
    }
  };

  const handleMakeClaimable = async () => {
    if (!placeId || !place) return;

    if (!confirm(`Êtes-vous sûr de vouloir mettre "${place.name}" en revendiquer ? Cette action retirera votre propriété de la place et permettra à d'autres utilisateurs de la revendiquer.`)) {
      return;
    }

    setMakingClaimable(true);
    try {
      const response = await fetch(`/api/places/${placeId}/make-claimable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur API make-claimable:", errorData);
        throw new Error(errorData.details || errorData.error || "Erreur lors de la mise à disposition");
      }

      toast.success("Place mise à disposition pour revendication avec succès!");
      router.push("/dashboard/places");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setMakingClaimable(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 text-red-300 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          role="img"
          aria-label="Icône d'erreur"
        >
          <title>Erreur de chargement</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => router.push("/dashboard/places")}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour à mes places
        </button>
      </div>
    );
  }

  if (!place) {
    return null;
  }

  // Fonction helper pour parser les images
  const parseImages = (images: unknown): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    try {
      if (typeof images === "string") {
        return JSON.parse(images);
      }
      return [];
    } catch {
      return [];
    }
  };

  // Préparer les données initiales pour le formulaire
  const initialData = {
    id: place.id, // Ajout de l'ID pour l'import des avis
    ownerId: place.ownerId ?? place.owner?.id ?? null, // Pour le switch "peut être revendiquée"
    name: place.name,
    type: place.type || "COMMERCE", // Défaut COMMERCE si vide
    category: place.category || "",
    categories: place.categories ? place.categories.map(cat => cat.category.id) : [],
    description: place.description || "",
    summary: place.summary || "",
    street: place.street,
    streetNumber: place.streetNumber || "",
    postalCode: place.postalCode,
    city: place.city,
    latitude: place.latitude,
    longitude: place.longitude,
    email: place.email || "",
    phone: place.phone || "",
    website: place.website || "",
    facebook: place.facebook || "",
    instagram: place.instagram || "",
    twitter: place.twitter || "",
    linkedin: place.linkedin || "",
    tiktok: place.tiktok || "",
    googlePlaceId: place.googlePlaceId || "",
    googleMapsUrl: place.googleMapsUrl || "",
    metaTitle: place.metaTitle || "",
    metaDescription: place.metaDescription || "",
    // Images et logo (nettoyées des URLs Google problématiques)
    logo: place.logo ? (place.logo.includes('maps.googleapis.com') ? "" : place.logo) : "",
    coverImage: place.coverImage ? (place.coverImage.includes('maps.googleapis.com') ? "" : place.coverImage) : "",
    // Images sauvegardées en base de données (filtrées et dédupliquées)
    images: (() => {
      const placeImages = parseImages(place.images);

      console.log("EditPage - Raw place.images:", place.images);
      console.log("EditPage - Parsed place images:", placeImages);

      // En mode édition, on affiche UNIQUEMENT les images sauvegardées en base
      // (les images Google ne sont plus réinjectées automatiquement)
      const filteredImages = filterGooglePhotosUrls(placeImages);
      console.log("EditPage - Final filtered images:", filteredImages);

      return filteredImages;
    })(),
    // Données Google Business ou horaires existantes
    openingHours:
      place.openingHours && place.openingHours.length > 0
        ? place.openingHours.map((hour: OpeningHour) => {
            console.log("EditPage - Processing hour from DB:", hour);
            
            // Si l'horaire a déjà des slots, les utiliser
            if (hour.slots && Array.isArray(hour.slots) && hour.slots.length > 0) {
              return {
                dayOfWeek: hour.dayOfWeek,
                isClosed: hour.isClosed,
                openTime: hour.openTime, // pour compatibilité
                closeTime: hour.closeTime, // pour compatibilité
                slots: hour.slots, // utiliser les slots existants
              };
            }
            
            // Sinon, créer un slot depuis openTime/closeTime seulement s'ils existent
            const slots = hour.openTime && hour.closeTime
              ? [{ openTime: hour.openTime, closeTime: hour.closeTime }]
              : [];
              
            return {
              dayOfWeek: hour.dayOfWeek,
              isClosed: hour.isClosed,
              openTime: hour.openTime,
              closeTime: hour.closeTime,
              slots: slots,
            };
          })
        : place.googleBusinessData?.openingHours?.map((hour) => ({
            dayOfWeek: hour.day,
            openTime: hour.open,
            closeTime: hour.close,
            slots: hour.open && hour.close ? [{ openTime: hour.open, closeTime: hour.close }] : [],
          })) || [],
    // Champs de publication
    published: place.status === "ACTIVE", // true si la place est active
    isFeatured: (place as PlaceData).isFeatured || false, // préserver la valeur existante
  };

  console.log("EditPage - initialData prepared for form:", initialData);

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Actif";
      case "PENDING":
        return "En attente de validation";
      case "DRAFT":
        return "Brouillon";
      case "INACTIVE":
        return "Inactif";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-700 bg-green-100";
      case "PENDING":
        return "text-yellow-700 bg-yellow-100";
      case "DRAFT":
        return "text-gray-700 bg-gray-100";
      case "INACTIVE":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Modifier la place
            </h1>
            <p className="text-gray-600 mt-2">
              Modifiez les informations de votre établissement
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                place.status
              )}`}
            >
              {getStatusText(place.status)}
            </span>
            
            {/* Bouton "Mettre en revendiquer" pour les admins */}
            {session?.user?.role === "admin" && place.owner?.id === session.user.id && (
              <button
                onClick={handleMakeClaimable}
                disabled={makingClaimable}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:text-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {makingClaimable ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
                    Mise à disposition...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Mettre en revendiquer
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Avertissement si modification d'une place active */}
      {place.status === "ACTIVE" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-6 h-6 text-yellow-600 mr-3 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-yellow-900 font-medium">Attention</h3>
              <p className="text-yellow-800 text-sm mt-1">
                Cette place est actuellement active. Toute modification
                nécessitera une nouvelle validation par un administrateur et la
                place repassera temporairement en attente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <PlaceForm
          mode="edit"
          initialData={initialData}
          onSubmit={handleSubmit}
          userRole={session?.user?.role || "user"}
        />
      </div>
    </div>
  );
}
