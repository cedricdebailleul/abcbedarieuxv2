import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Récupérer les contenus disponibles en parallèle
    const [events, places, posts] = await Promise.all([
      // Événements à venir et récents
      prisma.event.findMany({
        where: {
          OR: [
            { startDate: { gte: new Date() } }, // Événements futurs
            {
              startDate: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Événements des 30 derniers jours
              },
            },
          ],
          isPublished: true,
          isActive: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          description: true,
          startDate: true,
          endDate: true,
          locationName: true,
          locationAddress: true,
          locationCity: true,
          coverImage: true,
          isAllDay: true,
          category: true,
          place: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { startDate: "asc" },
        take: 20,
      }),

      // Places actives et vérifiées
      prisma.place.findMany({
        where: {
          status: "ACTIVE",
          isVerified: true,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          summary: true,
          description: true,
          type: true,
          street: true,
          city: true,
          phone: true,
          website: true,
          logo: true,
          coverImage: true,
          categories: {
            include: {
              category: {
                select: {
                  name: true,
                  icon: true,
                  color: true,
                },
              },
            },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      // Articles récents publiés
      prisma.post.findMany({
        where: {
          published: true,
          status: "PUBLISHED",
          publishedAt: { not: null },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          coverImage: true,
          publishedAt: true,
          author: {
            select: {
              name: true,
            },
          },
          category: {
            select: {
              name: true,
              color: true,
            },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: 20,
      }),
    ]);

    // Formatter les données pour l'interface
    const formattedEvents = events.map((event) => ({
      id: event.id,
      type: "event" as const,
      title: event.title,
      slug: event.slug,
      description: event.summary || event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      isAllDay: event.isAllDay,
      location:
        [event.locationName, event.locationAddress, event.locationCity]
          .filter(Boolean)
          .join(", ") || (event.place ? event.place.name : null),
      coverImage: event.coverImage,
      category: event.category,
      placeSlug: event.place?.slug,
      url: `/events/${event.slug}`, // URL vers la page de l'événement
    }));

    const formattedPlaces = places.map((place) => ({
      id: place.id,
      type: "place" as const,
      title: place.name,
      slug: place.slug,
      description: place.summary || place.description,
      location: `${place.street}, ${place.city}`,
      phone: place.phone,
      website: place.website,
      logo: place.logo,
      coverImage: place.coverImage,
      category: place.categories[0]?.category || null,
      url: `/places/${place.slug}`, // URL vers la page de la place
    }));

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      type: "post" as const,
      title: post.title,
      slug: post.slug,
      description: post.excerpt,
      publishedAt: post.publishedAt,
      coverImage: post.coverImage,
      author: post.author?.name,
      category: post.category,
      url: `/posts/${post.slug}`, // URL vers l'article
    }));

    return NextResponse.json({
      success: true,
      content: {
        events: formattedEvents,
        places: formattedPlaces,
        posts: formattedPosts,
      },
      stats: {
        eventsCount: events.length,
        placesCount: places.length,
        postsCount: posts.length,
        totalSubscribers: await prisma.newsletterSubscriber.count({
          where: { isActive: true, isVerified: true },
        }),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du contenu:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
