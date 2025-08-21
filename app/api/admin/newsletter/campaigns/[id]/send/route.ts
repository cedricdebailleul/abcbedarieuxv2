import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { newsletterQueue } from "@/lib/newsletter-queue";

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

      // Vérifier que la campagne existe et peut être envoyée
      const campaign = await prisma.newsletterCampaign.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Campagne non trouvée" },
          { status: 404 }
        );
      }

      if (!["DRAFT", "SCHEDULED"].includes(campaign.status)) {
        return NextResponse.json(
          {
            error:
              "Seules les campagnes en brouillon ou programmées peuvent être envoyées",
          },
          { status: 400 }
        );
      }

      // Récupérer les abonnés actifs et vérifiés
      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: {
          isActive: true,
          isVerified: true,
        },
        include: {
          preferences: true,
        },
      });

      if (subscribers.length === 0) {
        return NextResponse.json(
          { error: "Aucun abonné actif trouvé" },
          { status: 400 }
        );
      }

      // Filtrer les abonnés selon le type de campagne et leurs préférences
      const filteredSubscribers = subscribers.filter((subscriber) => {
        if (!subscriber.preferences) return true; // Si pas de préférences, inclure par défaut

        switch (campaign.type) {
          case "EVENT_DIGEST":
            return subscriber.preferences.events;
          case "PLACE_UPDATE":
            return subscriber.preferences.places;
          case "PROMOTIONAL":
            return subscriber.preferences.offers;
          case "ANNOUNCEMENT":
          case "NEWSLETTER":
          default:
            return subscriber.preferences.news;
        }
      });

      // Marquer la campagne comme en cours d'envoi
      await prisma.newsletterCampaign.update({
        where: { id },
        data: {
          status: "SENDING",
          sentAt: new Date(),
          totalRecipients: filteredSubscribers.length,
        },
      });

      // Ajouter tous les emails à la file d'attente
      const subscriberIds = filteredSubscribers.map((s) => s.id);
      const queueResult = await newsletterQueue.addToQueue(id, subscriberIds);

      console.log(
        `📧 ${queueResult.queued} emails ajoutés à la file d'attente pour la campagne ${campaign.title}`
      );

      return NextResponse.json({
        success: true,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          status: "SENDING",
          totalRecipients: filteredSubscribers.length,
        },
        message: `Campagne mise en file d'attente: ${queueResult.queued} emails à envoyer (par batch de 10)`,
        stats: {
          totalRecipients: filteredSubscribers.length,
          queued: queueResult.queued,
          batchSize: 10,
        },
        queueStatus: await newsletterQueue.getQueueStatus(),
      });
    } catch (prismaError: unknown) {
      // En cas d'erreur, remettre le statut en brouillon
      try {
        const { id } = await params;
        await prisma.newsletterCampaign.update({
          where: { id },
          data: {
            status: "ERROR",
          },
        });
      } catch (rollbackError) {
        console.error("Erreur lors du rollback:", rollbackError);
      }

      if (prismaError instanceof Error && prismaError.message.includes("newsletterCampaign")) {
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
    console.error("Erreur lors de l'envoi de la campagne:", error);

    // Marquer la campagne en erreur
    try {
      const { id } = await params;
      await prisma.newsletterCampaign.update({
        where: { id },
        data: {
          status: "ERROR",
        },
      });
    } catch (rollbackError) {
      console.error("Erreur lors du rollback:", rollbackError);
    }

    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la campagne" },
      { status: 500 }
    );
  }
}
