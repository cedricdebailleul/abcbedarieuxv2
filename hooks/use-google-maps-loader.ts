"use client";

import { useMemo } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { env } from "@/lib/env";

// Configuration centralisée des libraries Google Maps
const libraries: ("places" | "geometry" | "marker")[] = ["places", "marker"];

interface UseGoogleMapsLoaderReturn {
  isLoaded: boolean;
  loadError: Error | undefined;
  google: typeof google | null;
}

// Hook centralisé pour charger l'API Google Maps
export const useGoogleMapsLoader = (): UseGoogleMapsLoaderReturn => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
    language: "fr",
    // Éviter les recharges multiples
    preventGoogleFontsLoading: true,
  });

  // Mémoriser l'objet google pour éviter les boucles de re-render
  const googleInstance = useMemo(() => {
    if (typeof window !== "undefined" && isLoaded) {
      return window.google || null;
    }
    return null;
  }, [isLoaded]);

  return {
    isLoaded,
    loadError,
    google: googleInstance,
  };
};
