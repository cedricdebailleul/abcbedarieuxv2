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

    const userId = session.user.id;

    const stats = await withCache(
      getCacheKey.userStats(userId),
      async () => {
        const [
          // Places de l'utilisateur
          userPlaces,
          userPlacesCount,

          // Articles de l'utilisateur
          userPosts,
          userPostsCount,

          // Événements de l'utilisateur
          userEvents,
          userEventsCount,

          // Favoris de l'utilisateur
          userFavoritesCount,

          // Badges de l'utilisateur
          userBadges,

          // Statistiques d'engagement
          totalViews,
          totalLikes,
        ] = await Promise.all([
          // Places créées par l'utilisateur (avec reviews et favoris)
          prisma.place.findMany({
            where: { ownerId: userId },
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  reviews: true,
                  favorites: true,
                },
              },
            },
            take: 5,
            orderBy: { createdAt: "desc" },
          }),

          prisma.place.count({
            where: { ownerId: userId },
          }),

          // Articles publiés par l'utilisateur
          prisma.post.findMany({
            where: {
              authorId: userId,
              published: true,
            },
            select: {
              id: true,
              title: true,
              viewCount: true,
              likeCount: true,
              createdAt: true,
            },
            take: 5,
            orderBy: { createdAt: "desc" },
          }),

          prisma.post.count({
            where: {
              authorId: userId,
              published: true,
            },
          }),

          // Événements organisés par l'utilisateur
          prisma.event.findMany({
            where: { organizerId: userId },
            select: {
              id: true,
              title: true,
              participantCount: true,
              startDate: true,
            },
            take: 5,
            orderBy: { createdAt: "desc" },
          }),

          prisma.event.count({
            where: { organizerId: userId },
          }),

          // Favoris de l'utilisateur
          prisma.favorite.count({
            where: { userId },
          }),

          // Badges obtenus par l'utilisateur
          prisma.userBadge.findMany({
            where: { userId },
            include: {
              badge: {
                select: {
                  id: true,
                  title: true,
                  iconUrl: true,
                  category: true,
                  rarity: true,
                },
              },
            },
            orderBy: { earnedAt: "desc" },
          }),

          // Total des vues sur les articles de l'utilisateur
          prisma.post
            .aggregate({
              where: {
                authorId: userId,
                published: true,
              },
              _sum: {
                viewCount: true,
              },
            })
            .then((result) => result._sum.viewCount || 0),

          // Total des likes sur les articles de l'utilisateur
          prisma.post
            .aggregate({
              where: {
                authorId: userId,
                published: true,
              },
              _sum: {
                likeCount: true,
              },
            })
            .then((result) => result._sum.likeCount || 0),
        ]);

        // Calculs des statistiques dérivées
        const totalPlaceFavorites = userPlaces.reduce(
          (sum, place) => sum + place._count.favorites,
          0
        );
        const totalEventParticipants = userEvents.reduce(
          (sum, event) => sum + event.participantCount,
          0
        );

        // Calcul du score d'activité (0-100)
        const activityScore = Math.min(
          100,
          Math.round(
            userPlacesCount * 10 +
              userPostsCount * 5 +
              userEventsCount * 8 +
              userBadges.length * 3 +
              Math.min(totalViews / 100, 20)
          )
        );

        return {
          // Métriques principales
          totalPlaces: userPlacesCount,
          totalPosts: userPostsCount,
          totalEvents: userEventsCount,
          totalFavorites: userFavoritesCount,
          totalBadges: userBadges.length,

          // Métriques d'engagement
          totalViews,
          totalLikes,
          totalPlaceFavorites,
          totalEventParticipants,
          activityScore,

          // Données détaillées (pour affichage)
          recentPlaces: userPlaces,
          recentPosts: userPosts,
          recentEvents: userEvents,
          recentBadges: userBadges.slice(0, 3), // 3 derniers badges

          // Croissance (simulée pour l'instant - à améliorer avec des données historiques)
          growth: {
            places: userPlacesCount > 0 ? 10 : 0,
            posts: userPostsCount > 0 ? 15 : 0,
            events: userEventsCount > 0 ? 8 : 0,
            views: totalViews > 0 ? 25 : 0,
          },
        };
      },
      5 * 60 * 1000 // Cache 5 minutes
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques utilisateur:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques utilisateur" },
      { status: 500 }
    );
  }
}
