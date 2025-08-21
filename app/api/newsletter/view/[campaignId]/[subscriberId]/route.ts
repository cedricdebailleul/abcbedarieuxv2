import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNewsletterEmailTemplate } from "@/lib/email";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; subscriberId: string }> }
) {
  try {
    const { campaignId, subscriberId } = await params;

    if (!campaignId || !subscriberId) {
      return new NextResponse("Paramètres manquants", { status: 400 });
    }

    // Vérifier que la campagne et l'abonné existent
    const [campaign, subscriber] = await Promise.all([
      prisma.newsletterCampaign.findUnique({
        where: { id: campaignId },
        include: { attachments: true }
      }),
      prisma.newsletterSubscriber.findUnique({
        where: { id: subscriberId }
      })
    ]);

    if (!campaign || !subscriber) {
      return new NextResponse("Campagne ou abonné non trouvé", { status: 404 });
    }

    // Marquer comme ouvert si pas déjà fait (tracking Web fiable)
    const existingRecord = await prisma.newsletterCampaignSent.findUnique({
      where: {
        campaignId_subscriberId: {
          campaignId,
          subscriberId
        }
      }
    });

    if (existingRecord && !existingRecord.openedAt) {
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

      console.log(`📧 Ouverture Web trackée: Campagne ${campaignId}, Abonné ${subscriberId}`);
    }

    // Récupérer le contenu comme dans la queue
    const [events, places, posts] = await Promise.all([
      campaign.includedEvents.length > 0 
        ? prisma.event.findMany({
            where: { id: { in: campaign.includedEvents } },
            select: {
              id: true, title: true, slug: true, summary: true, description: true,
              startDate: true, endDate: true, isAllDay: true,
              locationName: true, locationAddress: true, locationCity: true,
              coverImage: true, category: true
            }
          })
        : [],
      
      campaign.includedPlaces.length > 0
        ? prisma.place.findMany({
            where: { id: { in: campaign.includedPlaces } },
            select: {
              id: true, name: true, slug: true, summary: true, description: true,
              street: true, city: true, phone: true, website: true,
              logo: true, coverImage: true, type: true
            }
          })
        : [],
      
      campaign.includedPosts.length > 0
        ? prisma.post.findMany({
            where: { id: { in: campaign.includedPosts } },
            select: {
              id: true, title: true, slug: true, excerpt: true,
              coverImage: true, publishedAt: true,
              author: { select: { name: true } }
            }
          })
        : []
    ]);

    const baseUrl = process.env.NEXTAUTH_URL || 'https://abc-bedarieux.fr';
    const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`;
    const trackingPixelUrl = `${baseUrl}/api/newsletter/track/open?c=${campaignId}&s=${subscriberId}`;

    // Mapper les attachements
    const templateAttachments = campaign.attachments.map(attachment => ({
      name: attachment.originalName,
      size: attachment.fileSize,
      type: attachment.fileType,
      url: `${baseUrl}${attachment.filePath}`
    }));

    // Générer le HTML de l'email
    const emailHtml = createNewsletterEmailTemplate({
      campaignTitle: campaign.title,
      subject: campaign.subject,
      content: campaign.content,
      unsubscribeUrl,
      trackingPixelUrl,
      subscriberName: subscriber.firstName || undefined,
      events: events.map(event => ({
        title: event.title,
        slug: event.slug,
        coverImage: event.coverImage || undefined,
        description: event.description || undefined,
        startDate: event.startDate?.toISOString(),
        locationName: event.locationName || undefined,
        locationAddress: event.locationAddress || undefined,
        locationCity: event.locationCity || undefined,
      })),
      places: places.map(place => ({
        name: place.name,
        slug: place.slug,
        coverImage: place.coverImage || undefined,
        logo: place.logo || undefined,
        summary: place.summary || undefined,
        street: place.street || undefined,
        city: place.city || undefined,
        phone: place.phone || undefined,
        website: place.website || undefined,
      })),
      posts: posts.map(post => ({
        title: post.title,
        slug: post.slug,
        coverImage: post.coverImage || undefined,
        excerpt: post.excerpt || undefined,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : undefined,
        author: post.author || undefined,
      })),
      attachments: templateAttachments,
      campaignId,
      subscriberId
    });

    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error("Erreur lors de l'affichage web:", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}