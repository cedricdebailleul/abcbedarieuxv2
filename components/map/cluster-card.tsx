"use client";

import { X, Phone, Globe, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { MapPlace } from "./interactive-map";
import { computeOpeningStatus } from "@/lib/opening-hours-utils";

interface ClusterCardProps {
  places: MapPlace[];
  address: string;
  onClose: () => void;
  onPlaceSelect: (place: MapPlace) => void;
  className?: string;
}

export function ClusterCard({
  places,
  address,
  onClose,
  onPlaceSelect,
  className = "",
}: ClusterCardProps) {
  return (
    <Card className={`w-full max-w-md flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {places.length} établissements
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{address}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 overflow-y-auto lg:max-h-80 scrollbar-primary">
        {places.map((place) => {
          const openingStatus = computeOpeningStatus(place.openingHours);

          return (
            <div
              key={place.id}
              className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onPlaceSelect(place)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{place.name}</h3>
                    {place.type === 'ASSOCIATION' && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        Association
                      </Badge>
                    )}
                  </div>

                  {place.summary && (
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed overflow-hidden">
                      <span 
                        className="block"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {place.summary}
                      </span>
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {place.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span className="truncate">{place.phone}</span>
                      </div>
                    )}
                    
                    {place.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>Site web</span>
                      </div>
                    )}
                  </div>

                  {place.openingHours.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3" />
                      <span
                        className={`text-xs font-medium ${
                          openingStatus.isOpen
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {openingStatus.isOpen ? "Ouvert" : "Fermé"}
                      </span>
                      {openingStatus.nextChange && (
                        <span className="text-xs text-muted-foreground">
                          • {openingStatus.nextChange.type === 'open' ? 'Ouvre' : 'Ferme'} {openingStatus.nextChange.time}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {place.isFeatured && (
                    <Badge variant="default" className="text-xs px-1.5 py-0.5">
                      Mis en avant
                    </Badge>
                  )}
                  
                  <Link
                    href={`/places/${place.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-primary hover:underline"
                  >
                    Voir la fiche
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>

      <div className="px-6 py-3 border-t bg-muted/20">
        <p className="text-xs text-muted-foreground text-center">
          Cliquez sur un établissement pour voir sa fiche ou le sélectionner sur la carte
        </p>
      </div>
    </Card>
  );
}