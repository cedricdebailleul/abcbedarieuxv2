import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { PrismaClient, Prisma } from "@/lib/generated/prisma";

// Create a direct Prisma client instance as fallback
const prisma = new PrismaClient();

const serviceSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  summary: z.string().max(280).optional(),
  price: z.number().min(0).optional(),
  priceType: z
    .enum(["FIXED", "HOURLY", "DAILY", "VARIABLE", "ON_REQUEST", "FREE"])
    .default("FIXED"),
  currency: z.string().default("EUR"),
  unit: z.string().optional(),
  duration: z.number().int().min(1).optional(), // Durée en minutes
  status: z
    .enum(["DRAFT", "PUBLISHED", "UNAVAILABLE", "DISCONTINUED", "ARCHIVED"])
    .default("DRAFT"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  requiresBooking: z.boolean().default(false),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  features: z.record(z.string(), z.any()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await context.params;

    const services = await prisma.service.findMany({
      where: {
        placeId,
        status: { not: "ARCHIVED" },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Erreur récupération services:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await context.params;

    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour ajouter un service" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire de la place
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: { ownerId: true, name: true },
    });

    if (!place) {
      return NextResponse.json({ error: "Lieu non trouvé" }, { status: 404 });
    }

    if (
      place.ownerId !== session.user.id &&
      !["admin", "moderator"].includes(session.user.role || "")
    ) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à ajouter des services à ce lieu" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validation des données
    const validation = serviceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const serviceData = validation.data;

    // Générer un slug unique
    const baseSlug = serviceData.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (await prisma.service.findFirst({ where: { slug, placeId } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Créer le service
    const service = await prisma.service.create({
      data: {
        ...serviceData,
        slug,
        placeId,
        // Valeurs par défaut pour assurer la visibilité
        isActive: serviceData.isActive ?? true,
        status: serviceData.status ?? "PUBLISHED",
        // Cast features to a Prisma-compatible JSON input type
        features: serviceData.features
          ? (serviceData.features as Prisma.InputJsonValue)
          : undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Service ajouté avec succès",
        service,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur API création service:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
