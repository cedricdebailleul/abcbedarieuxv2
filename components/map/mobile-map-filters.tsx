"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapFilters } from "./map-filters";
import { Button } from "@/components/ui/button";
import { X, ChevronUp, ChevronDown } from "lucide-react";
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
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Gérer la fermeture avec Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 200 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] lg:hidden">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: isExpanded ? "10%" : "25%" }}
          exit={{ y: "100%" }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(event, info) => {
            setIsDragging(false);
            handleDragEnd(event, info);
          }}
          className={`absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-2xl flex flex-col ${isExpanded ? 'max-h-[90vh] min-h-[85vh]' : 'max-h-[75vh] min-h-[60vh]'}`}
          style={{ touchAction: isDragging ? 'none' : 'auto' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filters-title"
          aria-describedby="filters-description"
        >
          {/* Handle de drag */}
          <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header sticky */}
          <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="filters-title" className="text-lg font-semibold">
                  Filtres de recherche
                </h2>
                <p id="filters-description" className="text-sm text-muted-foreground">
                  {placesCount} résultat{placesCount > 1 ? 's' : ''} sur {totalPlaces}
                </p>
              </div>
              <div className="flex gap-2">
                {/* Bouton Expand/Collapse */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="shrink-0"
                  aria-label={isExpanded ? "Réduire les filtres" : "Agrandir les filtres"}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </Button>
                
                {/* Bouton Fermer */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="shrink-0"
                  aria-label="Fermer les filtres"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu avec scroll */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4">
            <div className="py-4">
              <MapFilters
                filters={filters}
                onFiltersChange={onFiltersChange}
                categories={categories}
                placesCount={placesCount}
                totalPlaces={totalPlaces}
                userLocation={userLocation}
              />
            </div>
          </div>

          {/* Footer sticky */}
          <div className="sticky bottom-0 bg-background border-t p-4">
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}