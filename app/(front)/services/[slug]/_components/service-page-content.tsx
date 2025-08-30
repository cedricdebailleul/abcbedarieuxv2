"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Wrench,
  Phone,
  Mail,
  Globe,
  Star,
  Eye,
  Calendar,
  Share2,
  Heart,
  Clock,
  MapPin} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Place {
  slug: string;
  name: string;
  type?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface Service {
  name: string;
  summary?: string;
  description?: string;
  images?: string | null; // JSON string or null
  coverImage?: string | null;
  tags?: string | null; // JSON string or null
  price?: number | null;
  priceType?: "FREE" | "ON_REQUEST" | "VARIABLE" | string;
  currency?: string | null;
  unit?: string | null;
  duration?: number | null; // minutes
  isFeatured?: boolean;
  category?: string | null;
  requiresBooking?: boolean;
  viewCount?: number;
  bookingCount?: number;
  place: Place;
}

interface ServicePageContentProps {
  service: Service; // typed service object
}

export function ServicePageContent({ service }: ServicePageContentProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Parse images from JSON string with error handling
  function parseJsonSafely<T = string>(jsonString?: string | null): T[] {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      console.warn("Invalid JSON data:", jsonString);
      return [];
    }
  }

  const galleryImages = parseJsonSafely(service.images);
  const allImages = [
    ...(service.coverImage ? [service.coverImage] : []),
    ...galleryImages,
  ];

  // Parse tags from JSON string with error handling
  const tags = parseJsonSafely(service.tags);

  const formatPrice = (
    price?: number | null,
    priceType?: string,
    currency?: string | null,
    unit?: string | null
  ) => {
    if (price == null || priceType === "FREE") return "Gratuit";
    if (priceType === "ON_REQUEST") return "Sur demande";
    if (priceType === "VARIABLE") return "Prix variable";

    const formattedPrice = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(price);

    return unit ? `${formattedPrice} ${unit}` : formattedPrice;
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return null;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service.name,
          text: service.summary || service.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec navigation */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/places/${service.place.slug}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au lieu
              </Link>
            </Button>
            <div className="flex items-center text-sm text-muted-foreground">
              <Link
                href={`/places/${service.place.slug}`}
                className="hover:text-primary"
              >
                {service.place.name}
              </Link>
              <span className="mx-2">/</span>
              <span>Services</span>
              <span className="mx-2">/</span>
              <span>{service.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            {allImages.length > 0 ? (
              <>
                <div className="aspect-square w-full overflow-hidden rounded-lg border">
                  <Image
                    src={allImages[selectedImageIndex]}
                    alt={service.name}
                    className="h-full w-full object-cover"
                    fill
                  />
                </div>
                {allImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {allImages.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={cn(
                          "aspect-square overflow-hidden rounded-md border-2 transition-all",
                          index === selectedImageIndex
                            ? "border-primary"
                            : "border-muted hover:border-muted-foreground"
                        )}
                      >
                        <Image
                          src={image}
                          alt={`${service.name} ${index + 1}`}
                          className="h-full w-full object-cover"
                          fill
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square w-full flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <Wrench className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune image disponible
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Informations service */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold">{service.name}</h1>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        isFavorite && "fill-current text-red-500"
                      )}
                    />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(
                    service.price,
                    service.priceType,
                    service.currency,
                    service.unit
                  )}
                </div>
                {service.duration && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(service.duration)}
                  </Badge>
                )}
                {service.isFeatured && (
                  <Badge className="bg-yellow-500 text-yellow-900">
                    <Star className="h-3 w-3 mr-1 fill-current" />À la une
                  </Badge>
                )}
                {service.category && (
                  <Badge variant="outline">{service.category}</Badge>
                )}
              </div>

              {service.requiresBooking && (
                <div className="text-sm text-blue-600 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Réservation requise</span>
                </div>
              )}
            </div>

            {service.summary && (
              <div>
                <p className="text-lg text-muted-foreground">
                  {service.summary}
                </p>
              </div>
            )}

            {service.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{service.description}</p>
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex gap-3">
                <Button className="flex-1" size="lg">
                  {service.requiresBooking ? (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Réserver ce service
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Contacter pour ce service
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {service.viewCount ?? 0} vue
                  {(service.viewCount ?? 0) > 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {service.bookingCount ?? 0} réservation
                  {(service.bookingCount ?? 0) > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Informations du lieu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Disponible chez
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Link
                    href={`/places/${service.place.slug}`}
                    className="text-lg font-semibold hover:text-primary transition-colors"
                  >
                    {service.place.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {service.place.type} • {service.place.city}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  {service.place.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {service.place.address}
                    </div>
                  )}
                  {service.place.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${service.place.phone}`}
                        className="hover:text-primary"
                      >
                        {service.place.phone}
                      </a>
                    </div>
                  )}
                  {service.place.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${service.place.email}`}
                        className="hover:text-primary"
                      >
                        {service.place.email}
                      </a>
                    </div>
                  )}
                  {service.place.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={service.place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        Site web
                      </a>
                    </div>
                  )}
                </div>

                <Button asChild className="w-full mt-4">
                  <Link href={`/places/${service.place.slug}`}>
                    Voir le lieu complet
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
