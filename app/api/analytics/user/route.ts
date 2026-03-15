import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getDateRange(period: string, from?: string, to?: string) {
  if (from && to) return { start: new Date(from), end: new Date(to) };
  const end = new Date();
  const start = new Date();
  if (period === "7d") start.setDate(end.getDate() - 7);
  else if (period === "12m") start.setMonth(end.getMonth() - 12);
  else start.setDate(end.getDate() - 30);
  return { start, end };
}

function buildTimeSeries(records: { createdAt: Date }[], start: Date, end: Date) {
  const diffDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const useWeekly = diffDays > 90;
  const buckets: Record<string, number> = {};
  for (const r of records) {
    const d = new Date(r.createdAt);
    let key: string;
    if (useWeekly) {
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(
        ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
      );
      key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
    } else {
      key = d.toISOString().slice(0, 10);
    }
    buckets[key] = (buckets[key] || 0) + 1;
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    if (!from && !["7d", "30d", "12m"].includes(period)) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }

    const { start, end } = getDateRange(period, from, to);
    const dateFilter = { createdAt: { gte: start, lte: end } };

    const [
      postViews,
      placeViews,
      eventViews,
      favoritesReceived,
      reviewsReceived,
      participants,
    ] = await Promise.all([
      prisma.postView.findMany({
        where: { post: { authorId: userId }, ...dateFilter },
        select: { postId: true, createdAt: true },
      }),
      prisma.placeView.findMany({
        where: { place: { ownerId: userId }, ...dateFilter },
        select: { placeId: true, createdAt: true },
      }),
      prisma.eventView.findMany({
        where: { event: { organizerId: userId }, ...dateFilter },
        select: { eventId: true, createdAt: true },
      }),
      prisma.favorite.count({
        where: {
          place: { ownerId: userId },
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.review.count({
        where: {
          place: { ownerId: userId },
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.eventParticipant.count({
        where: {
          event: { organizerId: userId },
          createdAt: { gte: start, lte: end },
        },
      }),
    ]);

    const topPosts = await prisma.post.findMany({
      where: { authorId: userId, views: { some: dateFilter } },
      select: {
        id: true,
        title: true,
        slug: true,
        _count: { select: { views: { where: dateFilter } } },
      },
      orderBy: { views: { _count: "desc" } },
      take: 5,
    });

    const topPlaces = await prisma.place.findMany({
      where: { ownerId: userId, views: { some: dateFilter } },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { views: { where: dateFilter } } },
      },
      orderBy: { views: { _count: "desc" } },
      take: 5,
    });

    const topEvents = await prisma.event.findMany({
      where: { organizerId: userId, views: { some: dateFilter } },
      select: {
        id: true,
        title: true,
        slug: true,
        _count: {
          select: {
            views: { where: dateFilter },
            participants: true,
          },
        },
      },
      orderBy: { views: { _count: "desc" } },
      take: 5,
    });

    const allViews = [
      ...postViews.map((v) => ({ createdAt: v.createdAt })),
      ...placeViews.map((v) => ({ createdAt: v.createdAt })),
      ...eventViews.map((v) => ({ createdAt: v.createdAt })),
    ];

    const [ownedPostCount, ownedPlaceCount, ownedEventCount] = await Promise.all([
      prisma.post.count({ where: { authorId: userId } }),
      prisma.place.count({ where: { ownerId: userId } }),
      prisma.event.count({ where: { organizerId: userId } }),
    ]);
    const hasContent = ownedPostCount > 0 || ownedPlaceCount > 0 || ownedEventCount > 0;

    return NextResponse.json({
      hasContent,
      totalViews: allViews.length,
      postViews: postViews.length,
      placeViews: placeViews.length,
      eventViews: eventViews.length,
      favoritesReceived,
      reviewsReceived,
      participants,
      timeSeries: buildTimeSeries(allViews, start, end),
      topPosts: topPosts.map((p) => ({
        id: p.id,
        name: p.title,
        slug: p.slug,
        views: p._count.views,
      })),
      topPlaces: topPlaces.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        views: p._count.views,
      })),
      topEvents: topEvents.map((e) => ({
        id: e.id,
        name: e.title,
        slug: e.slug,
        views: e._count.views,
        participants: e._count.participants,
      })),
    });
  } catch (error) {
    console.error("Erreur analytics user:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
