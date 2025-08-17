import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, createNewsletterEmailTemplate } from "@/lib/email";
import crypto from "crypto";

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
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
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

      if (campaign.status !== "DRAFT") {
        return NextResponse.json(
          { error: "Seules les campagnes en brouillon peuvent être envoyées" },
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
      const filteredSubscribers = subscribers.filter(subscriber => {
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
        },
      });

      // Statistiques d'envoi
      let sentCount = 0;
      let deliveredCount = 0;
      let errorCount = 0;
      const sendResults = [];

      // Envoyer les emails un par un avec un délai pour éviter le spam
      for (const subscriber of filteredSubscribers) {
        try {
          // Créer un token de sécurité pour le tracking
          const trackingToken = crypto.randomBytes(16).toString('hex');
          
          // URLs de tracking
          const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
          const trackingPixelUrl = `${baseUrl}/api/newsletter/track/open?c=${id}&s=${subscriber.id}&t=${trackingToken}`;
          const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`;

          // Créer le contenu HTML de l'email
          const emailHtml = createNewsletterEmailTemplate({
            campaignTitle: campaign.title,
            subject: campaign.subject,
            content: campaign.content,
            unsubscribeUrl,
            trackingPixelUrl,
            subscriberName: subscriber.firstName,
          });

          // Envoyer l'email
          const emailResult = await sendEmail({
            to: subscriber.email,
            subject: campaign.subject,
            html: emailHtml,
          });

          if (emailResult.success) {
            sentCount++;
            deliveredCount++; // Pour l'instant, on considère envoyé = livré

            // Enregistrer l'envoi dans la base de données
            await prisma.newsletterCampaignSent.create({
              data: {
                campaignId: id,
                subscriberId: subscriber.id,
                status: 'DELIVERED',
                sentAt: new Date(),
                deliveredAt: new Date(),
                messageId: emailResult.messageId,
              },
            });

            sendResults.push({
              email: subscriber.email,
              status: 'sent',
              messageId: emailResult.messageId,
            });
          } else {
            errorCount++;
            
            // Enregistrer l'erreur
            await prisma.newsletterCampaignSent.create({
              data: {
                campaignId: id,
                subscriberId: subscriber.id,
                status: 'FAILED',
                sentAt: new Date(),
                errorMessage: emailResult.error,
                messageId: `error-${Date.now()}`,
              },
            });

            sendResults.push({
              email: subscriber.email,
              status: 'error',
              error: emailResult.error,
            });
          }

          // Délai de 100ms entre chaque email pour éviter les limitations
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (emailError) {
          console.error(`Erreur envoi email pour ${subscriber.email}:`, emailError);
          errorCount++;
          
          sendResults.push({
            email: subscriber.email,
            status: 'error',
            error: emailError.message,
          });
        }
      }

      // Déterminer le statut final de la campagne
      const finalStatus = errorCount === filteredSubscribers.length ? "ERROR" : "SENT";

      // Mettre à jour la campagne avec les statistiques d'envoi réelles
      const updatedCampaign = await prisma.newsletterCampaign.update({
        where: { id },
        data: {
          status: finalStatus,
          totalSent: sentCount,
          totalDelivered: deliveredCount,
          totalOpened: 0, // Sera mis à jour par le tracking
          totalClicked: 0, // Sera mis à jour par le tracking
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

      // Mettre à jour la date du dernier email envoyé pour chaque abonné
      await prisma.newsletterSubscriber.updateMany({
        where: {
          id: {
            in: filteredSubscribers.map(s => s.id),
          },
        },
        data: {
          lastEmailSent: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        campaign: updatedCampaign,
        message: `Campagne envoyée: ${sentCount} réussis, ${errorCount} erreurs sur ${filteredSubscribers.length} destinataires`,
        stats: {
          totalRecipients: filteredSubscribers.length,
          sent: sentCount,
          delivered: deliveredCount,
          errors: errorCount,
        },
        details: sendResults,
      });

    } catch (prismaError: any) {
      // En cas d'erreur, remettre le statut en brouillon
      try {
        await prisma.newsletterCampaign.update({
          where: { id },
          data: {
            status: "ERROR",
          },
        });
      } catch (rollbackError) {
        console.error("Erreur lors du rollback:", rollbackError);
      }

      if (prismaError.message?.includes("newsletterCampaign")) {
        return NextResponse.json(
          { 
            error: "Les tables de newsletter ne sont pas encore créées.",
            migrationRequired: true
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