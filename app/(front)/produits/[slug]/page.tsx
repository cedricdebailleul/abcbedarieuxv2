import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPageContent } from "./_components/product-page-content";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = params;

  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      isActive: true,
    },
    include: {
      place: {
        select: {
          name: true,
          city: true,
        },
      },
    },
  });

  if (!product) {
    return {
      title: "Produit non trouvé",
    };
  }

  return {
    title: `${product.name} - ${product.place.name}`,
    description: product.summary || product.description?.substring(0, 160),
    openGraph: {
      title: `${product.name} - ${product.place.name}`,
      description: product.summary || product.description?.substring(0, 160),
      images: product.coverImage ? [product.coverImage] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = params;

  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      isActive: true,
    },
    include: {
      place: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          type: true,
          phone: true,
          email: true,
          website: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Incrémenter le compteur de vues
  await prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  });
  // Normalize nullable DB fields to match frontend types (convert null -> undefined)
  type ProductWithPlace = Prisma.ProductGetPayload<{
    include: {
      place: {
        select: {
          id: true;
          name: true;
          slug: true;
          city: true;
          type: true;
          phone: true;
          email: true;
          website: true;
        };
      };
    };
  }>;

  type SanitizedProduct = Omit<
    ProductWithPlace,
    | "description"
    | "summary"
    | "coverImage"
    | "price"
    | "unit"
    | "stock"
    | "minQuantity"
    | "maxQuantity"
    | "images"
    | "category"
    | "tags"
    | "specifications"
    | "place"
  > & {
    // Make place optional/undefined and convert nested nullable fields to optional
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
    description?: string;
    summary?: string;
    coverImage?: string;
    price?: number;
    unit?: string;
    stock?: number;
    minQuantity?: number;
    maxQuantity?: number;
    images?: string;
    category?: string;
    tags?: string;
    specifications?: Record<string, unknown>;
  };
  const { place: dbPlace, ...rest } = product;
  const sanitizedProduct: SanitizedProduct = {
    ...rest,
    // Normalize nested nullable place fields to undefined so they match the frontend types
    place:
      dbPlace == null
        ? undefined
        : {
            ...dbPlace,
            type: dbPlace.type ? String(dbPlace.type) : undefined,
            phone: dbPlace.phone ?? undefined,
            email: dbPlace.email ?? undefined,
            website: dbPlace.website ?? undefined,
          },
    description: product.description ?? undefined,
    summary: product.summary ?? undefined,
    coverImage: product.coverImage ?? undefined,
    price: product.price ?? undefined,
    unit: product.unit ?? undefined,
    stock: product.stock ?? undefined,
    minQuantity: product.minQuantity ?? undefined,
    maxQuantity: product.maxQuantity ?? undefined,
    category: product.category ?? undefined,
    images:
      product.images == null
        ? undefined
        : typeof product.images === "string"
          ? product.images
          : JSON.stringify(product.images),
    tags:
      product.tags == null
        ? undefined
        : typeof product.tags === "string"
          ? product.tags
          : JSON.stringify(product.tags),
    specifications:
      product.specifications == null
        ? undefined
        : typeof product.specifications === "object" &&
            !Array.isArray(product.specifications)
          ? (product.specifications as Record<string, unknown>)
          : typeof product.specifications === "string"
            ? (() => {
                try {
                  const parsed = JSON.parse(product.specifications as string);
                  return typeof parsed === "object" && !Array.isArray(parsed)
                    ? (parsed as Record<string, unknown>)
                    : undefined;
                } catch {
                  return undefined;
                }
              })()
            : undefined,
  };

  return <ProductPageContent product={sanitizedProduct} />;
}
