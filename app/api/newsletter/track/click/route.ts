import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('c');
    const subscriberId = searchParams.get('s');
    const token = searchParams.get('t');
    const url = searchParams.get('url');

    if (!campaignId || !subscriberId || !token || !url) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      // Vérifier que la campagne et l'abonné existent
      const [campaign, subscriber] = await Promise.all([
        prisma.newsletterCampaign.findUnique({
          where: { id: campaignId }
        }),
        prisma.newsletterSubscriber.findUnique({
          where: { id: subscriberId }
        })
      ]);

      if (!campaign || !subscriber) {
        return NextResponse.redirect(new URL(decodeURIComponent(url)));
      }

      // Enregistrer le clic
      await prisma.newsletterCampaignSent.upsert({
        where: {
          campaignId_subscriberId: {
            campaignId,
            subscriberId
          }
        },
        update: {
          clickedAt: new Date(),
          status: 'CLICKED'
        },
        create: {
          campaignId,
          subscriberId,
          status: 'CLICKED',
          sentAt: new Date(),
          deliveredAt: new Date(),
          clickedAt: new Date(),
          messageId: `click-${Date.now()}`
        }
      });

      // Mettre à jour les statistiques de la campagne
      const clickCount = await prisma.newsletterCampaignSent.count({
        where: {
          campaignId,
          clickedAt: { not: null }
        }
      });

      await prisma.newsletterCampaign.update({
        where: { id: campaignId },
        data: { totalClicked: clickCount }
      });

      console.log(`Lien cliqué: Campagne ${campaignId}, Abonné ${subscriberId}, URL: ${url}`);

    } catch (error) {
      console.error('Erreur lors du tracking de clic:', error);
    }

    // Rediriger vers l'URL de destination
    return NextResponse.redirect(new URL(decodeURIComponent(url)));

  } catch (error) {
    console.error('Erreur générale tracking clic:', error);
    // En cas d'erreur, rediriger vers l'URL ou la page d'accueil
    const url = new URL(request.url).searchParams.get('url');
    return NextResponse.redirect(new URL(url ? decodeURIComponent(url) : '/', request.url));
  }
}