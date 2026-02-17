import { Metadata } from "next";
import { notFound } from "next/navigation";
import { OfferPageContent } from "./_components/offer-page-content";
import { prisma } from "@/lib/prisma";

interface OfferPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: OfferPageProps): Promise<Metadata> {
  const { slug } = params;

  const offer = await prisma.offer.findFirst({
    where: {
      slug,
      status: "ACTIVE",
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

  if (!offer) {
    return {
      title: "Offre non trouvée",
    };
  }

  return {
    title: `${offer.title} - ${offer.place.name}`,
    description: offer.summary || offer.description?.substring(0, 160),
    openGraph: {
      title: `${offer.title} - ${offer.place.name}`,
      description: offer.summary || offer.description?.substring(0, 160),
      images: offer.coverImage ? [offer.coverImage] : undefined,
    },
  };
}

export default async function OfferPage({ params }: OfferPageProps) {
  const { slug } = params;

  const offer = await prisma.offer.findFirst({
    where: {
      slug,
      status: "ACTIVE",
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

  if (!offer) {
    notFound();
  }

  // Incrémenter le compteur de vues
  await prisma.offer.update({
    where: { id: offer.id },
    data: { viewCount: { increment: 1 } },
  });

  // Normalize Prisma nullable fields (null) to undefined to satisfy the Offer type
  const normalizedOffer = {
    ...offer,
    // convert nullable coverImage (string | null) to string | undefined to match Offer type
    coverImage: offer.coverImage ?? undefined,
    summary: offer.summary ?? undefined,
    description: offer.description ?? undefined,
    // Prisma returns JsonValue | null for JSON columns; convert to string | undefined
    images:
      offer.images === null
        ? undefined
        : typeof offer.images === "string"
          ? offer.images
          : JSON.stringify(offer.images),
    place: {
      ...offer.place,
      email: offer.place?.email ?? undefined,
      phone: offer.place?.phone ?? undefined,
      website: offer.place?.website ?? undefined,
    },
  };

  return <OfferPageContent offer={normalizedOffer} />;
}
