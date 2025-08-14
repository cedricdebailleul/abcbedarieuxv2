"use client";

import { MapFilters } from "./map-filters";
import { Button } from "@/components/ui/button";
import type { MapFilters as IMapFilters, MapCategory } from "./interactive-map";

interface MobileMapFiltersProps {
  filters: IMapFilters;
  onFiltersChange: (filters: IMapFilters) => void;
  categories: MapCategory[];
  placesCount: number;
  totalPlaces: number;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}

export function MobileMapFilters({
  filters,
  onFiltersChange,
  categories,
  placesCount,
  totalPlaces,
  userLocation,
  onClose
}: MobileMapFiltersProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <MapFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          categories={categories}
          placesCount={placesCount}
          totalPlaces={totalPlaces}
          userLocation={userLocation}
        />
      </div>
      
      {/* Boutons d'action */}
      <div className="border-t p-4 bg-background">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={onClose}
            className="flex-1"
          >
            Voir {placesCount} résultat{placesCount > 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}