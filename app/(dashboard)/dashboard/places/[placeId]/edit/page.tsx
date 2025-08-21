"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlaceForm } from "@/components/forms/place-form";
import { useSession } from "@/hooks/use-session";

interface Place {
  id: string;
  name: string;
  type: string;
  category?: string;
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
  googleBusinessData?: {
    openingHours?: { day: string; open: string; close: string }[];
    images?: string[];
  };
  status: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function EditPlacePage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState<string>("");

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setPlaceId(resolvedParams.placeId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!placeId) return;

    const fetchPlace = async () => {
      try {
        const response = await fetch(`/api/places/${placeId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Place non trouvée");
            return;
          }
          if (response.status === 403) {
            setError("Vous n'avez pas l'autorisation de modifier cette place");
            return;
          }
          throw new Error("Erreur lors du chargement");
        }

        const data = await response.json();
        setPlace(data.place);
      } catch (error: unknown) {
        console.error("Erreur:", error);
        if (error instanceof Error) {
          setError(error.message || "Erreur lors du chargement de la place");
        } else {
          setError("Erreur inconnue lors du chargement de la place");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlace();
  }, [placeId]);

  const handleSubmit = async (data: Partial<Place>) => {
    try {
      const response = await fetch(`/api/places/${placeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la modification");
      }

      const result = await response.json();

      // Si la place repasse en PENDING, informer l'utilisateur
      if (result.place.status === "PENDING" && place?.status === "ACTIVE") {
        toast.success(
          "Place mise à jour! Elle sera re-vérifiée par un administrateur."
        );
      } else {
        toast.success("Place mise à jour avec succès!");
      }

      // Rediriger vers la liste des places
      router.push("/dashboard/places");
    } catch (error: unknown) {
      console.error("Erreur:", error);
      if (error instanceof Error) {
        toast.error(
          error.message || "Erreur lors de la modification de la place"
        );
      } else {
        toast.error("Erreur inconnue lors de la modification de la place");
      }
      throw error; // Re-lancer pour que le PlaceForm gère l'état de loading
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
    name: place.name,
    type: place.type,
    category: place.category || "",
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
    // Images et logo
    logo: place.logo || "",
    coverImage: place.coverImage || "",
    // Images sauvegardées en base de données (priorité sur Google Business)
    images: parseImages(place.images) || place.googleBusinessData?.images || [],
    // Données Google Business
    openingHours:
      place.googleBusinessData?.openingHours?.map((hour) => ({
        dayOfWeek: hour.day,
        openTime: hour.open,
        closeTime: hour.close,
      })) || [],
  };

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
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
              place.status
            )}`}
          >
            {getStatusText(place.status)}
          </span>
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
