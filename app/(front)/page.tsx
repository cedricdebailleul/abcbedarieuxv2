import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getFeaturedPlacesAction } from "@/actions/place";
import { PlacePreviewCard } from "@/components/places/place-preview-card";
import { Button } from "@/components/ui/button";
import { InteractiveMap } from "@/components/map/interactive-map";
import { MapSkeleton } from "@/components/map/map-skeleton";
import { WhatsAppButton } from "@/components/whatsapp/whatsapp-button";
import { prisma } from "@/lib/prisma";
import { PlaceStatus } from "@/lib/generated/prisma/client";
import { siteConfig } from "@/lib/site.config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bédarieux – Commerces, Artisans & Services",
  description:
    "Découvrez les commerces, artisans et services de Bédarieux. Annuaire local et carte interactive des établissements du Haut-Languedoc.",
  keywords: [
    "Bédarieux",
    "commerces Bédarieux",
    "artisans Bédarieux",
    "Haut-Languedoc",
    "Hérault",
    "annuaire local",
  ],
  alternates: {
    canonical: siteConfig.baseUrl,
  },
  openGraph: {
    title: "Bédarieux – Commerces, Artisans & Services",
    description:
      "Découvrez les commerces, artisans et services de Bédarieux sur la carte interactive.",
    url: siteConfig.baseUrl,
    type: "website",
  },
};

async function getMapData() {
  const [places, categories] = await Promise.all([
    prisma.place.findMany({
      where: {
        status: { in: [PlaceStatus.ACTIVE, PlaceStatus.PENDING] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        summary: true,
        presenceType: true,
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
        updatedAt: true,
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
                  },
                },
              },
            },
          },
        },
        openingHours: {
          select: {
            dayOfWeek: true,
            isClosed: true,
            openTime: true,
            closeTime: true,
          },
          orderBy: { dayOfWeek: "asc" },
        },
        reviews: {
          select: { rating: true },
          where: { status: "APPROVED" },
        },
        googleReviews: {
          select: { rating: true },
          where: { status: "APPROVED" },
        },
        _count: {
          select: {
            reviews: true,
            googleReviews: { where: { status: "APPROVED" } },
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    }),
    prisma.placeCategory.findMany({
      where: { isActive: true, parentId: null },
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
                  where: { place: { status: PlaceStatus.ACTIVE, isActive: true } },
                },
              },
            },
          },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            places: {
              where: { place: { status: PlaceStatus.ACTIVE, isActive: true } },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return { places, categories };
}

async function MapSection() {
  const { places, categories } = await getMapData();
  return <InteractiveMap places={places} categories={categories} />;
}

export default async function Home() {
  const featuredPlacesResult = await getFeaturedPlacesAction(6);
  const featuredPlaces = featuredPlacesResult.success
    ? featuredPlacesResult.data!
    : [];

  return (
    <>
      {/* Section carte interactive */}
      <section className="h-[calc(100vh-4rem)] overflow-hidden">
        <Suspense fallback={<MapSkeleton />}>
          <MapSection />
        </Suspense>
      </section>

      {/* Section des établissements en vedette */}
      {featuredPlaces.length > 0 && (
        <section className="py-8 sm:py-16 container mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Établissements en vedette
              </h2>
              <p className="text-muted-foreground">
                Découvrez les commerces et services mis en avant à Bédarieux
              </p>
            </div>
            <Button asChild variant="outline" className="self-start sm:self-auto">
              <Link href="/places">
                <MapPin className="size-4 mr-2" />
                Voir tous les établissements
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPlaces.map((place) => (
              <PlacePreviewCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}

      <WhatsAppButton />
    </>
  );
}
