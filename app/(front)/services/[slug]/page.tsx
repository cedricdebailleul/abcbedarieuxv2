import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageContent } from "./_components/service-page-content";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

interface ServicePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = params;

  const service = await prisma.service.findFirst({
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

  if (!service) {
    return {
      title: "Service non trouvé",
    };
  }

  return {
    title: `${service.name} - ${service.place.name}`,
    description: service.summary || service.description?.substring(0, 160),
    openGraph: {
      title: `${service.name} - ${service.place.name}`,
      description: service.summary || service.description?.substring(0, 160),
      images: service.coverImage ? [service.coverImage] : undefined,
    },
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = params;

  const service = await prisma.service.findFirst({
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

  if (!service) {
    notFound();
  }

  // Incrémenter le compteur de vues
  await prisma.service.update({
    where: { id: service.id },
    data: { viewCount: { increment: 1 } },
  });

  // Sanitiser les données pour convertir null en undefined et typer correctement les champs JSON
  const { place: dbPlace, ...rest } = service;
  const sanitizedService = {
    ...rest,
    summary: service.summary ?? undefined,
    description: service.description ?? undefined,
    images:
      service.images == null
        ? undefined
        : typeof service.images === "string"
          ? service.images
          : JSON.stringify(service.images),
    coverImage: service.coverImage ?? undefined,
    tags:
      service.tags == null
        ? undefined
        : typeof service.tags === "string"
          ? service.tags
          : JSON.stringify(service.tags),
    price: service.price ?? undefined,
    currency: service.currency ?? undefined,
    unit: service.unit ?? undefined,
    duration: service.duration ?? undefined,
    category: service.category ?? undefined,
    place: {
      ...dbPlace,
      type: dbPlace.type ? String(dbPlace.type) : undefined,
      phone: dbPlace.phone ?? undefined,
      email: dbPlace.email ?? undefined,
      website: dbPlace.website ?? undefined,
    },
  };

  return <ServicePageContent service={sanitizedService} />;
}
