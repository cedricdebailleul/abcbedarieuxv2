// hooks/useGooglePlaces.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner"; // ou votre système de toast
import { useGoogleMapsLoader } from "./use-google-maps-loader";

type OpeningSlot = { openTime: string; closeTime: string };

// Type pour les données formatées de la Place
export interface FormattedPlaceData {
  // Identifiants Google
  googlePlaceId: string;
  googleBusinessData: google.maps.places.PlaceResult; // Données brutes pour backup

  // Informations de base
  name: string;
  type: string;
  category?: string;
  description?: string; // Description Google Business

  // Adresse
  street: string;
  streetNumber?: string;
  postalCode: string;
  city: string;
  formatted_address: string;

  // Coordonnées
  latitude: number;
  longitude: number;

  // Contact
  phone?: string;
  website?: string;
  email?: string; // À remplir manuellement

  // Horaires
  openingHours?: Array<{
    dayOfWeek: string; // "MONDAY"..."SUNDAY"
    isClosed: boolean;
    openTime?: string | null; // compat (non utilisé si slots[])
    closeTime?: string | null; // compat
    slots?: OpeningSlot[]; // ⇦ plusieurs créneaux par jour
  }>;

  // Médias
  photos?: string[];
  logo?: string;
  coverImage?: string; // Optionnel - à uploader manuellement

  // Métriques
  rating?: number;
  reviewCount?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;

  // SEO
  metaDescription?: string;

  // URL Google Maps
  googleMapsUrl?: string;
}

interface UseGooglePlacesOptions {
  defaultCountry?: string;
  language?: string;
  onPlaceSelected?: (place: FormattedPlaceData) => void;
  types?: string[]; // Types de lieux à rechercher
}

