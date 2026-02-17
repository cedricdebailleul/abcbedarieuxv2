"use client";

import { useState, useEffect, useMemo } from "react";
import { MapFilters } from "./map-filters";
import { MapView } from "./map-view";
import { PlaceCard } from "./place-card";
import { ClusterCard } from "./cluster-card";
import { MobileMapFilters } from "./mobile-map-filters";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { calculateDistance } from "@/lib/map-utils";
import type { PlaceCluster } from "@/lib/map-utils";
import { computeOpeningStatus } from "@/lib/opening-hours-utils";
import { getPlaceTypeLabel, normalizeForSearch } from "@/lib/share-utils";

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
  email?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  tiktok?: string | null;
  coverImage?: string | null;
  logo?: string | null;
  isFeatured: boolean;
  ownerId?: string | null;
  updatedAt: Date;
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
  reviews: Array<{ rating: number }>;
  googleReviews: Array<{ rating: number }>;
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
  showAssociations: boolean;
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
    showAssociations: false,
  });

  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<PlaceCluster | null>(null);
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

  // Forcer le re-rendu quand les filtres changent (catégories ou recherche)
  const handleFiltersChange = (newFilters: MapFilters) => {
    const categoriesChanged =
      newFilters.categories.length !== filters.categories.length ||
      newFilters.categories.some((cat) => !filters.categories.includes(cat));

    const searchChanged = newFilters.search !== filters.search;

    setFilters(newFilters);

    // Forcer le recentrage si les catégories ou la recherche changent
    if (categoriesChanged || searchChanged) {
      setMapKey((prev) => prev + 1);
    }
  };

  // Filtrer les places
  const filteredPlaces = useMemo(() => {
    const filtered = places.filter((place) => {
      // Note: On garde toutes les places, même sans coordonnées pour l'affichage en liste
      // Les places sans coordonnées ne s'afficheront simplement pas sur la carte

      // Filtre par recherche textuelle
      if (filters.search) {
        const searchTerm = normalizeForSearch(filters.search);
        const frenchTypeLabel = normalizeForSearch(
          getPlaceTypeLabel(place.type)
        );
        const matchesSearch =
          normalizeForSearch(place.name).includes(searchTerm) ||
          (place.summary &&
            normalizeForSearch(place.summary).includes(searchTerm)) ||
          place.categories.some(
            (pc) =>
              normalizeForSearch(pc.category.name).includes(searchTerm) ||
              (pc.category.parent &&
                normalizeForSearch(pc.category.parent.name).includes(
                  searchTerm
                ))
          ) ||
          normalizeForSearch(place.type).includes(searchTerm) ||
          frenchTypeLabel.includes(searchTerm) ||
          normalizeForSearch(`${place.street} ${place.city}`).includes(
            searchTerm
          );

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

      // Filtre par distance (seulement pour les places avec coordonnées)
      if (
        filters.distance &&
        filters.userLocation &&
        place.latitude &&
        place.longitude
      ) {
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

      // Filtre par type association
      if (!filters.showAssociations && place.type === 'ASSOCIATION') {
        return false;
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

  // Plus de clustering statique - le clustering dynamique est géré par MapView
  // selon le niveau de zoom de la carte

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = !!(
    filters.search ||
    filters.categories.length > 0 ||
    filters.distance ||
    filters.showOpenOnly ||
    filters.showAssociations
  );

  // Compter les places sans coordonnées
  const placesWithoutCoords = filteredPlaces.filter(p => !p.latitude || !p.longitude);
  const hasPlacesWithoutCoords = placesWithoutCoords.length > 0;

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
        {/* Alerte pour les places sans coordonnées */}
        {hasPlacesWithoutCoords && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-md">
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 shadow-lg">
              <div className="flex items-start gap-3">
                <span className="text-orange-500 text-xl">⚠️</span>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-orange-900">
                    {placesWithoutCoords.length} établissement{placesWithoutCoords.length > 1 ? 's' : ''} sans position GPS
                  </p>
                  <p className="text-orange-700 mt-1">
                    {placesWithoutCoords.map(p => p.name).join(', ')} {placesWithoutCoords.length === 1 ? 'n\'apparaît' : 'n\'apparaissent'} pas sur la carte car {placesWithoutCoords.length === 1 ? 'son adresse n\'a' : 'leurs adresses n\'ont'} pas été géolocalisée{placesWithoutCoords.length > 1 ? 's' : ''}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <MapView
          key={`map-${mapKey}`}
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onPlaceSelect={(place) => {
            setSelectedPlace(place);
            setSelectedCluster(null); // Fermer le cluster si une place est sélectionnée
          }}
          onClusterSelect={(cluster) => {
            setSelectedCluster(cluster);
            setSelectedPlace(null); // Fermer la place si un cluster est sélectionné
          }}
          userLocation={userLocation}
          categories={categories}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Mobile Filter Button */}
        <div className="lg:hidden absolute top-24 left-4 z-40">
          <Button
            onClick={() => setShowMobileFilters(true)}
            size="sm"
            className="shadow-lg bg-white/95 backdrop-blur-sm text-gray-900 hover:bg-white"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
            {(filters.categories.length > 0 ||
              filters.search ||
              filters.distance ||
              filters.showOpenOnly ||
              filters.showAssociations) && (
              <span className="ml-1 bg-primary-foreground text-primary rounded-full w-2 h-2 text-xs flex items-center justify-center">
                •
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Place Card Popup */}
      {selectedPlace && (
        <div className="absolute inset-0 z-50 lg:inset-auto lg:right-4 lg:top-24 lg:bottom-4 lg:w-96 pointer-events-none">
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

      {/* Cluster Card Popup */}
      {selectedCluster && (
        <div className="absolute inset-0 z-[60] lg:inset-auto lg:right-4 lg:top-24 lg:bottom-4 lg:w-96 pointer-events-none">
          <div className="h-full pointer-events-auto">
            <ClusterCard
              places={selectedCluster.places}
              address={selectedCluster.address}
              onClose={() => setSelectedCluster(null)}
              onPlaceSelect={(place) => {
                setSelectedPlace(place);
                setSelectedCluster(null);
              }}
              className="h-full lg:h-auto lg:max-h-full lg:shadow-xl"
            />
          </div>
        </div>
      )}

      {/* Mobile Filters */}
      {showMobileFilters && (
        <MobileMapFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
          placesCount={filteredPlaces.length}
          totalPlaces={places.length}
          userLocation={userLocation}
          onClose={() => setShowMobileFilters(false)}
        />
      )}
    </div>
  );
}
