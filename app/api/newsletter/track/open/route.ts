import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('c');
    const subscriberId = searchParams.get('s');

    if (!campaignId || !subscriberId) {
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
      console.log(`🔍 Tentative de tracking - Campagne: ${campaignId}, Abonné: ${subscriberId}`);
      
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
        console.log(`❌ Campagne ou abonné non trouvé - Campagne: ${!!campaign}, Abonné: ${!!subscriber}`);
        return new NextResponse(
          Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
          { headers: { 'Content-Type': 'image/gif' } }
        );
      }

      console.log(`✅ Campagne et abonné trouvés - ${campaign.title}, ${subscriber.email}`);

      // Capturer les informations de l'utilisateur
      const userAgent = request.headers.get('user-agent') || '';
      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

      // Vérifier si déjà ouvert pour éviter les doublons
      const existingOpen = await prisma.newsletterCampaignSent.findUnique({
        where: {
          campaignId_subscriberId: {
            campaignId,
            subscriberId
          }
        }
      });

      if (existingOpen && !existingOpen.openedAt) {
        // Première ouverture
        await prisma.newsletterCampaignSent.update({
          where: {
            campaignId_subscriberId: {
              campaignId,
              subscriberId
            }
          },
          data: {
            openedAt: new Date(),
            status: 'OPENED'
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

        console.log(`📧 Nouvelle ouverture: Campagne ${campaignId}, Abonné ${subscriberId}, IP: ${clientIp}`);
      } else if (!existingOpen) {
        // Enregistrement inexistant (cas rare), créer l'entrée
        await prisma.newsletterCampaignSent.create({
          data: {
            campaignId,
            subscriberId,
            status: 'OPENED',
            sentAt: new Date(),
            deliveredAt: new Date(),
            openedAt: new Date(),
            messageId: `track-${Date.now()}`
          }
        });

        console.log(`📧 Ouverture trackée (nouvel enregistrement): Campagne ${campaignId}, Abonné ${subscriberId}`);
      }
      // Si déjà ouvert, on ne fait rien (évite les multiples comptages)

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