import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Tab = "global" | "posts" | "places" | "events" | "users";

function getDateRange(period: string, from?: string, to?: string) {
  if (from && to) {
    return { start: new Date(from), end: new Date(to) };
  }
  const end = new Date();
  const start = new Date();
  if (period === "7d") start.setDate(end.getDate() - 7);
  else if (period === "12m") start.setMonth(end.getMonth() - 12);
  else start.setDate(end.getDate() - 30);
  return { start, end };
}

function buildTimeSeries(
  records: { createdAt: Date }[],
  start: Date,
  end: Date,
  period: string
) {
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

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (
      !currentUser ||
      !["admin", "moderator"].includes(currentUser.role as string)
    ) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const tab = (searchParams.get("tab") || "global") as Tab;

    const validPeriods = ["7d", "30d", "12m"];
    const validTabs: Tab[] = ["global", "posts", "places", "events", "users"];

    if (!from && !validPeriods.includes(period)) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }
    if (!validTabs.includes(tab)) {
      return NextResponse.json({ error: "Onglet invalide" }, { status: 400 });
    }

    const { start, end } = getDateRange(period, from, to);
    const dateFilter = { createdAt: { gte: start, lte: end } };

    if (tab === "posts") {
      const views = await prisma.postView.findMany({
        where: dateFilter,
        select: {
          postId: true,
          ipAddress: true,
          referer: true,
          createdAt: true,
        },
      });
      const topPosts = await prisma.post.findMany({
        where: { views: { some: dateFilter } },
        select: {
          id: true,
          title: true,
          slug: true,
          _count: { select: { views: { where: dateFilter } } },
        },
        orderBy: { views: { _count: "desc" } },
        take: 10,
      });
      const uniqueViewers = new Set(
        views.filter((v) => v.ipAddress !== "").map((v) => v.ipAddress)
      ).size;
      const refererCounts: Record<string, number> = {};
      for (const v of views) {
        if (v.referer) {
          try {
            const host = new URL(v.referer).hostname;
            refererCounts[host] = (refererCounts[host] || 0) + 1;
          } catch {
            // ignore invalid URLs
          }
        }
      }
      const topReferers = Object.entries(refererCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([domain, count]) => ({ domain, count }));

      return NextResponse.json({
        tab,
        totalViews: views.length,
        uniqueViewers,
        timeSeries: buildTimeSeries(views, start, end, period),
        topItems: topPosts.map((p) => ({
          id: p.id,
          name: p.title,
          slug: p.slug,
          views: p._count.views,
        })),
        topReferers,
      });
    }

    if (tab === "places") {
      const views = await prisma.placeView.findMany({
        where: dateFilter,
        select: { placeId: true, ipAddress: true, createdAt: true },
      });
      const topPlaces = await prisma.place.findMany({
        where: { views: { some: dateFilter } },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { views: { where: dateFilter } } },
        },
        orderBy: { views: { _count: "desc" } },
        take: 10,
      });
      const uniqueViewers = new Set(
        views.filter((v) => v.ipAddress !== "").map((v) => v.ipAddress)
      ).size;
      return NextResponse.json({
        tab,
        totalViews: views.length,
        uniqueViewers,
        timeSeries: buildTimeSeries(views, start, end, period),
        topItems: topPlaces.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          views: p._count.views,
        })),
      });
    }

    if (tab === "events") {
      const views = await prisma.eventView.findMany({
        where: dateFilter,
        select: { eventId: true, ipAddress: true, createdAt: true },
      });
      const topEvents = await prisma.event.findMany({
        where: { views: { some: dateFilter } },
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
        take: 10,
      });
      const uniqueViewers = new Set(
        views.filter((v) => v.ipAddress !== "").map((v) => v.ipAddress)
      ).size;
      return NextResponse.json({
        tab,
        totalViews: views.length,
        uniqueViewers,
        timeSeries: buildTimeSeries(views, start, end, period),
        topItems: topEvents.map((e) => ({
          id: e.id,
          name: e.title,
          slug: e.slug,
          views: e._count.views,
          participants: e._count.participants,
        })),
      });
    }

    if (tab === "users") {
      const prevStart = new Date(
        start.getTime() - (end.getTime() - start.getTime())
      );
      const [
        newUsersCount,
        latestSignups,
        allNewUsersForSeries,
        totalUsers,
        roleDistribution,
        prevCount,
      ] = await Promise.all([
        prisma.user.count({
          where: { createdAt: { gte: start, lte: end }, deletedAt: null },
        }),
        prisma.user.findMany({
          where: { createdAt: { gte: start, lte: end }, deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.user.findMany({
          where: { createdAt: { gte: start, lte: end }, deletedAt: null },
          select: { createdAt: true },
        }),
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.groupBy({
          by: ["role"],
          where: { deletedAt: null },
          _count: { role: true },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: prevStart, lte: start },
            deletedAt: null,
          },
        }),
      ]);
      const growth =
        prevCount > 0
          ? Math.round(((newUsersCount - prevCount) / prevCount) * 100)
          : 0;

      return NextResponse.json({
        tab,
        totalUsers,
        newUsers: newUsersCount,
        growth,
        roleDistribution: roleDistribution.map((r) => ({
          role: r.role,
          count: r._count.role,
        })),
        latestSignups,
        timeSeries: buildTimeSeries(allNewUsersForSeries, start, end, period),
      });
    }

    // tab === "global"
    const [postViews, placeViews, eventViews, newUsers] = await Promise.all([
      prisma.postView.findMany({
        where: dateFilter,
        select: { ipAddress: true, createdAt: true },
      }),
      prisma.placeView.findMany({
        where: dateFilter,
        select: { ipAddress: true, createdAt: true },
      }),
      prisma.eventView.findMany({
        where: dateFilter,
        select: { ipAddress: true, createdAt: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: start, lte: end }, deletedAt: null },
      }),
    ]);

    const totalViews =
      postViews.length + placeViews.length + eventViews.length;
    const allIps = new Set([
      ...postViews.filter((v) => v.ipAddress !== "").map((v) => v.ipAddress),
      ...placeViews.filter((v) => v.ipAddress !== "").map((v) => v.ipAddress),
      ...eventViews.filter((v) => v.ipAddress !== "").map((v) => v.ipAddress),
    ]);

    const periodMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodMs);
    const prevDateFilter = { createdAt: { gte: prevStart, lte: start } };
    const [prevPost, prevPlace, prevEvent] = await Promise.all([
      prisma.postView.count({ where: prevDateFilter }),
      prisma.placeView.count({ where: prevDateFilter }),
      prisma.eventView.count({ where: prevDateFilter }),
    ]);
    const prevTotal = prevPost + prevPlace + prevEvent;
    const growth =
      prevTotal > 0
        ? Math.round(((totalViews - prevTotal) / prevTotal) * 100)
        : 0;

    return NextResponse.json({
      tab: "global",
      totalViews,
      uniqueViewers: allIps.size,
      newUsers,
      growth,
      series: {
        posts: buildTimeSeries(postViews, start, end, period),
        places: buildTimeSeries(placeViews, start, end, period),
        events: buildTimeSeries(eventViews, start, end, period),
      },
    });
  } catch (error) {
    console.error("Erreur analytics admin:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
