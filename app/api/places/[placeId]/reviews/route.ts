import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerReviewCreationBadges } from "@/lib/services/badge-trigger-service";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).optional().or(z.literal("")),
});

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
        { error: "Vous devez être connecté pour laisser un avis" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validation des données
    const validation = reviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { rating, comment } = validation.data;

    // Vérifier que la place existe
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true, name: true },
    });

    if (!place) {
      return NextResponse.json({ error: "Lieu non trouvé" }, { status: 404 });
    }

    // Vérifier si l'utilisateur a déjà laissé un avis pour cette place
    const existingReview = await prisma.review.findFirst({
      where: {
        placeId: placeId,
        userId: session.user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Vous avez déjà laissé un avis pour ce lieu" },
        { status: 400 }
      );
    }

    // Créer l'avis
    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        placeId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Déclencher l'évaluation des badges pour la création d'avis
    await triggerReviewCreationBadges(session.user.id, review.id).catch((error) => {
      console.error('Error triggering review creation badges:', error);
      // Ne pas faire échouer la création d'avis si les badges échouent
    });

    return NextResponse.json({
      success: true,
      message: "Avis ajouté avec succès",
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          name: review.user.name,
        },
      },
    });
  } catch (error) {
    console.error("Erreur API avis:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
        { error: "Vous devez être connecté pour modifier un avis" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validation des données
    const validation = reviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { rating, comment } = validation.data;

    // Vérifier que la place existe
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true, name: true },
    });

    if (!place) {
      return NextResponse.json({ error: "Lieu non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a bien un avis existant pour cette place
    const existingReview = await prisma.review.findFirst({
      where: {
        placeId: placeId,
        userId: session.user.id,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Aucun avis trouvé à modifier" },
        { status: 404 }
      );
    }

    // Mettre à jour l'avis
    const updatedReview = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        comment: comment || null,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Avis mis à jour avec succès",
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt,
        user: {
          name: updatedReview.user.name,
        },
      },
    });
  } catch (error) {
    console.error("Erreur API modification avis:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await context.params;

    // Récupérer tous les avis pour cette place
    const reviews = await prisma.review.findMany({
      where: { placeId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Erreur récupération avis:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
