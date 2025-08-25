"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Eye,
  ShoppingCart,
  Share2,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  summary?: string;
  price?: number;
  priceType: string;
  currency: string;
  unit?: string;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  stock?: number;
  minQuantity?: number;
  maxQuantity?: number;
  coverImage?: string;
  images?: string;
  category?: string;
  tags?: string;
  specifications?: Record<string, unknown>;
  viewCount: number;
  orderCount: number;
  place?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    type?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
}

interface ProductPageContentProps {
  product: Product;
}

export function ProductPageContent({ product }: ProductPageContentProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Early return if no place data
  if (!product.place) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">
              Informations du lieu non disponibles
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Parse images from JSON string with error handling
  const parseJsonSafely = <T = unknown,>(jsonString?: string): T[] => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      console.warn("Invalid JSON data:", jsonString);
      return [];
    }
  };

  const galleryImages = parseJsonSafely<string>(product.images);
  const allImages = [
    ...(product.coverImage ? [product.coverImage] : []),
    ...galleryImages,
  ];

  // Parse tags from JSON string with error handling
  const tags = parseJsonSafely<string>(product.tags);

  const formatPrice = (
    price?: number,
    priceType?: string,
    currency?: string,
    unit?: string
  ) => {
    if (!price || priceType === "FREE") return "Gratuit";
    if (priceType === "ON_REQUEST") return "Sur demande";
    if (priceType === "VARIABLE") return "Prix variable";

    const formattedPrice = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(price);

    return unit ? `${formattedPrice} ${unit}` : formattedPrice;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.summary || product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
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
              <Link href={`/places/${product.place.slug}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au lieu
              </Link>
            </Button>
            <div className="flex items-center text-sm text-muted-foreground">
              <Link
                href={`/places/${product.place.slug}`}
                className="hover:text-primary"
              >
                {product.place.name}
              </Link>
              <span className="mx-2">/</span>
              <span>Produits</span>
              <span className="mx-2">/</span>
              <span>{product.name}</span>
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
                    alt={product.name}
                    className="h-full w-full object-cover"
                    fill
                  />
                </div>
                {allImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {allImages.map((image, index) => (
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
                          alt={`${product.name} ${index + 1}`}
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
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune image disponible
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Informations produit */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold">{product.name}</h1>
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
                    product.price,
                    product.priceType,
                    product.currency,
                    product.unit
                  )}
                </div>
                {product.isFeatured && (
                  <Badge className="bg-yellow-500 text-yellow-900">
                    <Star className="h-3 w-3 mr-1 fill-current" />À la une
                  </Badge>
                )}
                {product.category && (
                  <Badge variant="outline">{product.category}</Badge>
                )}
              </div>

              {product.stock !== undefined && (
                <div className="text-sm text-muted-foreground mb-4">
                  {product.stock > 0 ? (
                    <span className="text-green-600">
                      En stock ({product.stock} disponible
                      {product.stock > 1 ? "s" : ""})
                    </span>
                  ) : (
                    <span className="text-red-600">Rupture de stock</span>
                  )}
                </div>
              )}
            </div>

            {product.summary && (
              <div>
                <p className="text-lg text-muted-foreground">
                  {product.summary}
                </p>
              </div>
            )}

            {product.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{product.description}</p>
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
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Contacter pour commander
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {product.viewCount} vue{product.viewCount > 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4" />
                  {product.orderCount} commande
                  {product.orderCount > 1 ? "s" : ""}
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
                    href={`/places/${product.place.slug}`}
                    className="text-lg font-semibold hover:text-primary transition-colors"
                  >
                    {product.place.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {product.place.type || "Type non spécifié"} • {product.place.city}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  {product.place.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {product.place.address}
                    </div>
                  )}
                  {product.place.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${product.place.phone}`}
                        className="hover:text-primary"
                      >
                        {product.place.phone}
                      </a>
                    </div>
                  )}
                  {product.place.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${product.place.email}`}
                        className="hover:text-primary"
                      >
                        {product.place.email}
                      </a>
                    </div>
                  )}
                  {product.place.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={product.place.website}
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
                  <Link href={`/places/${product.place.slug}`}>
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
