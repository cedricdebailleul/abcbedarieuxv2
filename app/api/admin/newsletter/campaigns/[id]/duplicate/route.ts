import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
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

    try {
      const { id } = await params;

      // Récupérer la campagne originale
      const originalCampaign = await prisma.newsletterCampaign.findUnique({
        where: { id },
      });

      if (!originalCampaign) {
        return NextResponse.json(
          { error: "Campagne originale non trouvée" },
          { status: 404 }
        );
      }

      // Créer une copie de la campagne
      const duplicatedCampaign = await prisma.newsletterCampaign.create({
        data: {
          title: `${originalCampaign.title} (Copie)`,
          subject: originalCampaign.subject,
          content: originalCampaign.content,
          type: originalCampaign.type,
          status: "DRAFT", // Toujours créer en brouillon
          createdById: session.user.id,
          includedEvents: originalCampaign.includedEvents || [],
          includedPlaces: originalCampaign.includedPlaces || [],
          includedPosts: originalCampaign.includedPosts || [],
          // Ne pas copier les données d'envoi
          scheduledAt: null,
          sentAt: null,
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalUnsubscribed: 0,
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        campaign: duplicatedCampaign,
        message: "Campagne dupliquée avec succès",
      });
    } catch (prismaError: unknown) {
      if (
        prismaError instanceof Error &&
        prismaError.message.includes("newsletterCampaign")
      ) {
        return NextResponse.json(
          {
            error: "Les tables de newsletter ne sont pas encore créées.",
            migrationRequired: true,
          },
          { status: 500 }
        );
      }
      throw prismaError;
    }
  } catch (error) {
    console.error("Erreur lors de la duplication de la campagne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
