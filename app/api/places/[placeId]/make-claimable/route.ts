import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { headers } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: { placeId: string } }
) {
  try {
    // Vérifier l'authentification
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const placeId = params.placeId;
    if (!placeId) {
      return NextResponse.json({ error: "ID de place manquant" }, { status: 400 });
    }

    // Vérifier que l'utilisateur est admin
    if (safeUserCast(session.user).role !== "admin") {
      return NextResponse.json({ error: "Seuls les administrateurs peuvent effectuer cette action" }, { status: 403 });
    }

    // Récupérer la place et vérifier la propriété
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!place) {
      return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
    }

    // Vérifier que l'admin est bien le propriétaire de la place
    if (place.ownerId !== session.user.id) {
      return NextResponse.json({ 
        error: "Vous ne pouvez mettre en revendication que vos propres places" 
      }, { status: 403 });
    }

    // Vérifier que la place n'est pas déjà sans propriétaire
    if (!place.ownerId) {
      return NextResponse.json({ 
        error: "Cette place est déjà disponible pour revendication" 
      }, { status: 400 });
    }

    // Mettre la place à disposition pour revendication
    // - Retirer le propriétaire (ownerId = null)
    // - Marquer comme non vérifiée pour qu'un nouveau propriétaire doive la valider
    // - Garder le statut actuel pour ne pas perturber la visibilité
    const updatedPlace = await prisma.place.update({
      where: { id: placeId },
      data: {
        ownerId: null,
        isVerified: false,
        claimedAt: null, // Réinitialiser la date de revendication
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`Place ${place.name} mise à disposition pour revendication par l'admin ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Place mise à disposition pour revendication avec succès",
      place: updatedPlace
    });

  } catch (error) {
    console.error("Erreur lors de la mise à disposition de la place:", error);
    
    // Retourner plus de détails sur l'erreur pour le debug
    const errorMessage = error instanceof Error ? error.message : "Erreur interne du serveur";
    return NextResponse.json(
      { 
        error: "Erreur lors de la mise à disposition de la place",
        details: errorMessage,
        debug: error instanceof Error ? error.stack : error
      },
      { status: 500 }
    );
  }
}