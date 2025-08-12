import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;

    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que la place existe
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: { 
        id: true, 
        name: true, 
        googleBusinessData: true,
        ownerId: true 
      },
    });

    if (!place) {
      return NextResponse.json(
        { error: "Place non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier les permissions (propriétaire ou admin)
    const isOwner = place.ownerId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Récupérer les avis Google depuis googleBusinessData
    const googleReviews = place.googleBusinessData?.reviews || [];
    
    // Debug: voir ce qui est disponible
    console.log('🔍 googleBusinessData keys:', Object.keys(place.googleBusinessData || {}));
    console.log('🔍 reviews found:', googleReviews.length);
    console.log('🔍 rating info:', {
      rating: place.googleBusinessData?.rating,
      user_ratings_total: place.googleBusinessData?.user_ratings_total
    });

    if (!Array.isArray(googleReviews) || googleReviews.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Aucun avis Google trouvé dans googleBusinessData. Champs disponibles: ${Object.keys(place.googleBusinessData || {}).join(', ')}`,
        imported: 0,
        skipped: 0,
        errors: []
      });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const review of googleReviews) {
      try {
        // Générer un ID unique basé sur les données Google
        const googleReviewId = `${placeId}_${review.author_name}_${review.time}`;

        // Vérifier si l'avis existe déjà
        const existingReview = await prisma.googleReview.findUnique({
          where: { googleReviewId },
        });

        if (existingReview) {
          skipped++;
          continue;
        }

        // Créer l'avis Google
        await prisma.googleReview.create({
          data: {
            placeId,
            rating: review.rating || 5,
            comment: review.text || null,
            googleReviewId,
            authorName: review.author_name || "Utilisateur anonyme",
            authorUrl: review.author_url || null,
            googleTime: review.time || Math.floor(Date.now() / 1000),
            relativeTime: review.relative_time_description || null,
          },
        });

        imported++;
      } catch (error) {
        console.error(`Erreur import avis ${review.author_name}:`, error);
        errors.push(`Erreur pour ${review.author_name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    // Mettre à jour les statistiques de la place
    if (imported > 0) {
      const stats = await prisma.googleReview.aggregate({
        where: { placeId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { id: true },
      });

      await prisma.place.update({
        where: { id: placeId },
        data: {
          rating: stats._avg.rating || 0,
          reviewCount: (place.googleBusinessData?.user_ratings_total || 0) + stats._count.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Import terminé: ${imported} avis importés, ${skipped} ignorés`,
      imported,
      skipped,
      errors,
    });

  } catch (error) {
    console.error("Erreur lors de l'import des avis:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}