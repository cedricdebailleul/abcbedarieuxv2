"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ProductForm } from "@/components/forms/product-form";
import Link from "next/link";
import { toast } from "sonner";

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
  metaTitle?: string;
  metaDescription?: string;
  place: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ProductEditFormProps {
  productId: string;
}

export function ProductEditForm({ productId }: ProductEditFormProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchProduct() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${productId}`);

        if (!response.ok) {
          throw new Error("Produit non trouvé");
        }

        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleSuccess = () => {
    toast.success("Produit mis à jour avec succès !");
    router.push("/dashboard/products-services/manage");
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du produit...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !product) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive mb-4">
            {error || "Produit non trouvé"}
          </p>
          <Button asChild>
            <Link href="/dashboard/products-services/manage">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Modifier le produit : {product.name}</CardTitle>
          <Button variant="outline" asChild>
            <Link href="/dashboard/products-services/manage">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ProductForm
          placeId={product.place.id}
          placeName={product.place.name}
          initialData={{
            ...product,
            // Ensure priceType matches the expected literal union for the form
            priceType:
              typeof product.priceType === "string" &&
              (
                ["FIXED", "VARIABLE", "ON_REQUEST", "FREE"] as readonly string[]
              ).includes(product.priceType)
                ? (product.priceType as
                    | "FIXED"
                    | "VARIABLE"
                    | "ON_REQUEST"
                    | "FREE")
                : undefined,
            // Ensure status matches the form's expected literal union
            status:
              typeof product.status === "string" &&
              (
                [
                  "DRAFT",
                  "PUBLISHED",
                  "OUT_OF_STOCK",
                  "DISCONTINUED",
                  "ARCHIVED",
                ] as readonly string[]
              ).includes(product.status)
                ? (product.status as
                    | "DRAFT"
                    | "PUBLISHED"
                    | "OUT_OF_STOCK"
                    | "DISCONTINUED"
                    | "ARCHIVED")
                : undefined,
            // Normalize tags to a string for the form (if tags can be an array)
            tags: Array.isArray(product.tags)
              ? product.tags.join(", ")
              : product.tags,
            // Normalize images to string[] as expected by the form
            images: Array.isArray(product.images)
              ? product.images
              : product.images
                ? [product.images]
                : undefined,
          }}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          isEditing
        />
      </CardContent>
    </Card>
  );
}
