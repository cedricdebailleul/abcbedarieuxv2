import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserStatus } from "@/lib/generated/prisma";

const banUserSchema = z.object({
  banned: z.boolean(),
  banReason: z.string().optional(),
  banExpires: z.string().datetime().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.userId;

    // Vérifier l'authentification et les permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true },
    });

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Empêcher l'auto-bannissement
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous bannir vous-même" },
        { status: 400 }
      );
    }

    // Valider les données
    const body = await request.json();
    const { banned, banReason, banExpires } = banUserSchema.parse(body);

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, banned: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: {
      banned: boolean;
      status: UserStatus;
      bannedBy: string | null;
      banReason?: string | null;
      banExpires?: Date | null;
    } = {
      banned,
      status: banned ? "BANNED" : "ACTIVE",
      bannedBy: banned ? currentUser.id : null,
    };

    if (banned) {
      updateData.banReason = banReason || "Banni par l'administrateur";
      if (banExpires) {
        updateData.banExpires = new Date(banExpires);
      }
    } else {
      // Débannissement : nettoyer les champs de ban
      updateData.banReason = null;
      updateData.banExpires = null;
      updateData.bannedBy = null;
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        banned: true,
        banReason: true,
        banExpires: true,
        status: true,
      },
    });

    const action = banned ? "banni" : "débanni";

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${action} avec succès`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur lors du bannissement/débannissement:", error);

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
