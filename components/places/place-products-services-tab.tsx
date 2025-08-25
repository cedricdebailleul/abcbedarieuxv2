"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Wrench,
  Tag,
  Star,
  Clock,
  Package,
  Plus,
  Edit3,
  Eye,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  summary?: string;
  price?: number;
  priceType: "FIXED" | "VARIABLE" | "ON_REQUEST" | "FREE";
  currency: string;
  unit?: string;
  status: "DRAFT" | "PUBLISHED" | "OUT_OF_STOCK" | "DISCONTINUED" | "ARCHIVED";
  isActive: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  stock?: number;
  minQuantity?: number;
  maxQuantity?: number;
  coverImage?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  specifications?: Record<string, unknown>;
  viewCount: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  summary?: string;
  price?: number;
  priceType: "FIXED" | "HOURLY" | "DAILY" | "VARIABLE" | "ON_REQUEST" | "FREE";
  currency: string;
  unit?: string;
  duration?: number;
  status: "DRAFT" | "PUBLISHED" | "UNAVAILABLE" | "DISCONTINUED" | "ARCHIVED";
  isActive: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  requiresBooking: boolean;
  coverImage?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  features?: Record<string, unknown>;
  viewCount: number;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Offer {
  id: string;
  title: string;
  slug: string;
  description?: string;
  summary?: string;
  type:
    | "DISCOUNT"
    | "FREEBIE"
    | "BUNDLE"
    | "LOYALTY"
    | "SEASONAL"
    | "LIMITED_TIME";
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING" | "BUY_X_GET_Y";
  discountValue: number;
  discountMaxAmount?: number;
  minimumPurchase?: number;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  maxUsesPerUser?: number;
  currentUses: number;
  code?: string;
  requiresCode: boolean;
  coverImage?: string;
  images?: string[];
  viewCount: number;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PlaceProductsServicesTabProps {
  placeId: string;
  placeName: string;
  products: Product[];
  services: Service[];
  offers: Offer[];
  isOwner?: boolean;
}

export function PlaceProductsServicesTab({
  products,
  services,
  offers,
  isOwner = false,
}: PlaceProductsServicesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Statistiques
  const totalProducts = products.length;
  const totalServices = services.length;
  const totalOffers = offers.filter(
    (offer) =>
      offer.status === "ACTIVE" &&
      offer.isActive &&
      (!offer.endDate || new Date(offer.endDate) > new Date())
  ).length;

  // Filtrage par catégorie
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const filteredServices = selectedCategory
    ? services.filter((s) => s.category === selectedCategory)
    : services;

  // Obtenir toutes les catégories
  const allCategories = Array.from(
    new Set<string>([
      ...products.map((p) => p.category).filter((c): c is string => !!c),
      ...services.map((s) => s.category).filter((c): c is string => !!c),
    ])
  );

  const formatPrice = (
    price?: number,
    priceType?: string,
    currency = "EUR",
    unit?: string
  ) => {
    if (!price) {
      switch (priceType) {
        case "FREE":
          return "Gratuit";
        case "ON_REQUEST":
          return "Sur demande";
        default:
          return "Prix non spécifié";
      }
    }

    const formattedPrice = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(price);

    return unit ? `${formattedPrice}${unit}` : formattedPrice;
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          Inactif
        </Badge>
      );
    }

    switch (status) {
      case "PUBLISHED":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Publié
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="outline" className="gap-1">
            <Edit3 className="h-3 w-3" />
            Brouillon
          </Badge>
        );
      case "OUT_OF_STOCK":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Rupture
          </Badge>
        );
      case "UNAVAILABLE":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Indisponible
          </Badge>
        );
      case "ACTIVE":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
      case "PAUSED":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            En pause
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            Expirée
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getGradientForId = (id: string): string => {
    const gradients = [
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-green-400 to-green-600",
      "from-orange-400 to-orange-600",
      "from-pink-400 to-pink-600",
      "from-indigo-400 to-indigo-600",
      "from-cyan-400 to-cyan-600",
      "from-emerald-400 to-emerald-600",
      "from-rose-400 to-rose-600",
      "from-violet-400 to-violet-600",
      "from-amber-400 to-amber-600",
      "from-teal-400 to-teal-600",
    ];

    // Use the first character of the ID to select a gradient consistently
    const index = id.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const renderProductCard = (product: Product) => (
    <Link key={product.id} href={`/produits/${product.slug}`}>
      <Card
        className={cn(
          "group transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden h-full flex flex-col",
          product.isFeatured && "border-primary/20 bg-primary/5"
        )}
      >
        {/* Image de couverture ou dégradé */}
        <div className="relative h-48 w-full overflow-hidden">
          {product.coverImage ? (
            <Image
              src={product.coverImage}
              alt={product.name}
              className="h-full w-full object-cover"
              width={500}
              height={300}
            />
          ) : (
            <div
              className={cn(
                "h-full w-full bg-gradient-to-br",
                getGradientForId(product.id),
                "flex items-center justify-center"
              )}
            >
              <Package className="h-16 w-16 text-white/80" />
            </div>
          )}
          {product.isFeatured && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500">
                <Star className="h-3 w-3 mr-1 fill-current" />À la une
              </Badge>
            </div>
          )}
          <div className="absolute top-2 right-2">
            {getStatusBadge(product.status, product.isActive)}
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                <Package className="h-5 w-5 text-primary" />
                {product.name}
              </CardTitle>
              {product.category && (
                <Badge variant="outline" className="mt-2">
                  {product.category}
                </Badge>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <div className="text-lg font-semibold text-primary">
                  {formatPrice(
                    product.price,
                    product.priceType,
                    product.currency,
                    product.unit
                  )}
                </div>
                {product.stock !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    Stock: {product.stock}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-3 flex-1">
            {(product.summary || product.description) && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {product.summary || product.description}
              </p>
            )}

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Tag className="h-2 w-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {product.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{product.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {product.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3" />
                  {product.orderCount} commandes
                </span>
              </div>
              <span>
                {new Date(product.updatedAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const renderServiceCard = (service: Service) => (
    <Link key={service.id} href={`/services/${service.slug}`}>
      <Card
        className={cn(
          "group transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden h-full flex flex-col",
          service.isFeatured && "border-primary/20 bg-primary/5"
        )}
      >
        {/* Image de couverture ou dégradé */}
        <div className="relative h-48 w-full overflow-hidden">
          {service.coverImage ? (
            <Image
              src={service.coverImage}
              alt={service.name}
              className="h-full w-full object-cover"
              width={500}
              height={300}
            />
          ) : (
            <div
              className={cn(
                "h-full w-full bg-gradient-to-br",
                getGradientForId(service.id),
                "flex items-center justify-center"
              )}
            >
              <Wrench className="h-16 w-16 text-white/80" />
            </div>
          )}
          {service.isFeatured && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500">
                <Star className="h-3 w-3 mr-1 fill-current" />À la une
              </Badge>
            </div>
          )}
          <div className="absolute top-2 right-2">
            {getStatusBadge(service.status, service.isActive)}
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                <Wrench className="h-5 w-5 text-primary" />
                {service.name}
              </CardTitle>
              {service.category && (
                <Badge variant="outline" className="mt-2">
                  {service.category}
                </Badge>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <div className="text-lg font-semibold text-primary">
                  {formatPrice(
                    service.price,
                    service.priceType,
                    service.currency,
                    service.unit
                  )}
                </div>
                {service.duration && (
                  <div className="text-xs text-muted-foreground">
                    Durée: {Math.floor(service.duration / 60)}h
                    {service.duration % 60 > 0
                      ? ` ${service.duration % 60}min`
                      : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-3 flex-1">
            {(service.summary || service.description) && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {service.summary || service.description}
              </p>
            )}

            {service.requiresBooking && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                Réservation requise
              </Badge>
            )}

            {service.tags && service.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {service.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Tag className="h-2 w-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {service.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{service.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {service.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {service.bookingCount} réservations
                </span>
              </div>
              <span>
                {new Date(service.updatedAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const renderOfferCard = (offer: Offer) => {
    const isActive = offer.status === "ACTIVE" && offer.isActive;
    const isExpired = offer.endDate && new Date(offer.endDate) < new Date();
    const daysLeft = offer.endDate
      ? Math.ceil(
          (new Date(offer.endDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    return (
      <Link key={offer.id} href={`/offres/${offer.slug}`}>
        <Card
          className={cn(
            "group transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden h-full flex flex-col",
            isActive && !isExpired && "border-orange-200 bg-orange-50/50"
          )}
        >
          {/* Image de couverture ou dégradé */}
          <div className="relative h-48 w-full overflow-hidden">
            {offer.coverImage ? (
              <Image
                src={offer.coverImage}
                alt={offer.title}
                className="h-full w-full object-cover"
                width={500}
                height={300}
              />
            ) : (
              <div
                className={cn(
                  "h-full w-full bg-gradient-to-br",
                  getGradientForId(offer.id),
                  "flex items-center justify-center"
                )}
              >
                <Tag className="h-16 w-16 text-white/80" />
              </div>
            )}
            {offer.type === "LIMITED_TIME" && (
              <div className="absolute top-2 left-2">
                <Badge variant="destructive">
                  <Clock className="h-3 w-3 mr-1" />
                  Temps limité
                </Badge>
              </div>
            )}
            <div className="absolute top-2 right-2">
              {getStatusBadge(offer.status, offer.isActive)}
            </div>
            {daysLeft !== null && daysLeft > 0 && (
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-black/70 text-white hover:bg-black/70">
                  {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant
                  {daysLeft > 1 ? "s" : ""}
                </Badge>
              </div>
            )}
          </div>

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Tag className="h-5 w-5 text-orange-600" />
                  {offer.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={
                      offer.type === "LIMITED_TIME"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {offer.type.replace("_", " ")}
                  </Badge>
                  {offer.code && (
                    <Badge variant="outline" className="font-mono">
                      {offer.code}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className="text-lg font-semibold text-orange-600">
                    {offer.discountType === "PERCENTAGE" &&
                      `${offer.discountValue}%`}
                    {offer.discountType === "FIXED_AMOUNT" &&
                      formatPrice(
                        offer.discountValue,
                        "FIXED",
                        offer.discountMaxAmount ? "EUR" : undefined
                      )}
                    {offer.discountType === "FREE_SHIPPING" &&
                      "Livraison offerte"}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-3 flex-1">
              {(offer.summary || offer.description) && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {offer.summary || offer.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {offer.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {offer.useCount} utilisations
                  </span>
                </div>
                {offer.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Jusqu&apos;au{" "}
                    {new Date(offer.endDate).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Produits, Services & Offres</h2>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Services</p>
                <p className="text-2xl font-bold">{totalServices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Offres actives</p>
                <p className="text-2xl font-bold">{totalOffers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres par catégorie */}
      {allCategories.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">
                Filtrer par catégorie :
              </span>
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Toutes
              </Button>
              {allCategories.map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            Tout ({totalProducts + totalServices + totalOffers})
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produits ({filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Services ({filteredServices.length})
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Offres ({totalOffers})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-4">
          {/* Offres actives en premier */}
          {offers.filter((o) => o.status === "ACTIVE" && o.isActive).length >
            0 && (
            <>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Tag className="h-5 w-5 text-orange-600" />
                Offres en cours
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
                {offers
                  .filter((o) => o.status === "ACTIVE" && o.isActive)
                  .map(renderOfferCard)}
              </div>
              <Separator />
            </>
          )}

          {/* Produits */}
          {filteredProducts.length > 0 && (
            <>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Produits
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
                {filteredProducts.slice(0, 6).map(renderProductCard)}
              </div>
              {filteredProducts.length > 6 && (
                <div className="text-center">
                  <Button variant="outline">
                    Voir tous les produits ({filteredProducts.length})
                  </Button>
                </div>
              )}
              <Separator />
            </>
          )}

          {/* Services */}
          {filteredServices.length > 0 && (
            <>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Wrench className="h-5 w-5 text-green-600" />
                Services
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
                {filteredServices.slice(0, 6).map(renderServiceCard)}
              </div>
              {filteredServices.length > 6 && (
                <div className="text-center">
                  <Button variant="outline">
                    Voir tous les services ({filteredServices.length})
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Message si aucun contenu */}
          {totalProducts === 0 && totalServices === 0 && totalOffers === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucun produit ou service
              </h3>
              <p className="text-muted-foreground">
                Ce lieu n'a pas encore ajouté de produits ou services.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="mt-6 space-y-4">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
              {filteredProducts.map(renderProductCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit</h3>
              <p className="text-muted-foreground">
                {selectedCategory
                  ? `Aucun produit dans la catégorie "${selectedCategory}"`
                  : "Aucun produit disponible pour le moment"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-6 space-y-4">
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
              {filteredServices.map(renderServiceCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun service</h3>
              <p className="text-muted-foreground">
                {selectedCategory
                  ? `Aucun service dans la catégorie "${selectedCategory}"`
                  : "Aucun service disponible pour le moment"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="offers" className="mt-6 space-y-4">
          {offers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
              {offers.map(renderOfferCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune offre</h3>
              <p className="text-muted-foreground">
                Aucune offre disponible pour le moment
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
