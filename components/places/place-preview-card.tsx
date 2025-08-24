"use client";

import Link from "next/link";
import { MapPin, Star, Phone, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SafeImage } from "@/components/safe-image";
import { PlaceCategoriesBadges } from "./place-categories-badges";
import { getPlaceTypeLabel } from "@/lib/share-utils";

interface PlacePreviewCardProps {
  place: {
    id: string;
    name: string;
    slug: string;
    type: string;
    summary?: string | null;
    street: string;
    streetNumber?: string | null;
    postalCode: string;
    city: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    coverImage?: string | null;
    logo?: string | null;
    categories: Array<{
      category: {
        id: string;
        name: string;
        slug: string;
        icon?: string | null;
        color?: string | null;
      };
    }>;
    reviews: Array<{ rating: number }>;
    googleReviews: Array<{ rating: number }>;
    _count: {
      reviews: number;
      googleReviews: number;
    };
  };
}

export function PlacePreviewCard({ place }: PlacePreviewCardProps) {
  // Adresse complète
  const fullAddress = `${place.streetNumber ? `${place.streetNumber} ` : ""}${place.street}, ${place.postalCode} ${place.city}`;

  // Calculer la note moyenne
  const allReviews = [...place.reviews, ...place.googleReviews];
  const averageRating =
    allReviews.length > 0
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) /
        allReviews.length
      : 0;
  const totalReviews = place._count.reviews + place._count.googleReviews;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 overflow-hidden">
        {place.coverImage || place.logo ? (
          <SafeImage
            src={place.coverImage || place.logo!}
            alt={place.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            fallbackClassName="w-full h-full bg-gradient-to-br from-muted to-muted/50"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badge type */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur-sm"
          >
            {getPlaceTypeLabel(place.type)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Titre et note */}
        <div>
          <h3 className="font-semibold text-lg mb-1">{place.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {totalReviews > 0 && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-foreground">
                  {averageRating.toFixed(1)}
                </span>
                <span className="ml-1">({totalReviews} avis)</span>
              </div>
            )}
          </div>
        </div>

        {/* Catégories */}
        {place.categories.length > 0 && (
          <PlaceCategoriesBadges
            categories={place.categories.map((item) => ({
              ...item,
              category: {
                ...item.category,
                icon: item.category.icon ?? null, // Toujours présent
                color: item.category.color ?? null,
              },
            }))}
            maxDisplay={3}
            size="sm"
          />
        )}

        {/* Description */}
        {place.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {place.summary}
          </p>
        )}

        {/* Adresse */}
        <div className="flex items-start text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{fullAddress}</span>
        </div>

        {/* Actions de contact */}
        <div className="flex items-center gap-2 pt-2">
          {place.phone && (
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${place.phone}`} title="Appeler">
                <Phone className="w-4 h-4 mr-1" />
                Appeler
              </a>
            </Button>
          )}

          {place.email && (
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${place.email}`} title="Email">
                <Mail className="w-4 h-4 mr-1" />
                Email
              </a>
            </Button>
          )}

          {place.website && (
            <Button asChild variant="outline" size="sm">
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                title="Site web"
              >
                <Globe className="w-4 h-4 mr-1" />
                Site
              </a>
            </Button>
          )}
        </div>

        {/* Bouton voir plus */}
        <div className="pt-2">
          <Button asChild className="w-full" size="sm">
            <Link href={`/places/${place.slug}`}>Voir la fiche complète</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
