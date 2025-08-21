"use client";

import { useState, useEffect, useMemo } from "react";
import { MapFilters } from "./map-filters";
import { MapView } from "./map-view";
import { PlaceCard } from "./place-card";
import { MobileMapFilters } from "./mobile-map-filters";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { calculateDistance } from "@/lib/map-utils";
import { computeOpeningStatus } from "@/lib/opening-hours-utils";
import { getPlaceTypeLabel } from "@/lib/share-utils";

export interface MapPlace {
  id: string;
  name: string;
  slug: string;
  type: string;
  summary?: string | null;
  street: string;
  streetNumber?: string | null;
  postalCode: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  coverImage?: string | null;
  logo?: string | null;
  isFeatured: boolean;
  categories: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
      icon?: string | null;
      color?: string | null;
      parent?: {
        id: string;
        name: string;
        slug: string;
        icon?: string | null;
        color?: string | null;
      } | null;
    };
  }>;
  openingHours: Array<{
    dayOfWeek: string;
    isClosed: boolean;
    openTime?: string | null;
    closeTime?: string | null;
  }>;
  _count: {
    reviews: number;
    googleReviews: number;
  };
}

export interface MapCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    color?: string | null;
    _count: {
      places: number;
    };
  }>;
  _count: {
    places: number;
  };
}

export interface MapFilters {
  search: string;
  categories: string[];
  distance: number | null;
  userLocation: { lat: number; lng: number } | null;
  sortBy: "name" | "distance" | "featured";
  showOpenOnly: boolean;
}

interface InteractiveMapProps {
  places: MapPlace[];
  categories: MapCategory[];
}

export function InteractiveMap({ places, categories }: InteractiveMapProps) {
  const [filters, setFilters] = useState<MapFilters>({
    search: "",
    categories: [],
    distance: null,
    userLocation: null,
    sortBy: "featured",
    showOpenOnly: false,
  });

  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapKey, setMapKey] = useState(0);

  // Demander la géolocalisation au chargement
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setFilters((prev) => ({ ...prev, userLocation: location }));
        },
        (error) => {
          console.log("Géolocalisation non disponible:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  // Forcer plusieurs re-rendus pour s'assurer que les markers apparaissent
  useEffect(() => {
    if (places.length > 0 && categories.length > 0) {
      // Premier re-rendu rapide
      const timer1 = setTimeout(() => {
        setMapKey((prev) => prev + 1);
      }, 500);

      // Deuxième re-rendu de sécurité
      const timer2 = setTimeout(() => {
        setMapKey((prev) => prev + 1);
      }, 1500);

      // Troisième re-rendu de sécurité
      const timer3 = setTimeout(() => {
        setMapKey((prev) => prev + 1);
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [places.length, categories.length]);

  // Forcer le re-rendu quand les filtres changent (mais seulement pour les catégories)
  const handleFiltersChange = (newFilters: MapFilters) => {
    const categoriesChanged =
      newFilters.categories.length !== filters.categories.length ||
      newFilters.categories.some((cat) => !filters.categories.includes(cat));

    setFilters(newFilters);

    if (categoriesChanged) {
      setMapKey((prev) => prev + 1);
    }
  };

  // Filtrer les places
  const filteredPlaces = useMemo(() => {
    const filtered = places.filter((place) => {
      // Vérifier que la place a des coordonnées
      if (!place.latitude || !place.longitude) return false;

      // Filtre par recherche textuelle
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const frenchTypeLabel = getPlaceTypeLabel(place.type).toLowerCase();
        const matchesSearch =
          place.name.toLowerCase().includes(searchTerm) ||
          place.summary?.toLowerCase().includes(searchTerm) ||
          place.categories.some(
            (pc) =>
              pc.category.name.toLowerCase().includes(searchTerm) ||
              (pc.category.parent &&
                pc.category.parent.name.toLowerCase().includes(searchTerm))
          ) ||
          place.type.toLowerCase().includes(searchTerm) ||
          frenchTypeLabel.includes(searchTerm) ||
          `${place.street} ${place.city}`.toLowerCase().includes(searchTerm);

        if (!matchesSearch) return false;
      }

      // Filtre par catégories
      if (filters.categories.length > 0) {
        const hasCategory = place.categories.some(
          (pc) =>
            filters.categories.includes(pc.category.id) ||
            (pc.category.parent &&
              filters.categories.includes(pc.category.parent.id))
        );
        if (!hasCategory) return false;
      }

      // Filtre par distance
      if (filters.distance && filters.userLocation) {
        const distance = calculateDistance(
          filters.userLocation.lat,
          filters.userLocation.lng,
          place.latitude,
          place.longitude
        );
        if (distance > filters.distance) return false;
      }

      // Filtre par statut ouvert/fermé
      if (filters.showOpenOnly) {
        const status = computeOpeningStatus(place.openingHours);
        if (!status.isOpen) return false;
      }

      return true;
    });

    // Tri
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "distance":
          if (
            !filters.userLocation ||
            !a.latitude ||
            !a.longitude ||
            !b.latitude ||
            !b.longitude
          ) {
            return 0;
          }
          const distanceA = calculateDistance(
            filters.userLocation.lat,
            filters.userLocation.lng,
            a.latitude,
            a.longitude
          );
          const distanceB = calculateDistance(
            filters.userLocation.lat,
            filters.userLocation.lng,
            b.latitude,
            b.longitude
          );
          return distanceA - distanceB;

        case "name":
          return a.name.localeCompare(b.name);

        case "featured":
        default:
          if (a.isFeatured === b.isFeatured) {
            return a.name.localeCompare(b.name);
          }
          return a.isFeatured ? -1 : 1;
      }
    });

    return filtered;
  }, [places, filters]);

  return (
    <div className="h-full flex relative">
      {/* Sidebar Filters - Desktop */}
      <div className="hidden lg:flex w-80 flex-col border-r bg-background">
        <MapFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
          placesCount={filteredPlaces.length}
          totalPlaces={places.length}
          userLocation={userLocation}
        />
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapView
          key={`map-${mapKey}`}
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onPlaceSelect={setSelectedPlace}
          userLocation={userLocation}
          categories={categories}
        />

        {/* Mobile Filter Button */}
        <div className="lg:hidden absolute top-4 left-4 z-10">
          <Button
            onClick={() => setShowMobileFilters(true)}
            size="sm"
            className="shadow-lg"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
            {(filters.categories.length > 0 ||
              filters.search ||
              filters.distance ||
              filters.showOpenOnly) && (
              <span className="ml-1 bg-primary-foreground text-primary rounded-full w-2 h-2 text-xs flex items-center justify-center">
                •
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Place Card Popup */}
      {selectedPlace && (
        <div className="absolute inset-0 z-50 lg:inset-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-96 pointer-events-none">
          <div className="h-full pointer-events-auto">
            <PlaceCard
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
              userLocation={userLocation}
              className="h-full lg:h-auto lg:max-h-full lg:shadow-xl"
            />
          </div>
        </div>
      )}

      {/* Mobile Filters */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Filtres</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileFilters(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <MobileMapFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              categories={categories}
              placesCount={filteredPlaces.length}
              totalPlaces={places.length}
              userLocation={userLocation}
              onClose={() => setShowMobileFilters(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
