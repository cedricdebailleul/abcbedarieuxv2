import { Suspense } from "react";
import type { Metadata } from "next";
import { InteractiveMap } from "@/components/map/interactive-map";
import { MapSkeleton } from "@/components/map/map-skeleton";
import { prisma } from "@/lib/prisma";
import { PlaceStatus } from "@/lib/generated/prisma";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Carte interactive - ABC Bédarieux",
  description: "Découvrez tous les établissements de Bédarieux sur notre carte interactive. Recherchez par catégorie, distance et mots-clés.",
  openGraph: {
    title: "Carte interactive - ABC Bédarieux",
    description: "Découvrez tous les établissements de Bédarieux sur notre carte interactive",
    url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/carte`,
    siteName: 'ABC Bédarieux',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/images/og-map.jpg`,
        width: 1200,
        height: 630,
        alt: 'Carte interactive ABC Bédarieux',
      },
    ],
  },
};

async function getMapData() {
  // Récupérer les places actives avec leurs catégories
  const places = await prisma.place.findMany({
    where: {
      status: { in: [PlaceStatus.ACTIVE, PlaceStatus.PENDING] },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      summary: true,
      street: true,
      streetNumber: true,
      postalCode: true,
      city: true,
      latitude: true,
      longitude: true,
      phone: true,
      email: true,
      website: true,
      facebook: true,
      instagram: true,
      twitter: true,
      linkedin: true,
      tiktok: true,
      coverImage: true,
      logo: true,
      isFeatured: true,
      ownerId: true,
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true,
              parent: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  icon: true,
                  color: true,
                }
              }
            }
          }
        }
      },
      openingHours: {
        select: {
          dayOfWeek: true,
          isClosed: true,
          openTime: true,
          closeTime: true,
        },
        orderBy: { dayOfWeek: "asc" }
      },
      reviews: {
        select: { rating: true },
        where: { status: "APPROVED" }
      },
      googleReviews: {
        select: { rating: true },
        where: { status: "APPROVED" }
      },
      _count: {
        select: {
          reviews: true,
          googleReviews: { where: { status: "APPROVED" } }
        }
      }
    },
    orderBy: [
      { isFeatured: "desc" },
      { name: "asc" }
    ]
  });

  // Récupérer les catégories principales avec leurs enfants
  const categories = await prisma.placeCategory.findMany({
    where: { 
      isActive: true,
      parentId: null // Seulement les catégories principales
    },
    include: {
      children: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
          _count: {
            select: {
              places: {
                where: {
                  place: {
                    status: PlaceStatus.ACTIVE,
                    isActive: true
                  }
                }
              }
            }
          }
        },
        orderBy: { name: "asc" }
      },
      _count: {
        select: {
          places: {
            where: {
              place: {
                status: PlaceStatus.ACTIVE,
                isActive: true
              }
            }
          }
        }
      }
    },
    orderBy: { sortOrder: "asc" }
  });

  return { places, categories };
}

export default async function MapPage() {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      <Suspense fallback={<MapSkeleton />}>
        <MapContent />
      </Suspense>
    </div>
  );
}

async function MapContent() {
  const { places, categories } = await getMapData();

  return (
    <InteractiveMap
      places={places}
      categories={categories}
    />
  );
}