"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface PlaceData {
  id: string;
  name: string;
  type: string;
  summary?: string | null;
  description?: string | null;
  street: string;
  streetNumber?: string | null;
  postalCode: string;
  city: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  images?: string[] | null;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string | null;
  }>;
}

interface PlaceAboutTabProps {
  place: PlaceData | undefined;
  gallery: string[] | undefined;
}

export function PlaceAboutTab({ place }: PlaceAboutTabProps) {
  if (!place) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />À propos
          </h2>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Chargement des informations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Titre de l'onglet */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />À propos
        </h2>
      </div>

      {/* Description */}
      {(place.summary || place.description) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {place.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {place.summary && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-foreground font-medium leading-relaxed">
                  {place.summary}
                </p>
              </div>
            )}
            {place.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {place.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
