// components/PlaceForm.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGooglePlaces,
  type FormattedPlaceData,
} from "@/hooks/use-google-places";
import { toast } from "sonner";

// Schéma de validation Zod
const placeSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  category: z.string().optional(),
  description: z.string().optional(),
  summary: z.string().max(280).optional(),

  // Adresse
  street: z.string().min(1, "La rue est requise"),
  streetNumber: z.string().optional(),
  postalCode: z.string().min(1, "Le code postal est requis"),
  city: z.string().min(1, "La ville est requise"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // Contact
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),

  // Réseaux sociaux
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  tiktok: z.string().optional(),

  // Google
  googlePlaceId: z.string().optional(),
  googleMapsUrl: z.string().optional(),

  // SEO
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});

type PlaceFormData = z.infer<typeof placeSchema>;

interface PlaceFormProps {
  initialData?: Partial<PlaceFormData>;
  onSubmit: (data: PlaceFormData) => Promise<void>;
  mode?: "create" | "edit";
}

export const PlaceForm: React.FC<PlaceFormProps> = ({
  initialData,
  onSubmit,
  mode = "create",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGoogleSearch, setShowGoogleSearch] = useState(mode === "create");
  const [openingHours, setOpeningHours] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PlaceFormData>({
    resolver: zodResolver(placeSchema),
    defaultValues: initialData || {},
  });

  // Hook Google Places
  const {
    isLoaded,
    isSearching,
    predictions,
    inputValue,
    searchPlaces,
    getPlaceDetails,
    setInputValue,
    clearPredictions,
  } = useGooglePlaces({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    onPlaceSelected: (place: FormattedPlaceData) => {
      // Remplir automatiquement tous les champs
      fillFormWithGoogleData(place);
    },
  });

  const [showDropdown, setShowDropdown] = useState(false);

  // Remplir le formulaire avec les données Google
  const fillFormWithGoogleData = (place: FormattedPlaceData) => {
    // Informations de base
    setValue("name", place.name);
    setValue("type", place.type);
    setValue("category", place.category || "");

    // Adresse
    setValue("street", place.street);
    setValue("streetNumber", place.streetNumber || "");
    setValue("postalCode", place.postalCode);
    setValue("city", place.city);
    setValue("latitude", place.latitude);
    setValue("longitude", place.longitude);

    // Contact
    setValue("phone", place.phone || "");
    setValue("website", place.website || "");

    // Google
    setValue("googlePlaceId", place.googlePlaceId);
    setValue("googleMapsUrl", place.googleMapsUrl || "");

    // SEO
    setValue("metaDescription", place.metaDescription || "");

    // Horaires et images
    setOpeningHours(place.openingHours || []);
    setImages(place.photos || []);

    // Masquer la recherche Google après import
    setShowGoogleSearch(false);

    toast.success("Les informations ont été importées depuis Google");
  };

  // Debounce pour la recherche
  useEffect(() => {
    if (!showGoogleSearch) return;

    const timer = setTimeout(() => {
      if (inputValue && inputValue.length >= 3) {
        searchPlaces(inputValue);
        setShowDropdown(true);
      } else {
        clearPredictions();
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, searchPlaces, clearPredictions, showGoogleSearch]);

  // Gérer la sélection d'une prédiction
  const handleSelectPrediction = (
    prediction: google.maps.places.AutocompletePrediction
  ) => {
    setInputValue(prediction.description);
    getPlaceDetails(prediction.place_id);
    setShowDropdown(false);
    clearPredictions();
  };

  // Soumettre le formulaire
  const onFormSubmit = async (data: PlaceFormData) => {
    setIsSubmitting(true);
    try {
      // Ajouter les horaires et images
      const fullData = {
        ...data,
        openingHours,
        images,
      };

      await onSubmit(fullData);
      toast.success(
        mode === "create" ? "Place créée avec succès" : "Place mise à jour"
      );

      if (mode === "create") {
        reset();
        setOpeningHours([]);
        setImages([]);
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Section Import Google */}
      {showGoogleSearch && isLoaded && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-900">
              Importer depuis Google Business
            </h3>
            <button
              type="button"
              onClick={() => setShowGoogleSearch(false)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Remplir manuellement
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Rechercher par nom ou adresse..."
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="animate-spin h-5 w-5 text-blue-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            )}

            {/* Dropdown des résultats */}
            {showDropdown && predictions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-60 overflow-auto">
                {predictions.map(
                  (prediction: google.maps.places.AutocompletePrediction) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onClick={() => handleSelectPrediction(prediction)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start space-x-3"
                    >
                      <svg
                        className="w-5 h-5 text-gray-400 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div>
                        <div className="font-medium">
                          {prediction.structured_formatting.main_text}
                        </div>
                        <div className="text-sm text-gray-500">
                          {prediction.structured_formatting.secondary_text}
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Si on a masqué la recherche, bouton pour la réafficher */}
      {!showGoogleSearch && mode === "edit" && (
        <button
          type="button"
          onClick={() => setShowGoogleSearch(true)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ↻ Réimporter depuis Google
        </button>
      )}

      {/* Informations de base */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nom de l'établissement *
          </label>
          <input
            {...register("name")}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type *</label>
          <select
            {...register("type")}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner...</option>
            <option value="COMMERCE">Commerce</option>
            <option value="SERVICE">Service</option>
            <option value="RESTAURANT">Restaurant</option>
            <option value="ARTISAN">Artisan</option>
            <option value="ADMINISTRATION">Administration</option>
            <option value="MUSEUM">Musée</option>
            <option value="TOURISM">Tourisme</option>
            <option value="PARK">Parc</option>
            <option value="LEISURE">Loisirs</option>
            <option value="ASSOCIATION">Association</option>
            <option value="HEALTH">Santé</option>
            <option value="EDUCATION">Éducation</option>
            <option value="TRANSPORT">Transport</option>
            <option value="ACCOMMODATION">Hébergement</option>
            <option value="OTHER">Autre</option>
          </select>
          {errors.type && (
            <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          {...register("description")}
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Décrivez votre établissement..."
        />
      </div>

      {/* Adresse */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Adresse</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">N°</label>
            <input
              {...register("streetNumber")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Rue *</label>
            <input
              {...register("street")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.street && (
              <p className="text-red-500 text-sm mt-1">
                {errors.street.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Code postal *
            </label>
            <input
              {...register("postalCode")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.postalCode && (
              <p className="text-red-500 text-sm mt-1">
                {errors.postalCode.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ville *</label>
            <input
              {...register("city")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
            )}
          </div>
        </div>

        {/* Coordonnées GPS (readonly si importé de Google) */}
        {(watch("latitude") || watch("longitude")) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Latitude
              </label>
              <input
                {...register("latitude", { valueAsNumber: true })}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Longitude
              </label>
              <input
                {...register("longitude", { valueAsNumber: true })}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Contact</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input
              {...register("phone")}
              type="tel"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Site web</label>
          <input
            {...register("website")}
            type="url"
            placeholder="https://"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {errors.website && (
            <p className="text-red-500 text-sm mt-1">
              {errors.website.message}
            </p>
          )}
        </div>
      </div>

      {/* Réseaux sociaux */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Réseaux sociaux</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Facebook</label>
            <input
              {...register("facebook")}
              placeholder="https://facebook.com/..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Instagram</label>
            <input
              {...register("instagram")}
              placeholder="@username"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Twitter</label>
            <input
              {...register("twitter")}
              placeholder="@username"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">LinkedIn</label>
            <input
              {...register("linkedin")}
              placeholder="https://linkedin.com/..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Horaires d'ouverture (si importés de Google) */}
      {openingHours.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Horaires d'ouverture</h3>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              {openingHours.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <span className="font-medium">
                    {day.dayOfWeek === "MONDAY" && "Lundi"}
                    {day.dayOfWeek === "TUESDAY" && "Mardi"}
                    {day.dayOfWeek === "WEDNESDAY" && "Mercredi"}
                    {day.dayOfWeek === "THURSDAY" && "Jeudi"}
                    {day.dayOfWeek === "FRIDAY" && "Vendredi"}
                    {day.dayOfWeek === "SATURDAY" && "Samedi"}
                    {day.dayOfWeek === "SUNDAY" && "Dimanche"}
                  </span>
                  <span className={day.isClosed ? "text-gray-500" : ""}>
                    {day.isClosed
                      ? "Fermé"
                      : `${day.openTime} - ${day.closeTime}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Images importées */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Photos importées de Google</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.slice(0, 8).map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={image}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImages(images.filter((_, i) => i !== index))
                  }
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">SEO & Partage social</h3>

        <div>
          <label className="block text-sm font-medium mb-1">
            Titre SEO
            <span className="text-gray-500 text-xs ml-2">
              ({watch("metaTitle")?.length || 0}/60)
            </span>
          </label>
          <input
            {...register("metaTitle")}
            maxLength={60}
            placeholder="Titre pour les moteurs de recherche"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description SEO
            <span className="text-gray-500 text-xs ml-2">
              ({watch("metaDescription")?.length || 0}/160)
            </span>
          </label>
          <textarea
            {...register("metaDescription")}
            maxLength={160}
            rows={3}
            placeholder="Description pour les moteurs de recherche et réseaux sociaux"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Résumé pour partage
            <span className="text-gray-500 text-xs ml-2">
              ({watch("summary")?.length || 0}/280)
            </span>
          </label>
          <textarea
            {...register("summary")}
            maxLength={280}
            rows={3}
            placeholder="Résumé court pour Twitter et partages rapides"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Google Place ID (readonly) */}
      {watch("googlePlaceId") && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-green-800 font-medium">
              Connecté à Google Business
            </span>
          </div>
          <div className="mt-2 text-sm text-green-700">
            ID: {watch("googlePlaceId")}
          </div>
          {watch("googleMapsUrl") && (
            <a
              href={watch("googleMapsUrl")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 text-sm underline mt-1 inline-block"
            >
              Voir sur Google Maps →
            </a>
          )}
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          <span>{mode === "create" ? "Créer la place" : "Mettre à jour"}</span>
        </button>
      </div>
    </form>
  );
};
