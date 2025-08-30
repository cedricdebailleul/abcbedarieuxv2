"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Tag,
  Phone,
  Mail,
  Globe,
  Star,
  Eye,
  Calendar,
  Share2,
  Heart,
  Percent,
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

type DiscountType =
  | "PERCENTAGE"
  | "FIXED_AMOUNT"
  | "FREE_SHIPPING"
  | "BUY_X_GET_Y"
  | string;

interface Offer {
  title: string;
  summary?: string;
  description?: string;
  termsAndConditions?: string;
  images?: string; // JSON string of image URLs
  coverImage?: string;
  tags?: string; // JSON string of tags
  discountType?: DiscountType;
  discountValue?: number;
  expiryDate?: string;
  validFrom?: string;
  isFeatured?: boolean;
  type?: string;
  viewCount?: number;
  redeemCount?: number;
  place: Place;
}

interface OfferPageContentProps {
  offer: Offer;
}

export function OfferPageContent({ offer }: OfferPageContentProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Parse images from JSON string with error handling
  const parseJsonSafely = <T = string,>(jsonString?: string): T[] => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString) as unknown;
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      console.warn("Invalid JSON data:", jsonString);
      return [];
    }
  };

  const galleryImages = parseJsonSafely(offer.images);
  const allImages = [
    ...(offer.coverImage ? [offer.coverImage] : []),
    ...galleryImages,
  ];

  const tags = parseJsonSafely(offer.tags);

  const formatDiscount = (discountType?: string, discountValue?: number) => {
    if (!discountValue) return "";

    switch (discountType) {
      case "PERCENTAGE":
        return `-${discountValue}%`;
      case "FIXED_AMOUNT":
        return `-${discountValue}€`;
      case "FREE_SHIPPING":
        return "Livraison gratuite";
      case "BUY_X_GET_Y":
        return `Achetez ${discountValue}, obtenez 1 gratuit`;
      default:
        return "Remise spéciale";
    }
  };

  const formatExpiryDate = (date?: string) => {
    if (!date) return null;
    const expiryDate = new Date(date);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expirée";
    if (diffDays === 0) return "Expire aujourd'hui";
    if (diffDays === 1) return "Expire demain";
    return `Expire dans ${diffDays} jours`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: offer.title,
          text: offer.summary || offer.description,
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
              <Link href={`/places/${offer.place.slug}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au lieu
              </Link>
            </Button>
            <div className="flex items-center text-sm text-muted-foreground">
              <Link
                href={`/places/${offer.place.slug}`}
                className="hover:text-primary"
              >
                {offer.place.name}
              </Link>
              <span className="mx-2">/</span>
              <span>Offres</span>
              <span className="mx-2">/</span>
              <span>{offer.title}</span>
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
                    alt={offer.title}
                    className="h-full w-full object-cover"
                    width={500}
                    height={500}
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
                          alt={`${offer.title} ${index + 1}`}
                          className="h-full w-full object-cover"
                          width={500}
                          height={500}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square w-full flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune image disponible
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Informations offre */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold">{offer.title}</h1>
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
                  {formatDiscount(offer.discountType, offer.discountValue)}
                </div>
                {offer.isFeatured && (
                  <Badge className="bg-yellow-500 text-yellow-900">
                    <Star className="h-3 w-3 mr-1 fill-current" />À la une
                  </Badge>
                )}
                {offer.type && <Badge variant="outline">{offer.type}</Badge>}
                {offer.expiryDate && (
                  <Badge
                    variant={
                      formatExpiryDate(offer.expiryDate) === "Expirée"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatExpiryDate(offer.expiryDate)}
                  </Badge>
                )}
              </div>

              {offer.validFrom && (
                <div className="text-sm text-muted-foreground mb-4">
                  <span className="text-green-600">
                    Valide depuis le{" "}
                    {new Date(offer.validFrom).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
            </div>

            {offer.summary && (
              <div>
                <p className="text-lg text-muted-foreground">{offer.summary}</p>
              </div>
            )}

            {offer.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{offer.description}</p>
                </div>
              </div>
            )}

            {offer.termsAndConditions && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Conditions</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">
                    {offer.termsAndConditions}
                  </p>
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
                  <Percent className="h-4 w-4 mr-2" />
                  Profiter de l&apos;offre
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {offer.viewCount ?? 0} vue
                  {(offer.viewCount ?? 0) > 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1">
                  <Percent className="h-4 w-4" />
                  {offer.redeemCount ?? 0} utilisation
                  {(offer.redeemCount ?? 0) > 1 ? "s" : ""}
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
                    href={`/places/${offer.place.slug}`}
                    className="text-lg font-semibold hover:text-primary transition-colors"
                  >
                    {offer.place.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {offer.place.type} • {offer.place.city}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  {offer.place.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {offer.place.address}
                    </div>
                  )}
                  {offer.place.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${offer.place.phone}`}
                        className="hover:text-primary"
                      >
                        {offer.place.phone}
                      </a>
                    </div>
                  )}
                  {offer.place.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${offer.place.email}`}
                        className="hover:text-primary"
                      >
                        {offer.place.email}
                      </a>
                    </div>
                  )}
                  {offer.place.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={offer.place.website}
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
                  <Link href={`/places/${offer.place.slug}`}>
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
