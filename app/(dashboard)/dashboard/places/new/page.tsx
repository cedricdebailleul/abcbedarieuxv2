"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlaceForm } from "@/components/forms/place-form";
import { generateSlug } from "@/lib/validations/post";

const ALLOWED_TYPES = new Set([
  "COMMERCE",
  "SERVICE",
  "RESTAURANT",
  "ARTISAN",
  "ADMINISTRATION",
  "MUSEUM",
  "TOURISM",
  "PARK",
  "LEISURE",
  "ASSOCIATION",
  "HEALTH",
  "EDUCATION",
  "TRANSPORT",
  "ACCOMMODATION",
  "OTHER",
]);

type PlaceFormData = {
  name?: string;
  type?: string;
  description?: string | null;
  summary?: string | null;

  street?: string | null;
  streetNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  logo?: string | null;
  coverImage?: string | null;
  images?: string[];

  email?: string | null;
  phone?: string | null;
  website?: string | null;

  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  tiktok?: string | null;

  googlePlaceId?: string | null;
  googleMapsUrl?: string | null;

  metaTitle?: string | null;
  metaDescription?: string | null;
};

export default function NewPlacePage() {
  const router = useRouter();

  const handleSubmit = async (data: PlaceFormData) => {
    // ➜ plus de throw "Champs requis manquants" ici : zod gère déjà côté form

    // slug obligatoire pour l’API
    const slug = generateSlug(String(data.name || ""));
    // type normalisé vers l’enum Prisma (fallback sur OTHER)
    const typeRaw = String(data.type || "").toUpperCase();
    const type = ALLOWED_TYPES.has(typeRaw) ? typeRaw : "OTHER";

    const payload = {
      name: String(data.name || "").trim(),
      slug,
      type,
      description: data.description || null,
      summary: data.summary || null,

      // Adresse
      street: data.street,
      streetNumber: data.streetNumber || null,
      postalCode: data.postalCode,
      city: data.city,
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,

      // Médias (le PlaceForm te transmet bien `images`)
      logo: data.logo || null,
      coverImage: data.coverImage || null,
      images: Array.isArray(data.images) ? data.images : [],

      // Contact
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,

      // Réseaux
      facebook: data.facebook || null,
      instagram: data.instagram || null,
      twitter: data.twitter || null,
      linkedin: data.linkedin || null,
      tiktok: data.tiktok || null,

      // Google
      googlePlaceId: data.googlePlaceId || null,
      googleMapsUrl: data.googleMapsUrl || null,

      // SEO
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
    };

    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json();

          if (!res.ok) {
      // ✅ Meilleur message d'erreur
      if (out?.error?.includes("slug")) {
        toast.error("Ce slug existe déjà. Veuillez en choisir un autre.");
      } else {
        toast.error(out?.error || "Erreur lors de la création");
      }
      return; // ← Ajouter return pour ne pas continuer
    }

      toast.success("Place créée avec succès !");
      router.push("/dashboard/places");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la création";
      toast.error(errorMessage);
      throw err;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Créer une nouvelle place
        </h1>
        <p className="text-gray-600 mt-2">
          Ajoutez votre établissement au répertoire local. Votre place sera
          vérifiée par un administrateur avant publication.
        </p>
      </div>

      {/* Informations importantes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg
            className="w-6 h-6 text-blue-600 mr-3 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            role="img"
            aria-label="Lieu / Adresse"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-blue-900 font-medium">À savoir</h3>
            <ul className="text-blue-800 text-sm mt-2 space-y-1">
              <li>
                • Votre place sera en attente de validation après création
              </li>
              <li>• Vous recevrez un email une fois la validation effectuée</li>
              <li>
                • Utilisez la recherche Google pour importer automatiquement les
                informations
              </li>
              <li>• Tous les champs marqués d&apos;un * sont obligatoires</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <PlaceForm mode="create" onSubmit={handleSubmit} userRole="user" />
      </div>
    </div>
  );
}
