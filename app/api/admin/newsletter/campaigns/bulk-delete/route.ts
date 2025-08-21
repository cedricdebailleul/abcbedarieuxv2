import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
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

    if (!user?.role || !["admin", "moderator"].includes(user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { campaignIds, force = false } = body;

    if (!Array.isArray(campaignIds) || campaignIds.length === 0) {
      return NextResponse.json(
        { error: "Liste d'IDs de campagnes requise" },
        { status: 400 }
      );
    }

    try {
      // Vérifier que toutes les campagnes existent et peuvent être supprimées
      const campaigns = await prisma.newsletterCampaign.findMany({
        where: { id: { in: campaignIds } },
        select: {
          id: true,
          title: true,
          status: true,
          totalRecipients: true,
          totalSent: true,
        },
      });

      if (campaigns.length !== campaignIds.length) {
        const foundIds = campaigns.map((c) => c.id);
        const missingIds = campaignIds.filter((id) => !foundIds.includes(id));
        return NextResponse.json(
          {
            error: "Certaines campagnes n'existent pas",
            missingIds,
          },
          { status: 404 }
        );
      }

      // Vérifier les permissions de suppression
      const undeletableCampaigns = campaigns.filter((campaign) => {
        // Permettre la suppression forcée pour les admins
        if (force && user.role === "admin") {
          return false;
        }

        // Sinon, seules les campagnes en brouillon ou annulées peuvent être supprimées
        return !["DRAFT", "CANCELLED", "ERROR"].includes(campaign.status);
      });

      if (undeletableCampaigns.length > 0) {
        return NextResponse.json(
          {
            error: "Certaines campagnes ne peuvent pas être supprimées",
            undeletableCampaigns: undeletableCampaigns.map((c) => ({
              id: c.id,
              title: c.title,
              status: c.status,
              reason: `Statut: ${c.status} - Utilisez force=true pour forcer la suppression (admin uniquement)`,
            })),
          },
          { status: 400 }
        );
      }

      // Effectuer la suppression en transaction
      const result = await prisma.$transaction(async (tx) => {
        // Supprimer les campagnes
        const deleteResult = await tx.newsletterCampaign.deleteMany({
          where: { id: { in: campaignIds } },
        });

        return {
          deletedCount: deleteResult.count,
          deletedCampaigns: campaigns.map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status,
          })),
        };
      });

      console.log(
        `🗑️ Suppression en masse: ${result.deletedCount} campagnes supprimées par admin ${session.user.id}`
      );

      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} campagne(s) supprimée(s) avec succès`,
        deletedCount: result.deletedCount,
        deletedCampaigns: result.deletedCampaigns,
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
    console.error("Erreur lors de la suppression en masse:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