export const useGooglePlaces = ({
  defaultCountry = "FR",
  language = "fr",
  onPlaceSelected,
  types = ["establishment"], // Tous les établissements par défaut
}: UseGooglePlacesOptions) => {
  const [selectedPlace, setSelectedPlace] = useState<FormattedPlaceData | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [inputValue, setInputValue] = useState("");

  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  // Utiliser le loader centralisé
  const { isLoaded, loadError, google } = useGoogleMapsLoader();

  // Initialiser les services Google
  useEffect(() => {
    if (isLoaded && google) {
      autocompleteService.current =
        new google.maps.places.AutocompleteService();

      // Créer un élément div caché pour PlacesService
      if (!mapRef.current) {
        mapRef.current = document.createElement("div");
        document.body.appendChild(mapRef.current);
      }

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 43.6158, lng: 3.1303 }, // Bédarieux
        zoom: 8,
      });

      placesService.current = new google.maps.places.PlacesService(map);
    }

    return () => {
      if (mapRef.current?.parentNode) {
        mapRef.current.parentNode.removeChild(mapRef.current);
      }
    };
  }, [isLoaded, google]);

  // Mapper les types Google vers vos types
  const mapGoogleTypeToPlaceType = useCallback(
    (googleTypes: string[]): string => {
      const typeMapping: Record<string, string> = {
        restaurant: "RESTAURANT",
        cafe: "RESTAURANT",
        bar: "RESTAURANT",
        store: "COMMERCE",
        shopping_mall: "COMMERCE",
        doctor: "HEALTH",
        hospital: "HEALTH",
        pharmacy: "HEALTH",
        school: "EDUCATION",
        university: "EDUCATION",
        museum: "MUSEUM",
        park: "PARK",
        lodging: "ACCOMMODATION",
        hotel: "ACCOMMODATION",
        local_government_office: "ADMINISTRATION",
        post_office: "ADMINISTRATION",
        church: "TOURISM",
        tourist_attraction: "TOURISM",
      };

      for (const googleType of googleTypes) {
        if (typeMapping[googleType]) {
          return typeMapping[googleType];
        }
      }
      return "OTHER";
    },
    []
  );

  const DAYS = useMemo(
    () =>
      [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ] as const,
    []
  );
  const toHHMM = useCallback(
    (t?: string) =>
      t && t.length === 4 ? `${t.slice(0, 2)}:${t.slice(2)}` : t ?? "",
    []
  );

  /**
   * Construit des "slots" (matin/après-midi) par jour depuis Google periods.
   * - Gère plusieurs créneaux le même jour
   * - Gère les périodes qui passent minuit (split sur 2 jours)
   */
  const formatOpeningHours = useCallback(
    (
      periods?: Array<{
        open: { day: number; time: string };
        close?: { day: number; time: string };
      }>
    ): FormattedPlaceData["openingHours"] => {
      if (!periods || periods.length === 0) {
        // retourne 7 jours "fermés"
        return DAYS.map((d) => ({
          dayOfWeek: d,
          isClosed: true,
          openTime: null,
          closeTime: null,
          slots: [],
        }));
      }

      // Accumulateur par jour
      const byDay: Record<
        string,
        { slots: { openTime: string; closeTime: string }[] }
      > = {};

      const pushSlot = (dayIdx: number, open: string, close: string) => {
        const key = DAYS[dayIdx];
        (byDay[key] ||= { slots: [] }).slots.push({
          openTime: open,
          closeTime: close,
        });
      };

      for (const p of periods) {
        const oDay = p.open?.day ?? 0;
        const cDay = p.close?.day ?? oDay; // si close absent, on considère même jour (et on met 23:59)
        const o = toHHMM(p.open?.time) || "00:00";
        const c = toHHMM(p.close?.time) || "23:59";

        if (oDay === cDay) {
          // Période dans la même journée (classique : 09:00–12:00, 14:00–19:00)
          pushSlot(oDay, o, c);
        } else {
          // Période qui dépasse minuit (ex: 22:00–02:00)
          pushSlot(oDay, o, "23:59");
          pushSlot(cDay, "00:00", c);
        }
      }

      // Tri des créneaux par heure d’ouverture
      for (const k of Object.keys(byDay)) {
        byDay[k].slots.sort((a, b) => a.openTime.localeCompare(b.openTime));
      }

      // Construire les 7 jours, fermés si aucun slot
      return DAYS.map((d) => {
        const slots = byDay[d]?.slots ?? [];
        if (slots.length === 0) {
          return {
            dayOfWeek: d,
            isClosed: true,
            openTime: null,
            closeTime: null,
            slots: [],
          };
        }
        // Compat : on renseigne aussi openTime/closeTime sur le 1er slot
        return {
          dayOfWeek: d,
          isClosed: false,
          openTime: slots[0].openTime,
          closeTime: slots[slots.length - 1].closeTime,
          slots,
        };
      });
    },
    [DAYS, toHHMM]
  );

  // Extraire les composants d'adresse
  const extractAddressComponents = useCallback(
    (components: google.maps.GeocoderAddressComponent[]) => {
      const getComponent = (types: string[]): string | undefined => {
        const component = components.find((c) =>
          types.some((type) => c.types.includes(type))
        );
        return component?.long_name;
      };

      return {
        streetNumber: getComponent(["street_number"]),
        street: getComponent(["route"]) || "",
        postalCode: getComponent(["postal_code"]) || "",
        city: getComponent(["locality", "administrative_area_level_2"]) || "",
      };
    },
    []
  );

  // Rechercher des prédictions
  const searchPlaces = useCallback(
    (input: string) => {
      if (!autocompleteService.current || !input || input.length < 3) {
        setPredictions([]);
        return;
      }

      setIsSearching(true);

      // Construire la location bias uniquement si l'objet google est disponible
      let locationBias: google.maps.LatLng | undefined;
      if (google) {
        locationBias = new google.maps.LatLng(43.6158, 3.1303);
      }

      const request: google.maps.places.AutocompletionRequest = {
        input,
        componentRestrictions: { country: defaultCountry },
        language,
        // Bias vers Bédarieux si google chargé
        ...(locationBias ? { location: locationBias, radius: 50000 } : {}),
        // Google Places Autocomplete n'accepte qu'un seul type, pas un tableau
        ...(types && types.length > 0 ? { types: [types[0]] } : {}),
      };

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsSearching(false);

          // Utiliser window.google directement pour accéder aux constantes de status
          const g = typeof window !== "undefined" ? window.google : null;

          if (
            g &&
            status === g.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            console.log("✅ Prédictions reçues:", predictions.length);
            setPredictions(predictions);
          } else {
            setPredictions([]);
            if (
              !(g && status === g.maps.places.PlacesServiceStatus.ZERO_RESULTS)
            ) {
              console.error("❌ Erreur recherche Google Places:", status);
            } else {
              console.log("ℹ️ Aucun résultat pour cette recherche");
            }
          }
        }
      );
    },
    [defaultCountry, language, types, google]
  );

  // Récupérer les détails d'un lieu
  const getPlaceDetails = useCallback(
    (placeId: string) => {
      if (!placesService.current) {
        toast.error("Service Google Places non initialisé");
        return;
      }

      setIsSearching(true);

      const request = {
        placeId,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "formatted_phone_number",
          "website",
          "geometry",
          "address_components",
          "photos",
          "opening_hours",
          "rating",
          "user_ratings_total",
          "reviews",
          "types",
          "business_status",
          "url",
          "editorial_summary",
          "vicinity",
          "adr_address",
          "business_status",
        ],
        language,
      };

      placesService.current.getDetails(request, (place, status) => {
        setIsSearching(false);

        // Utiliser window.google directement pour accéder aux constantes de status
        const g = typeof window !== "undefined" ? window.google : null;
        if (g && status === g.maps.places.PlacesServiceStatus.OK && place) {
          const addressComponents = extractAddressComponents(
            place.address_components || []
          );

          // Importer les URLs des photos Google (même si elles sont cassées en aperçu)
          // L'important c'est d'avoir les URLs pour pouvoir les uploader sur notre serveur
          const photos = place.photos
            ?.slice(0, 10)
            .map((photo) => {
              const originalUrl = photo.getUrl({ maxWidth: 2400, maxHeight: 1600 });
              return originalUrl; // URL directe Google (sans proxy)
            }) || [];

          // Récupérer la description Google Business si disponible
          interface EditorialSummary {
            overview?: string;
          }
          const googleDescription = (
            place as { editorial_summary?: EditorialSummary }
          ).editorial_summary?.overview;

          // Alternative: utiliser le premier avis comme description si pas de description officielle
          const fallbackDescription =
            !googleDescription && place.reviews?.[0]?.text
              ? place.reviews[0].text.length > 50
                ? place.reviews[0].text
                : null
              : null;

          // Note: L'API Google Places standard ne fournit pas de description détaillée
          // La description doit être saisie manuellement dans le formulaire

          // Créer la description meta à partir de la description Google ou des avis
          const metaDescription =
            googleDescription?.substring(0, 160) ||
            place.reviews?.[0]?.text?.substring(0, 160) ||
            `${place.name} à ${addressComponents.city}. ${place.types
              ?.slice(0, 3)
              .join(", ")}`;

          const formattedData: FormattedPlaceData = {
            // Identifiants
            googlePlaceId: place.place_id || "",
            googleBusinessData: place, // Sauvegarder toutes les données brutes

            // Infos de base
            name: place.name || "",
            type: mapGoogleTypeToPlaceType(place.types || []),
            category: place.types?.[0],
            description: googleDescription || fallbackDescription || undefined, // Description Google Business ou premier avis

            // Adresse
            street: addressComponents.street,
            streetNumber: addressComponents.streetNumber,
            postalCode: addressComponents.postalCode,
            city: addressComponents.city,
            formatted_address: place.formatted_address || "",

            // Coordonnées
            latitude: place.geometry?.location?.lat() || 0,
            longitude: place.geometry?.location?.lng() || 0,

            // Contact
            phone: place.formatted_phone_number,
            website: place.website,

            // Horaires
            openingHours: formatOpeningHours(place.opening_hours?.periods),

            // Médias
            photos,
            // coverImage: Ne pas importer automatiquement - laisser l'utilisateur choisir

            // Métriques
            rating: place.rating,
            reviewCount: place.user_ratings_total,
            reviews: place.reviews
              ?.filter((review) => review.rating !== undefined)
              .map((review) => ({
                author_name: review.author_name,
                rating: review.rating ?? 0, // Provide a default value for undefined ratings
                text: review.text,
                time: review.time,
              })), // Toutes les reviews

            // SEO
            metaDescription,

            // URL Google Maps
            googleMapsUrl: place.url,
          };

          setSelectedPlace(formattedData);
          onPlaceSelected?.(formattedData);

          toast.success(`${place.name} importé avec succès`);
        } else {
          toast.error("Impossible de récupérer les détails du lieu");
          console.error("Erreur détails Google Places:", status);
        }
      });
    },
    [
      language,
      onPlaceSelected,
      extractAddressComponents,
      formatOpeningHours,
      mapGoogleTypeToPlaceType,
      google,
    ]
  );

  // Nettoyer les prédictions
  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setInputValue("");
  }, []);

  // Réinitialiser la sélection
  const clearSelection = useCallback(() => {
    setSelectedPlace(null);
    clearPredictions();
  }, [clearPredictions]);

  // Récupérer uniquement les horaires d'une place existante
  const fetchOpeningHours = useCallback(
    (googlePlaceId: string): Promise<FormattedPlaceData["openingHours"]> => {
      return new Promise((resolve, reject) => {
        if (!isLoaded || !google || !placesService.current) {
          reject(new Error("Google Maps pas encore chargé"));
          return;
        }

        const request = {
          placeId: googlePlaceId,
          fields: ["opening_hours"],
          language,
        };

        placesService.current.getDetails(request, (place, status) => {
          const g = typeof window !== "undefined" ? window.google : null;
          if (g && status === g.maps.places.PlacesServiceStatus.OK && place) {
            const hours = formatOpeningHours(place.opening_hours?.periods);
            resolve(hours);
          } else {
            reject(new Error("Impossible de récupérer les horaires depuis Google"));
          }
        });
      });
    },
    [isLoaded, google, formatOpeningHours, language]
  );

  // Géocoder une adresse pour obtenir les coordonnées
  const geocodeAddress = useCallback(
    (address: string): Promise<{ lat: number; lng: number }> => {
      return new Promise((resolve, reject) => {
        if (!isLoaded || !google) {
          reject(new Error("Google Maps pas encore chargé"));
          return;
        }

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          {
            address: address,
            region: defaultCountry,
          },
          (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
            if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
              const location = results[0].geometry.location;
              resolve({
                lat: location.lat(),
                lng: location.lng(),
              });
            } else {
              reject(new Error("Impossible de géocoder l'adresse"));
            }
          }
        );
      });
    },
    [isLoaded, google, defaultCountry]
  );

  return {
    // État
    isLoaded,
    loadError,
    isSearching,
    predictions,
    selectedPlace,
    inputValue,

    // Actions
    searchPlaces,
    getPlaceDetails,
    fetchOpeningHours,
    geocodeAddress,
    clearPredictions,
    clearSelection,
    setInputValue,

    // Utils
    mapRef,
  };
};
