"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Wrench,
  Tag,
  MapPin,
  Plus,
  Edit3,
  Eye,
  Search,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Place {
  id: string;
  name: string;
  city: string;
  type: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price?: number;
  priceType: string;
  currency: string;
  unit?: string;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  stock?: number;
  category?: string;
  viewCount: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
  place: {
    id: string;
    name: string;
    city: string;
  };
}

interface Service {
  id: string;
  name: string;
  slug: string;
  price?: number;
  priceType: string;
  currency: string;
  unit?: string;
  duration?: number;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  requiresBooking: boolean;
  category?: string;
  viewCount: number;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
  place: {
    id: string;
    name: string;
    city: string;
  };
}

interface Offer {
  id: string;
  title: string;
  slug: string;
  type: string;
  discountType: string;
  discountValue: number;
  status: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  currentUses: number;
  code?: string;
  viewCount: number;
  useCount: number;
  createdAt: string;
  updatedAt: string;
  place: {
    id: string;
    name: string;
    city: string;
  };
}

export function ProductsServicesManager() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Charger les lieux
        const placesResponse = await fetch("/api/dashboard/user-places");
        if (placesResponse.ok) {
          const placesData = await placesResponse.json();
          setPlaces(placesData.places || []);
        }

        // Charger tous les produits/services/offres de l'utilisateur
        const [productsRes, servicesRes, offersRes] = await Promise.all([
          fetch("/api/dashboard/user-products"),
          fetch("/api/dashboard/user-services"),
          fetch("/api/dashboard/user-offers"),
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.products || []);
        }

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServices(servicesData.services || []);
        }

        if (offersRes.ok) {
          const offersData = await offersRes.json();
          setOffers(offersData.offers || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatPrice = (
    price?: number,
    priceType?: string,
    currency = "EUR",
    unit?: string
  ) => {
    if (!price || priceType === "FREE") return "Gratuit";
    if (priceType === "ON_REQUEST") return "Sur demande";

    const formattedPrice = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(price);

    return unit ? `${formattedPrice}${unit}` : formattedPrice;
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactif</Badge>;
    }

    switch (status) {
      case "PUBLISHED":
      case "ACTIVE":
        return (
          <Badge variant="default" className="bg-green-600">
            Actif
          </Badge>
        );
      case "DRAFT":
        return <Badge variant="outline">Brouillon</Badge>;
      case "OUT_OF_STOCK":
        return <Badge variant="destructive">Rupture</Badge>;
      case "UNAVAILABLE":
        return <Badge variant="destructive">Indisponible</Badge>;
      case "PAUSED":
        return <Badge variant="secondary">En pause</Badge>;
      case "EXPIRED":
        return <Badge variant="outline">Expirée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filterItems = <
    T extends {
      place: { id: string };
      status: string;
      name?: string;
      title?: string;
    },
  >(
    items: T[]
  ) => {
    return items.filter((item) => {
      const matchesPlace =
        selectedPlace === "all" || item.place.id === selectedPlace;
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      const name = "name" in item ? item.name : item.title;
      const matchesSearch =
        searchTerm === "" ||
        name?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesPlace && matchesStatus && matchesSearch;
    });
  };

  const filteredProducts = filterItems(products);
  const filteredServices = filterItems(services);
  const filteredOffers = filterItems(offers);

  const totalStats = {
    products: products.length,
    services: services.length,
    offers: offers.length,
    places: places.length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">{totalStats.products}</p>
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
                <p className="text-2xl font-bold">{totalStats.services}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Offres</p>
                <p className="text-2xl font-bold">{totalStats.offers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Lieux</p>
                <p className="text-2xl font-bold">{totalStats.places}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedPlace} onValueChange={setSelectedPlace}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tous les lieux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les lieux</SelectItem>
                {places.map((place) => (
                  <SelectItem key={place.id} value={place.id}>
                    {place.name} ({place.city})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PUBLISHED">Publié</SelectItem>
                <SelectItem value="ACTIVE">Actif</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="PAUSED">En pause</SelectItem>
                <SelectItem value="EXPIRED">Expiré</SelectItem>
              </SelectContent>
            </Select>

            <Button asChild>
              <Link href="/dashboard/products-services" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
            Offres ({filteredOffers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-1">
                          {product.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {product.place.name}
                          </Badge>
                          {product.isFeatured && (
                            <Badge variant="secondary" className="text-xs">
                              Vedette
                            </Badge>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(product.status, product.isActive)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Prix
                        </span>
                        <span className="font-semibold">
                          {formatPrice(
                            product.price,
                            product.priceType,
                            product.currency,
                            product.unit
                          )}
                        </span>
                      </div>

                      {product.stock !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Stock
                          </span>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              product.stock === 0
                                ? "text-destructive"
                                : "text-foreground"
                            )}
                          >
                            {product.stock}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{product.viewCount} vues</span>
                        <span>{product.orderCount} commandes</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/places/${product.place.id}#produits`}>
                            <Eye className="h-3 w-3 mr-1" />
                            Voir
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <Link
                            href={`/dashboard/products-services/edit/product/${product.id}`}
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Modifier
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ||
                  selectedPlace !== "all" ||
                  statusFilter !== "all"
                    ? "Aucun produit ne correspond à vos critères de recherche."
                    : "Vous n'avez pas encore ajouté de produits."}
                </p>
                <Button asChild>
                  <Link href="/dashboard/products-services">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un produit
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <Card
                  key={service.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-1">
                          {service.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {service.place.name}
                          </Badge>
                          {service.isFeatured && (
                            <Badge variant="secondary" className="text-xs">
                              Vedette
                            </Badge>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(service.status, service.isActive)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Prix
                        </span>
                        <span className="font-semibold">
                          {formatPrice(
                            service.price,
                            service.priceType,
                            service.currency,
                            service.unit
                          )}
                        </span>
                      </div>

                      {service.duration && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Durée
                          </span>
                          <span className="text-sm">
                            {Math.floor(service.duration / 60)}h
                            {service.duration % 60 > 0
                              ? ` ${service.duration % 60}min`
                              : ""}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{service.viewCount} vues</span>
                        <span>{service.bookingCount} réservations</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/places/${service.place.id}#services`}>
                            <Eye className="h-3 w-3 mr-1" />
                            Voir
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <Link
                            href={`/dashboard/products-services/edit/service/${service.id}`}
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Modifier
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Aucun service trouvé
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ||
                  selectedPlace !== "all" ||
                  statusFilter !== "all"
                    ? "Aucun service ne correspond à vos critères de recherche."
                    : "Vous n'avez pas encore ajouté de services."}
                </p>
                <Button asChild>
                  <Link href="/dashboard/products-services">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un service
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="offers" className="mt-6">
          {filteredOffers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOffers.map((offer) => (
                <Card
                  key={offer.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-1">
                          {offer.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {offer.place.name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {offer.type}
                          </Badge>
                        </div>
                      </div>
                      {getStatusBadge(offer.status, offer.isActive)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Réduction
                        </span>
                        <span className="font-semibold text-orange-600">
                          {offer.discountType === "PERCENTAGE" &&
                            `${offer.discountValue}%`}
                          {offer.discountType === "FIXED_AMOUNT" &&
                            `${offer.discountValue}€`}
                          {offer.discountType === "FREE_SHIPPING" &&
                            "Livraison offerte"}
                        </span>
                      </div>

                      {offer.endDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Expire le
                          </span>
                          <span className="text-xs">
                            {new Date(offer.endDate).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{offer.viewCount} vues</span>
                        <span>{offer.useCount} utilisations</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/places/${offer.place.id}#offres`}>
                            <Eye className="h-3 w-3 mr-1" />
                            Voir
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <Link
                            href={`/dashboard/products-services/edit/offer/${offer.id}`}
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Modifier
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Aucune offre trouvée
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ||
                  selectedPlace !== "all" ||
                  statusFilter !== "all"
                    ? "Aucune offre ne correspond à vos critères de recherche."
                    : "Vous n'avez pas encore créé d'offres."}
                </p>
                <Button asChild>
                  <Link href="/dashboard/products-services">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une offre
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
