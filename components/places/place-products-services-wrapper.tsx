"use client";

import { useEffect, useState } from "react";
import { PlaceProductsServicesTab } from "./place-products-services-tab";

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
  image?: string;
  viewCount: number;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductsServicesData {
  products: Product[];
  services: Service[];
  offers: Offer[];
  summary: {
    totalProducts: number;
    totalServices: number;
    totalOffers: number;
    featuredProducts: number;
    featuredServices: number;
  };
}

interface PlaceProductsServicesWrapperProps {
  placeId: string;
  placeName: string;
  isOwner?: boolean;
}

export function PlaceProductsServicesWrapper({
  placeId,
  placeName,
  isOwner = false,
}: PlaceProductsServicesWrapperProps) {
  const [data, setData] = useState<ProductsServicesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/places/${placeId}/products-services`
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des données");
        }

        const result = await response.json();

        // Parse JSON strings safely for tags and images
        const parseJsonSafely = (jsonString?: string): unknown[] => {
          if (!jsonString) return [];
          try {
            const parsed = JSON.parse(jsonString);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            console.warn("Invalid JSON data:", jsonString);
            return [];
          }
        };

        // Transform the data to parse JSON strings
        const transformedResult = {
          ...result,
          products:
            result.products?.map((product: unknown) => {
              const p = product as Record<string, unknown>;
              return {
                ...(p as unknown as Product),
                tags: parseJsonSafely(
                  typeof p.tags === "string" ? (p.tags as string) : undefined
                ),
                images: parseJsonSafely(
                  typeof p.images === "string"
                    ? (p.images as string)
                    : undefined
                ),
              };
            }) || [],
          services:
            result.services?.map((service: unknown) => {
              const s = service as Record<string, unknown>;
              return {
                ...(s as unknown as Service),
                tags: parseJsonSafely(
                  typeof s.tags === "string" ? (s.tags as string) : undefined
                ),
                images: parseJsonSafely(
                  typeof s.images === "string"
                    ? (s.images as string)
                    : undefined
                ),
              };
            }) || [],
          offers:
            result.offers?.map((offer: unknown) => {
              const o = offer as Record<string, unknown>;
              return {
                ...(o as unknown as Offer),
                tags: parseJsonSafely(
                  typeof o.tags === "string" ? (o.tags as string) : undefined
                ),
                images: parseJsonSafely(
                  typeof o.images === "string"
                    ? (o.images as string)
                    : undefined
                ),
              };
            }) || [],
        };

        setData(transformedResult);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (placeId) {
      fetchData();
    }
  }, [placeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Erreur de chargement</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <PlaceProductsServicesTab
      placeId={placeId}
      placeName={placeName}
      products={data.products}
      services={data.services}
      offers={data.offers}
      isOwner={isOwner}
    />
  );
}
