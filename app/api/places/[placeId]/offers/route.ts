import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const offerSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  summary: z.string().max(280).optional(),
  type: z
    .enum([
      "DISCOUNT",
      "FREEBIE",
      "BUNDLE",
      "LOYALTY",
      "SEASONAL",
      "LIMITED_TIME",
    ])
    .default("DISCOUNT"),
  discountType: z
    .enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING", "BUY_X_GET_Y"])
    .default("PERCENTAGE"),
  discountValue: z.number().min(0, "La valeur de remise doit être positive"),
  discountMaxAmount: z.number().min(0).optional(),
  minimumPurchase: z.number().min(0).optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"])
    .default("DRAFT"),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxUses: z.number().int().min(1).optional(),
  maxUsesPerUser: z.number().int().min(1).default(1).optional(),
  code: z.string().optional(),
  requiresCode: z.boolean().default(false),
  image: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await context.params;

    const offers = await prisma.offer.findMany({
      where: {
        placeId,
        status: { not: "ARCHIVED" },
      },
      orderBy: [
        { status: "asc" }, // ACTIVE first
        { endDate: "asc" }, // Expiring soon first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Erreur récupération offres:", error);
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
        { error: "Vous devez être connecté pour créer une offre" },
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
      !["admin", "moderator"].includes(safeUserCast(session.user).role || "")
    ) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à créer des offres pour ce lieu" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validation des données
    const validation = offerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const offerData = validation.data;

    // Vérifier les dates si fournies
    if (offerData.startDate && offerData.endDate) {
      const start = new Date(offerData.startDate);
      const end = new Date(offerData.endDate);
      if (start >= end) {
        return NextResponse.json(
          { error: "La date de fin doit être postérieure à la date de début" },
          { status: 400 }
        );
      }
    }

    // Vérifier l'unicité du code si fourni
    if (offerData.code) {
      const existingOffer = await prisma.offer.findFirst({
        where: {
          code: offerData.code,
          placeId,
          status: { not: "ARCHIVED" },
        },
      });

      if (existingOffer) {
        return NextResponse.json(
          { error: "Ce code promotionnel est déjà utilisé" },
          { status: 400 }
        );
      }
    }

    // Générer un slug unique
    const baseSlug = offerData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (await prisma.offer.findFirst({ where: { slug, placeId } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Créer l'offre
    const offer = await prisma.offer.create({
      data: {
        ...offerData,
        slug,
        placeId,
        startDate: offerData.startDate ? new Date(offerData.startDate) : null,
        endDate: offerData.endDate ? new Date(offerData.endDate) : null,
        // Valeurs par défaut pour assurer la visibilité
        isActive: offerData.isActive ?? true,
        status: offerData.status ?? "ACTIVE",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Offre créée avec succès",
        offer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur API création offre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
