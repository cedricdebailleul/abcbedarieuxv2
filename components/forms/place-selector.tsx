"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Place {
  id: string;
  name: string;
  city: string;
  type: string;
  status: string;
}

interface PlaceSelectorProps {
  value?: string;
  onValueChange: (placeId: string, place?: Place) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PlaceSelector({
  value,
  onValueChange,
  placeholder = "Sélectionner un lieu...",
  disabled = false,
  className,
}: PlaceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    async function fetchUserPlaces() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/dashboard/user-places");
        if (response.ok) {
          const data = await response.json();
          setPlaces(data.places || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des lieux:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserPlaces();
  }, []);

  useEffect(() => {
    if (value && places.length > 0) {
      const place = places.find((p) => p.id === value);
      setSelectedPlace(place || null);
    } else {
      setSelectedPlace(null);
    }
  }, [value, places]);

  const handleSelect = (placeId: string) => {
    const place = places.find((p) => p.id === placeId);
    if (place) {
      setSelectedPlace(place);
      onValueChange(placeId, place);
    }
    setOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedPlace ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">{selectedPlace.name}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs flex-shrink-0",
                  getStatusColor(selectedPlace.status)
                )}
              >
                {selectedPlace.city}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un lieu..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="text-center py-6">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Aucun lieu trouvé
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vous devez être propriétaire d&apos;un lieu pour ajouter des
                    produits ou services
                  </p>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {places.map((place) => (
                <CommandItem
                  key={place.id}
                  value={`${place.name} ${place.city} ${place.type}`}
                  onSelect={() => handleSelect(place.id)}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{place.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {place.city}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {place.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getStatusColor(place.status)
                          )}
                        >
                          {place.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 flex-shrink-0",
                      selectedPlace?.id === place.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
