import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const updateBulletinSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire"),
  content: z.string().min(1, "Le contenu est obligatoire"),
  isPublished: z.boolean(),
  publishedAt: z.string().datetime().nullable().optional(),
  meetingId: z.string().nullable().optional(),
});

// GET /api/admin/abc/bulletins/[bulletinId] - Récupérer un bulletin
export async function GET(
  request: Request,
  { params }: { params: { bulletinId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !safeUserCast(session.user).role || !["admin", "moderator"].includes(safeUserCast(session.user).role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const bulletin = await prisma.abcBulletin.findUnique({
      where: { id: params.bulletinId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!bulletin) {
      return NextResponse.json(
        { error: "Bulletin non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ bulletin });

  } catch (error) {
    console.error("Erreur lors de la récupération du bulletin:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/abc/bulletins/[bulletinId] - Modifier un bulletin
export async function PUT(
  request: Request,
  { params }: { params: { bulletinId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !safeUserCast(session.user).role || !["admin", "moderator"].includes(safeUserCast(session.user).role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateBulletinSchema.parse(body);

    // Vérifier que le bulletin existe
    const existingBulletin = await prisma.abcBulletin.findUnique({
      where: { id: params.bulletinId },
    });

    if (!existingBulletin) {
      return NextResponse.json(
        { error: "Bulletin non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier la date si le bulletin est publié
    if (data.isPublished && data.publishedAt) {
      const publishedDate = new Date(data.publishedAt);
      if (publishedDate > new Date()) {
        return NextResponse.json(
          { error: "La date de publication ne peut pas être dans le futur" },
          { status: 400 }
        );
      }
    }

    // Vérifier que le meeting existe si fourni
    if (data.meetingId) {
      const meeting = await prisma.abcMeeting.findUnique({
        where: { id: data.meetingId },
      });
      if (!meeting) {
        return NextResponse.json(
          { error: "Réunion non trouvée" },
          { status: 404 }
        );
      }
    }

    const bulletin = await prisma.abcBulletin.update({
      where: { id: params.bulletinId },
      data: {
        title: data.title,
        content: data.content,
        isPublished: data.isPublished,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        meetingId: data.meetingId,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      bulletin,
      message: "Bulletin modifié avec succès",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la modification du bulletin:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/abc/bulletins/[bulletinId] - Supprimer un bulletin
export async function DELETE(
  request: Request,
  { params }: { params: { bulletinId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !safeUserCast(session.user).role || !["admin", "moderator"].includes(safeUserCast(session.user).role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier que le bulletin existe
    const bulletin = await prisma.abcBulletin.findUnique({
      where: { id: params.bulletinId },
    });

    if (!bulletin) {
      return NextResponse.json(
        { error: "Bulletin non trouvé" },
        { status: 404 }
      );
    }

    // Empêcher la suppression si le bulletin est publié (sauf pour les admins)
    if (bulletin.isPublished && safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent supprimer un bulletin publié" },
        { status: 403 }
      );
    }

    await prisma.abcBulletin.delete({
      where: { id: params.bulletinId },
    });

    return NextResponse.json({
      message: "Bulletin supprimé avec succès",
    });

  } catch (error) {
    console.error("Erreur lors de la suppression du bulletin:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}