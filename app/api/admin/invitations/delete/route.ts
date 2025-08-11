import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";

const deleteInvitationSchema = z.object({
  id: z.string(),
});

export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user?.role || !["admin", "moderator", "editor"].includes(user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Valider les données
    const body = await request.json();
    const { id } = deleteInvitationSchema.parse(body);

    // Supprimer l'invitation
    const deletedInvitation = await prisma.verification.delete({
      where: {
        id,
        type: "EMAIL",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation supprimée avec succès",
    });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'invitation:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}