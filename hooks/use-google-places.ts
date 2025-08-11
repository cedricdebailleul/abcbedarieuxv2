// hooks/useGooglePlaces.ts
import { useState, useCallback, useRef, useEffect } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { toast } from "sonner"; // ou votre système de toast

// Types pour Google Places
interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  photos?: Array<{
    getUrl: (opts: { maxWidth: number; maxHeight: number }) => string;
  }>;
  opening_hours?: {
    weekday_text: string[];
    periods: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
  };
  rating?: number;
  user_ratings_total?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  types?: string[];
  business_status?: string;
  url?: string; // URL Google Maps
}

// Type pour les données formatées de la Place
export interface FormattedPlaceData {
  // Identifiants Google
  googlePlaceId: string;
  googleBusinessData: any; // Données brutes pour backup

  // Informations de base
  name: string;
  type: string;
  category?: string;

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
    dayOfWeek: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;

  // Médias
  photos?: string[];
  logo?: string;
  coverImage?: string;

  // Métriques
  rating?: number;
  reviewCount?: number;

  // SEO
  metaDescription?: string;

  // URL Google Maps
  googleMapsUrl?: string;
}

// Configuration des libraries Google
const libraries: ("places" | "geometry")[] = ["places"];

interface UseGooglePlacesOptions {
  apiKey: string;
  defaultCountry?: string;
  language?: string;
  onPlaceSelected?: (place: FormattedPlaceData) => void;
  types?: string[]; // Types de lieux à rechercher
}

export const useGooglePlaces = ({
  apiKey,
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

  // Charger l'API Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
    language,
  });

  // Initialiser les services Google
  useEffect(() => {
    if (isLoaded && window.google) {
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
      if (mapRef.current && mapRef.current.parentNode) {
        mapRef.current.parentNode.removeChild(mapRef.current);
      }
    };
  }, [isLoaded]);

  // Mapper les types Google vers vos types
  const mapGoogleTypeToPlaceType = (googleTypes: string[]): string => {
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
  };

  // Convertir les jours Google (0-6, dimanche=0) vers votre enum
  const mapDayToEnum = (day: number): string => {
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    return days[day];
  };

  // Formater les horaires Google
  const formatOpeningHours = (
    periods?: any[]
  ): FormattedPlaceData["openingHours"] => {
    if (!periods) return undefined;

    const daysMap = new Map<string, any>();

    // Initialiser tous les jours comme fermés
    [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ].forEach((day) => {
      daysMap.set(day, {
        dayOfWeek: day,
        openTime: "00:00",
        closeTime: "00:00",
        isClosed: true,
      });
    });

    // Remplir avec les vraies données
    periods.forEach((period) => {
      if (period.open) {
        const dayEnum = mapDayToEnum(period.open.day);
        const openTime = period.open.time
          ? `${period.open.time.substring(0, 2)}:${period.open.time.substring(
              2
            )}`
          : "00:00";
        const closeTime = period.close?.time
          ? `${period.close.time.substring(0, 2)}:${period.close.time.substring(
              2
            )}`
          : "23:59";

        daysMap.set(dayEnum, {
          dayOfWeek: dayEnum,
          openTime,
          closeTime,
          isClosed: false,
        });
      }
    });

    return Array.from(daysMap.values());
  };

  // Extraire les composants d'adresse
  const extractAddressComponents = (components: any[]) => {
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
  };

  // Rechercher des prédictions
  const searchPlaces = useCallback(
    (input: string) => {
      if (!autocompleteService.current || !input || input.length < 3) {
        setPredictions([]);
        return;
      }

      setIsSearching(true);

      const request = {
        input,
        componentRestrictions: { country: defaultCountry },
        types,
        language,
        // Bias vers Bédarieux
        location: new google.maps.LatLng(43.6158, 3.1303),
        radius: 50000, // 50km autour de Bédarieux
      };

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsSearching(false);

          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setPredictions(predictions);
          } else {
            setPredictions([]);
            if (
              status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            ) {
              console.error("Erreur recherche Google Places:", status);
            }
          }
        }
      );
    },
    [defaultCountry, language, types]
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
        ],
        language,
      };

      placesService.current.getDetails(request, (place, status) => {
        setIsSearching(false);

        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const addressComponents = extractAddressComponents(
            place.address_components || []
          );

          // Formater les photos
          const photos = place.photos
            ?.slice(0, 10)
            .map((photo) => photo.getUrl({ maxWidth: 1200, maxHeight: 800 }));

          // Créer la description meta à partir des avis ou types
          const metaDescription =
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
            coverImage: photos?.[0],

            // Métriques
            rating: place.rating,
            reviewCount: place.user_ratings_total,

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
    [language, onPlaceSelected]
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
    clearPredictions,
    clearSelection,
    setInputValue,

    // Utils
    mapRef,
  };
};
