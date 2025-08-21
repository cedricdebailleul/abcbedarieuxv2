import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Domaines autorisés pour les redirections
const ALLOWED_DOMAINS = [
  "abc-bedarieux.fr",
  "www.abc-bedarieux.fr",
  "localhost:3000",
  "localhost:3001",
  "127.0.0.1:3000",
  "127.0.0.1:3001",
];

// Fonction pour valider l'URL de redirection
function validateRedirectUrl(url: string, requestUrl: string): URL {
  try {
    const targetUrl = new URL(decodeURIComponent(url));

    // Vérifier si le domaine est autorisé
    if (
      ALLOWED_DOMAINS.includes(targetUrl.hostname) ||
      ALLOWED_DOMAINS.includes(`${targetUrl.hostname}:${targetUrl.port}`)
    ) {
      return targetUrl;
    }

    // Si le domaine n'est pas autorisé, rediriger vers la page d'accueil
    console.warn(
      `🚨 Tentative de redirection vers un domaine non autorisé: ${targetUrl.hostname}`
    );
    return new URL("/", requestUrl);
  } catch {
    // En cas d'URL malformée, rediriger vers la page d'accueil
    console.error("🚨 URL malformée détectée:", url);
    return new URL("/", requestUrl);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("c");
    const subscriberId = searchParams.get("s");
    const url = searchParams.get("url");

    if (!campaignId || !subscriberId || !url) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      // Vérifier que la campagne et l'abonné existent
      const [campaign, subscriber] = await Promise.all([
        prisma.newsletterCampaign.findUnique({
          where: { id: campaignId },
        }),
        prisma.newsletterSubscriber.findUnique({
          where: { id: subscriberId },
        }),
      ]);

      if (!campaign || !subscriber) {
        const safeUrl = validateRedirectUrl(url, request.url);
        return NextResponse.redirect(safeUrl);
      }

      // Capturer les informations de l'utilisateur
      const forwardedFor = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const clientIp = forwardedFor?.split(",")[0] || realIp || "unknown";

      // Vérifier si déjà cliqué pour éviter les doublons
      const existingRecord = await prisma.newsletterCampaignSent.findUnique({
        where: {
          campaignId_subscriberId: {
            campaignId,
            subscriberId,
          },
        },
      });

      if (existingRecord && !existingRecord.clickedAt) {
        // Premier clic
        await prisma.newsletterCampaignSent.update({
          where: {
            campaignId_subscriberId: {
              campaignId,
              subscriberId,
            },
          },
          data: {
            clickedAt: new Date(),
            status: "CLICKED",
            // S'assurer que l'email est marqué comme ouvert aussi (fallback pour Gmail)
            ...(!existingRecord.openedAt && { openedAt: new Date() }),
          },
        });

        // Mettre à jour les statistiques de la campagne
        const [clickCount, openCount] = await Promise.all([
          prisma.newsletterCampaignSent.count({
            where: {
              campaignId,
              clickedAt: { not: null },
            },
          }),
          prisma.newsletterCampaignSent.count({
            where: {
              campaignId,
              openedAt: { not: null },
            },
          }),
        ]);

        await prisma.newsletterCampaign.update({
          where: { id: campaignId },
          data: {
            totalClicked: clickCount,
            totalOpened: openCount,
          },
        });

        console.log(
          `🖱️ Nouveau clic: Campagne ${campaignId}, Abonné ${subscriberId}, URL: ${url}, IP: ${clientIp}`
        );
      } else if (!existingRecord) {
        // Enregistrement inexistant (cas rare), créer l'entrée
        await prisma.newsletterCampaignSent.create({
          data: {
            campaignId,
            subscriberId,
            status: "CLICKED",
            sentAt: new Date(),
            deliveredAt: new Date(),
            openedAt: new Date(),
            clickedAt: new Date(),
            messageId: `track-click-${Date.now()}`,
          },
        });

        console.log(
          `🖱️ Clic tracké (nouvel enregistrement): Campagne ${campaignId}, Abonné ${subscriberId}, URL: ${url}`
        );
      }
      // Si déjà cliqué, on ne fait rien mais on redirige quand même
    } catch (error) {
      console.error("Erreur lors du tracking de clic:", error);
    }

    // Rediriger vers l'URL de destination (sécurisée)
    const safeUrl = validateRedirectUrl(url, request.url);
    return NextResponse.redirect(safeUrl);
  } catch (error) {
    console.error("Erreur générale tracking clic:", error);
    // En cas d'erreur, rediriger vers l'URL sécurisée ou la page d'accueil
    const url = new URL(request.url).searchParams.get("url");
    if (url) {
      const safeUrl = validateRedirectUrl(url, request.url);
      return NextResponse.redirect(safeUrl);
    }
    return NextResponse.redirect(new URL("/", request.url));
  }
}
