import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withCache, getCacheKey } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers())
    });

    if (!session?.user || !["admin", "moderator"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const stats = await withCache(
      getCacheKey.adminStats(),
      async () => {
        const [
          // Utilisateurs
          totalUsers,
          recentUsers,
          activeUsers,
          bannedUsers,
          
          // Contenu
          totalPosts,
          totalPlaces,
          totalEvents,
          publishedPosts,
          activePlaces,
          upcomingEvents,
          
          // Newsletter
          newsletterSubscribers,
          newsletterCampaigns,
          recentCampaigns,
          
          // Réclamations et modération
          pendingClaims,
          totalClaims,
          pendingReviews,
          
          // Engagement
          totalReviews,
          totalFavorites,
          totalBadges,
          
          // Données temporelles pour graphiques
          userRegistrations,
          contentCreation,
          
        ] = await Promise.all([
          // Utilisateurs total
          prisma.user.count(),
          
          // Nouveaux utilisateurs (30 derniers jours)
          prisma.user.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }),
          
          // Utilisateurs actifs (connectés dans les 7 derniers jours)
          prisma.session.groupBy({
            by: ['userId'],
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          }).then(sessions => sessions.length),
          
          // Utilisateurs bannis
          prisma.user.count({
            where: {
              OR: [
                { banned: true },
                { status: 'BANNED' }
              ]
            }
          }),
          
          // Articles total
          prisma.post.count(),
          
          // Places total
          prisma.place.count(),
          
          // Événements total
          prisma.event.count(),
          
          // Articles publiés
          prisma.post.count({
            where: { published: true }
          }),
          
          // Places actives
          prisma.place.count({
            where: {
              OR: [
                { status: 'ACTIVE' },
                { isActive: true }
              ]
            }
          }),
          
          // Événements à venir
          prisma.event.count({
            where: {
              startDate: {
                gte: new Date()
              }
            }
          }),
          
          // Abonnés newsletter actifs
          prisma.newsletterSubscriber.count({
            where: {
              isActive: true,
              isVerified: true
            }
          }),
          
          // Campagnes newsletter
          prisma.newsletterCampaign.count(),
          
          // Dernières campagnes
          prisma.newsletterCampaign.findMany({
            select: {
              id: true,
              subject: true,
              status: true,
              scheduledAt: true,
              sentAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }),
          
          // Réclamations en attente
          prisma.placeClaim.count({
            where: { status: 'PENDING' }
          }),
          
          // Total réclamations
          prisma.placeClaim.count(),
          
          // Reviews en attente de modération (si applicable)
          prisma.review.count({
            where: {
              // Ajoutez ici les critères de modération si nécessaire
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
              }
            }
          }),
          
          // Total reviews
          prisma.review.count(),
          
          // Total favoris
          prisma.favorite.count(),
          
          // Total badges attribués
          prisma.userBadge.count(),
          
          // Données simplifiées sans requêtes SQL brutes
          [],
          []
        ]);

        // Calcul des taux de croissance (30 jours précédents vs 30 jours actuels)
        const previousMonthUsers = await prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        });

        const userGrowthRate = previousMonthUsers > 0 
          ? ((recentUsers - previousMonthUsers) / previousMonthUsers) * 100 
          : 0;

        // Calcul du taux d'engagement
        const engagementRate = totalUsers > 0 
          ? Math.round(((totalReviews + totalFavorites) / totalUsers) * 100) / 100
          : 0;

        // Taux de conversion newsletter
        const newsletterConversionRate = totalUsers > 0 
          ? Math.round((newsletterSubscribers / totalUsers) * 100 * 100) / 100
          : 0;

        return {
          // Utilisateurs
          users: {
            total: totalUsers,
            recent: recentUsers,
            active: activeUsers,
            banned: bannedUsers,
            growthRate: Math.round(userGrowthRate * 100) / 100
          },
          
          // Contenu
          content: {
            totalPosts,
            totalPlaces,  
            totalEvents,
            publishedPosts,
            activePlaces,
            upcomingEvents,
            contentRatio: totalPosts + totalPlaces + totalEvents > 0 
              ? Math.round((publishedPosts + activePlaces + upcomingEvents) / (totalPosts + totalPlaces + totalEvents) * 100)
              : 0
          },
          
          // Newsletter
          newsletter: {
            subscribers: newsletterSubscribers,
            campaigns: newsletterCampaigns,
            recentCampaigns,
            conversionRate: newsletterConversionRate
          },
          
          // Modération
          moderation: {
            pendingClaims,
            totalClaims,
            pendingReviews,
            claimsRatio: totalClaims > 0 ? Math.round((pendingClaims / totalClaims) * 100) : 0
          },
          
          // Engagement
          engagement: {
            totalReviews,
            totalFavorites,
            totalBadges,
            engagementRate,
            reviewsPerUser: totalUsers > 0 ? Math.round((totalReviews / totalUsers) * 100) / 100 : 0
          },
          
          // Données temporelles (désactivées temporairement)
          charts: {
            userRegistrations: [],
            contentCreation: []
          },
          
          // Métadonnées
          lastUpdated: new Date().toISOString(),
          period: "30d"
        };
      },
      10 * 60 * 1000 // Cache 10 minutes (plus long car données admin)
    );

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques admin:', error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques admin" },
      { status: 500 }
    );
  }
}