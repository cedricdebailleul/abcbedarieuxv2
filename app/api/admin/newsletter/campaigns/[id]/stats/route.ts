import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

      // Récupérer la campagne
      const campaign = await prisma.newsletterCampaign.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          status: true,
          sentAt: true,
          totalSent: true,
          totalDelivered: true,
          totalOpened: true,
          totalClicked: true,
          totalUnsubscribed: true,
        },
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Campagne non trouvée" },
          { status: 404 }
        );
      }

      // Récupérer les statistiques détaillées depuis la table de tracking
      const [
        sentStats,
        deliveredStats,
        openedStats,
        clickedStats,
        failedStats,
        timelineStats,
      ] = await Promise.all([
        // Emails envoyés
        prisma.newsletterCampaignSent.count({
          where: { campaignId: id },
        }),

        // Emails livrés
        prisma.newsletterCampaignSent.count({
          where: {
            campaignId: id,
            status: { in: ["DELIVERED", "OPENED", "CLICKED"] },
          },
        }),

        // Emails ouverts
        prisma.newsletterCampaignSent.count({
          where: {
            campaignId: id,
            openedAt: { not: null },
          },
        }),

        // Liens cliqués
        prisma.newsletterCampaignSent.count({
          where: {
            campaignId: id,
            clickedAt: { not: null },
          },
        }),

        // Emails échoués
        prisma.newsletterCampaignSent.count({
          where: {
            campaignId: id,
            status: "FAILED",
          },
        }),

        // Timeline des événements (dernières 24h par heure)
        prisma.newsletterCampaignSent.groupBy({
          by: ["status"],
          where: {
            campaignId: id,
            sentAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          _count: {
            id: true,
          },
        }),
      ]);

      // Calculer les taux
      const openRate =
        deliveredStats > 0
          ? Math.round((openedStats / deliveredStats) * 100)
          : 0;
      const clickRate =
        openedStats > 0 ? Math.round((clickedStats / openedStats) * 100) : 0;
      const deliveryRate =
        sentStats > 0 ? Math.round((deliveredStats / sentStats) * 100) : 0;
      const failureRate =
        sentStats > 0 ? Math.round((failedStats / sentStats) * 100) : 0;

      // Récupérer les détails des erreurs
      const errorDetails = await prisma.newsletterCampaignSent.findMany({
        where: {
          campaignId: id,
          status: "FAILED",
          errorMessage: { not: null },
        },
        select: {
          errorMessage: true,
          sentAt: true,
          subscriber: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { sentAt: "desc" },
        take: 10, // Dernières 10 erreurs
      });

      // Activité récente (dernières ouvertures/clics)
      const recentActivity = await prisma.newsletterCampaignSent.findMany({
        where: {
          campaignId: id,
          OR: [{ openedAt: { not: null } }, { clickedAt: { not: null } }],
        },
        select: {
          openedAt: true,
          clickedAt: true,
          subscriber: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [{ clickedAt: "desc" }, { openedAt: "desc" }],
        take: 20, // 20 dernières activités
      });

      return NextResponse.json({
        success: true,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          status: campaign.status,
          sentAt: campaign.sentAt,
        },
        stats: {
          // Statistiques principales
          sent: sentStats,
          delivered: deliveredStats,
          opened: openedStats,
          clicked: clickedStats,
          failed: failedStats,
          unsubscribed: campaign.totalUnsubscribed,

          // Taux calculés
          rates: {
            delivery: deliveryRate,
            open: openRate,
            click: clickRate,
            failure: failureRate,
          },

          // Comparaison avec les statistiques stockées dans la campagne
          stored: {
            sent: campaign.totalSent,
            delivered: campaign.totalDelivered,
            opened: campaign.totalOpened,
            clicked: campaign.totalClicked,
            unsubscribed: campaign.totalUnsubscribed,
          },
        },
        timeline: timelineStats,
        errors: errorDetails,
        recentActivity: recentActivity.map((activity) => ({
          email: activity.subscriber.email,
          name: activity.subscriber.firstName || activity.subscriber.email,
          action: activity.clickedAt ? "clicked" : "opened",
          timestamp: activity.clickedAt || activity.openedAt,
        })),
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
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
