import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { ClaimStatus, PlaceStatus } from "@/lib/generated/prisma/client";
import {
  notifyUserClaimApproved,
  notifyUserClaimRejected,
} from "@/lib/place-notifications";
import { prisma } from "@/lib/prisma";

const processSchema = z.object({
  action: z.enum(["approve", "reject"]),
  adminMessage: z.string().optional(), // Message pour l'utilisateur
});

// POST /api/admin/claims/[claimId]/process - Traiter une revendication
export async function POST(
  request: Request,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { claimId } = params;

    if (!session?.user || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, adminMessage } = processSchema.parse(body);

    // Vérifier que la revendication existe
    const existingClaim = await prisma.placeClaim.findUnique({
      where: { id: claimId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        place: {
          include: {
            owner: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!existingClaim) {
      return NextResponse.json(
        { error: "Revendication non trouvée" },
        { status: 404 }
      );
    }

    if (existingClaim.status !== ClaimStatus.PENDING) {
      return NextResponse.json(
        { error: "Cette revendication a déjà été traitée" },
        { status: 400 }
      );
    }

    // Transaction pour traiter la revendication
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour la revendication
      const updatedClaim = await tx.placeClaim.update({
        where: { id: claimId },
        data: {
          status:
            action === "approve" ? ClaimStatus.APPROVED : ClaimStatus.REJECTED,
          processedBy: session.user.id,
          processedAt: new Date(),
          adminMessage,
        },
      });

      let updatedPlace = null;

      // Si approuvé, attribuer la place à l'utilisateur
      if (action === "approve") {
        updatedPlace = await tx.place.update({
          where: { id: existingClaim.placeId },
          data: {
            ownerId: existingClaim.userId,
            claimedAt: new Date(),
            status: PlaceStatus.ACTIVE, // Activer la place automatiquement
            isVerified: true,
          },
        });

        // Rejeter toutes les autres revendications en attente pour cette place
        await tx.placeClaim.updateMany({
          where: {
            placeId: existingClaim.placeId,
            id: { not: claimId },
            status: ClaimStatus.PENDING,
          },
          data: {
            status: ClaimStatus.REJECTED,
            processedBy: session.user.id,
            processedAt: new Date(),
            adminMessage: "Revendication approuvée pour un autre utilisateur",
          },
        });
      }

      return { claim: updatedClaim, place: updatedPlace };
    });

    // Envoyer notifications email (en arrière-plan)
    if (action === "approve") {
      notifyUserClaimApproved(
        existingClaim.user.email,
        existingClaim.place.name,
        adminMessage
      ).catch((error) => {
        console.error("Erreur notification utilisateur:", error);
      });
    } else {
      notifyUserClaimRejected(
        existingClaim.user.email,
        existingClaim.place.name,
        adminMessage
      ).catch((error) => {
        console.error("Erreur notification utilisateur:", error);
      });
    }

    // Log de l'action admin
    console.log(`Claim ${claimId} ${action}ed by admin ${session.user.id}`, {
      place: existingClaim.place.name,
      user: existingClaim.user.email,
      admin: session.user.email,
      adminMessage,
    });

    return NextResponse.json({
      claim: result.claim,
      place: result.place,
      message:
        action === "approve"
          ? "Revendication approuvée avec succès"
          : "Revendication rejetée avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors du traitement de la revendication:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
