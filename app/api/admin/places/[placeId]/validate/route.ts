import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PlaceStatus } from "@/lib/generated/prisma";
import { notifyUserPlaceApproved, notifyUserPlaceRejected } from "@/lib/place-notifications";

const validateSchema = z.object({
  action: z.enum(["approve", "reject"]),
  message: z.string().optional(), // Message optionnel pour l'utilisateur
  adminNotes: z.string().optional(), // Notes internes admin
});

// POST /api/admin/places/[placeId]/validate - Valider ou rejeter une place
export async function POST(
  request: Request,
  { params }: { params: { placeId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { placeId } = await params;
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { action, message, adminNotes } = validateSchema.parse(body);
    
    // Vérifier que la place existe
    const existingPlace = await prisma.place.findUnique({
      where: { id: placeId },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    if (!existingPlace) {
      return NextResponse.json(
        { error: "Place non trouvée" },
        { status: 404 }
      );
    }
    
    // Déterminer le nouveau statut
    const newStatus = action === "approve" ? PlaceStatus.ACTIVE : PlaceStatus.INACTIVE;
    
    // Mettre à jour la place
    const updatedPlace = await prisma.place.update({
      where: { id: placeId },
      data: {
        status: newStatus,
        isVerified: action === "approve",
        // Ajouter un champ pour les notes admin si nécessaire
        // adminNotes: adminNotes,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // Envoyer email de notification à l'utilisateur (en arrière-plan)
    if (existingPlace.owner) {
      if (action === "approve") {
        notifyUserPlaceApproved(
          existingPlace.owner.email,
          existingPlace.name,
          message
        ).catch(error => {
          console.error("Erreur notification utilisateur:", error);
        });
      } else {
        notifyUserPlaceRejected(
          existingPlace.owner.email,
          existingPlace.name,
          message
        ).catch(error => {
          console.error("Erreur notification utilisateur:", error);
        });
      }
    }
    
    // Log de l'action admin
    console.log(`Place ${placeId} ${action}ed by admin ${session.user.id}`, {
      place: existingPlace.name,
      admin: session.user.email,
      message,
      adminNotes
    });
    
    return NextResponse.json({
      place: updatedPlace,
      message: action === "approve" 
        ? "Place approuvée avec succès"
        : "Place rejetée avec succès"
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Erreur lors de la validation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}