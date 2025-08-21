import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withCache, getCacheKey } from "@/lib/cache";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Utiliser le cache pour les statistiques (5 minutes de TTL)
    const stats = await withCache(
      getCacheKey.dashboardStats(),
      async () => {
        // Calculer les statistiques de base
        const [
          totalUsers,
          totalPosts,
          totalPlaces,
          totalEvents,
          recentUsers,
          recentPosts,
          newsletterStats,
          monthlyGrowth,
          usersByMonth,
          activePlaces,
          pendingClaims,
        ] = await Promise.all([
          // Nombre total d'utilisateurs
          prisma.user.count(),

          // Nombre total d'articles
          prisma.post.count(),

          // Nombre total de commerces
          prisma.place.count(),

          // Nombre total d'événements
          prisma.event.count(),

          // Nouveaux utilisateurs ce mois
          prisma.user.count({
            where: {
              createdAt: {
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ),
              },
            },
          }),

          // Nouveaux articles ce mois
          prisma.post.count({
            where: {
              createdAt: {
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ),
              },
            },
          }),

          // Statistiques newsletter
          prisma.newsletterSubscriber.aggregate({
            _count: {
              id: true,
            },
            where: {
              isActive: true,
              isVerified: true,
            },
          }),

          // Croissance mensuelle des utilisateurs
          Promise.all([
            // Mois dernier
            prisma.user.count({
              where: {
                createdAt: {
                  gte: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() - 1,
                    1
                  ),
                  lt: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  ),
                },
              },
            }),
            // Ce mois
            prisma.user.count({
              where: {
                createdAt: {
                  gte: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  ),
                },
              },
            }),
          ]),

          // Utilisateurs par mois (6 derniers mois)
          Promise.all(
            Array.from({ length: 6 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const startOfMonth = new Date(
                date.getFullYear(),
                date.getMonth(),
                1
              );
              const endOfMonth = new Date(
                date.getFullYear(),
                date.getMonth() + 1,
                1
              );

              return prisma.user
                .count({
                  where: {
                    createdAt: {
                      gte: startOfMonth,
                      lt: endOfMonth,
                    },
                  },
                })
                .then((count) => ({
                  month: startOfMonth.toLocaleDateString("fr-FR", {
                    month: "short",
                    year: "2-digit",
                  }),
                  count,
                }));
            })
          ),

          // Commerces actifs (avec au moins un événement ou review)
          prisma.place.count({
            where: {
              OR: [{ events: { some: {} } }, { reviews: { some: {} } }],
            },
          }),

          // Demandes de réclamation en attente
          prisma.placeClaim.count({
            where: {
              status: "PENDING",
            },
          }),
        ]);

        // Calcul du taux de croissance
        const [lastMonth, thisMonth] = monthlyGrowth;
        const growthRate =
          lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

        // Calcul du taux d'engagement des commerces
        const engagementRate =
          totalPlaces > 0 ? (activePlaces / totalPlaces) * 100 : 0;

        // Statistiques récentes (7 derniers jours)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const [weeklyActivity, topContributors] = await Promise.all([
          // Activité de la semaine
          Promise.all([
            prisma.post.count({ where: { createdAt: { gte: weekAgo } } }),
            prisma.event.count({ where: { createdAt: { gte: weekAgo } } }),
            prisma.place.count({ where: { createdAt: { gte: weekAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
          ]),

          // Top contributeurs ce mois
          prisma.user.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              _count: {
                select: {
                  posts: {
                    where: {
                      createdAt: {
                        gte: new Date(
                          new Date().getFullYear(),
                          new Date().getMonth(),
                          1
                        ),
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              posts: {
                _count: "desc",
              },
            },
            take: 5,
          }),
        ]);

        const [weeklyPosts, weeklyEvents, weeklyPlaces, weeklyUsers] =
          weeklyActivity;

        return {
          // Métriques principales
          totalUsers,
          totalPosts,
          totalPlaces,
          totalEvents,

          // Croissance
          recentUsers,
          recentPosts,
          growthRate: Math.round(growthRate * 100) / 100,

          // Newsletter
          newsletterSubscribers: newsletterStats._count.id,

          // Engagement
          activePlaces,
          engagementRate: Math.round(engagementRate * 100) / 100,

          // En attente
          pendingClaims,

          // Activité hebdomadaire
          weeklyActivity: {
            posts: weeklyPosts,
            events: weeklyEvents,
            places: weeklyPlaces,
            users: weeklyUsers,
            total: weeklyPosts + weeklyEvents + weeklyPlaces + weeklyUsers,
          },

          // Évolution mensuelle
          monthlyUsers: usersByMonth.reverse(),

          // Top contributeurs
          topContributors: topContributors.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email?.replace(/(.{3}).*@/, "$1***@"), // Masquer l'email
            postsCount: user._count.posts,
          })),

          // Métadonnées
          lastUpdated: new Date().toISOString(),
        };
      },
      5 * 60 * 1000 // 5 minutes de cache
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
