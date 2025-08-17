import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('c');
    const subscriberId = searchParams.get('s');
    const token = searchParams.get('t');

    if (!campaignId || !subscriberId || !token) {
      // Retourner une image transparente même en cas d'erreur
      return new NextResponse(
        Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        {
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
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
        return new NextResponse(
          Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
          { headers: { 'Content-Type': 'image/gif' } }
        );
      }

      // Enregistrer l'ouverture (éviter les doublons)
      await prisma.newsletterCampaignSent.upsert({
        where: {
          campaignId_subscriberId: {
            campaignId,
            subscriberId
          }
        },
        update: {
          openedAt: new Date(),
          status: 'OPENED'
        },
        create: {
          campaignId,
          subscriberId,
          status: 'OPENED',
          sentAt: new Date(),
          deliveredAt: new Date(),
          openedAt: new Date(),
          messageId: `track-${Date.now()}`
        }
      });

      // Mettre à jour les statistiques de la campagne
      const openCount = await prisma.newsletterCampaignSent.count({
        where: {
          campaignId,
          openedAt: { not: null }
        }
      });

      await prisma.newsletterCampaign.update({
        where: { id: campaignId },
        data: { totalOpened: openCount }
      });

      console.log(`Email ouvert: Campagne ${campaignId}, Abonné ${subscriberId}`);

    } catch (error) {
      console.error('Erreur lors du tracking d\'ouverture:', error);
    }

    // Retourner un pixel transparent 1x1
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error('Erreur générale tracking ouverture:', error);
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      { headers: { 'Content-Type': 'image/gif' } }
    );
  }
}