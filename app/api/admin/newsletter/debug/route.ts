import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      user: {
        id: session.user.id,
        email: session.user.email,
      },
      tests: {}
    };

    try {
      // Test 1: Compter les campagnes
      const campaignCount = await prisma.newsletterCampaign.count();
      debugInfo.tests.campaignCount = campaignCount;

      // Test 2: Récupérer la première campagne
      const firstCampaign = await prisma.newsletterCampaign.findFirst({
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });
      debugInfo.tests.firstCampaign = firstCampaign ? {
        id: firstCampaign.id,
        title: firstCampaign.title,
        status: firstCampaign.status,
        createdBy: firstCampaign.createdBy,
      } : null;

      // Test 3: Compter les abonnés
      const subscriberCount = await prisma.newsletterSubscriber.count();
      debugInfo.tests.subscriberCount = subscriberCount;

      // Test 4: Récupérer le premier abonné
      const firstSubscriber = await prisma.newsletterSubscriber.findFirst({
        include: {
          preferences: true,
        }
      });
      debugInfo.tests.firstSubscriber = firstSubscriber ? {
        id: firstSubscriber.id,
        email: firstSubscriber.email,
        isActive: firstSubscriber.isActive,
        isVerified: firstSubscriber.isVerified,
        preferences: firstSubscriber.preferences,
      } : null;

      // Test 5: Vérifier les permissions utilisateur
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      debugInfo.tests.userRole = user?.role;
      debugInfo.tests.hasAdminAccess = user?.role && ["admin", "moderator", "editor"].includes(user.role);

      debugInfo.tests.status = "success";

    } catch (prismaError) {
      debugInfo.tests.status = "error";
      debugInfo.tests.error = prismaError.message;
      debugInfo.tests.errorCode = prismaError.code;
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    });

  } catch (error) {
    console.error("Erreur lors du debug:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        debug: {
          timestamp: new Date().toISOString(),
          error: "Erreur générale",
        }
      },
      { status: 500 }
    );
  }
}