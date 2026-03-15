# Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add view tracking for places and events, and build analytics dashboards for admins (global, tabbed by entity) and connected users (personal stats).

**Architecture:** Two new Prisma models (`PlaceView`, `EventView`) mirror `PostView`. A null-rendering `<TrackView>` client component fires a POST from Server Component pages. Two API routes compute analytics. Shared UI components (`PeriodSelector`, `AnalyticsKpiCards`, `AnalyticsChart`, `AnalyticsTopTable`) are reused across admin and user dashboards.

**Tech Stack:** Next.js 15 App Router, Prisma + PostgreSQL, Better Auth, shadcn/ui, recharts, TypeScript, Tailwind CSS, @tabler/icons-react

**Worktree:** `c:/abcbedarieuxv2/.worktrees/feature-analytics`
**Spec:** `docs/superpowers/specs/2026-03-15-analytics-dashboard-design.md`

---

## Chunk 1: Data Layer — Prisma Schema + Migration

**Files:**
- Modify: `prisma/schema.prisma` — add `PlaceView`, `EventView` models + relations on `Place` and `Event`

---

### Task 1: Add PlaceView and EventView to Prisma schema

- [ ] **Step 1: Open `prisma/schema.prisma` and find the Place model closing brace**

  Run: `grep -n "@@map(\"places\")" prisma/schema.prisma`

- [ ] **Step 2: Add `views` relation to Place model**

  In `prisma/schema.prisma`, inside the `Place` model (before the closing `}`), add:
  ```prisma
  views     PlaceView[]
  ```

- [ ] **Step 3: Add `views` relation to Event model**

  In `prisma/schema.prisma`, inside the `Event` model (before the closing `}`), add:
  ```prisma
  views     EventView[]
  ```

- [ ] **Step 4: Add PlaceView model after the PostView model block**

  In `prisma/schema.prisma`, after the `model PostView { ... }` block, add:

  ```prisma
  model PlaceView {
    id      String @id @default(cuid())
    placeId String
    place   Place  @relation(fields: [placeId], references: [id], onDelete: Cascade)

    ipAddress String @default("")
    userAgent String @default("")
    referer   String @default("")

    country String?
    region  String?
    city    String?

    createdAt DateTime @default(now())

    @@index([placeId])
    @@index([ipAddress])
    @@index([createdAt])
    @@map("place_views")
  }

  model EventView {
    id      String @id @default(cuid())
    eventId String
    event   Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)

    ipAddress String @default("")
    userAgent String @default("")
    referer   String @default("")

    country String?
    region  String?
    city    String?

    createdAt DateTime @default(now())

    @@index([eventId])
    @@index([ipAddress])
    @@index([createdAt])
    @@map("event_views")
  }
  ```

- [ ] **Step 5: Validate schema**

  Run: `pnpm db:generate`
  Expected: No errors, Prisma client generated successfully.

- [ ] **Step 6: Run migration**

  Run: `pnpm db:migrate`
  When prompted for migration name, enter: `add_place_event_views`
  Expected: Migration applied, two new tables `place_views` and `event_views` created.

- [ ] **Step 7: Verify tables exist**

  Run: `pnpm db:studio`
  Check that `place_views` and `event_views` appear in the sidebar with correct columns.
  (Close Prisma Studio after verifying — Ctrl+C)

- [ ] **Step 8: Commit**

  ```bash
  cd .worktrees/feature-analytics
  git add prisma/schema.prisma prisma/migrations/
  git commit -m "feat(analytics): add PlaceView and EventView models"
  ```

---

## Chunk 2: Tracking Layer

**Files:**
- Create: `components/analytics/track-view.tsx` — null-rendering client component
- Create: `app/api/places/[slug]/view/route.ts` — record PlaceView
- Create: `app/api/events/[slug]/view/route.ts` — record EventView
- Modify: `app/(front)/places/[slug]/page.tsx` — add `<TrackView>`
- Modify: `app/(front)/events/[slug]/page.tsx` — add `<TrackView>`

---

### Task 2: TrackView client component

- [ ] **Step 1: Create `components/analytics/track-view.tsx`**

  ```tsx
  "use client";

  import { useEffect } from "react";

  interface TrackViewProps {
    type: "place" | "event";
    slug: string;
  }

  export function TrackView({ type, slug }: TrackViewProps) {
    useEffect(() => {
      fetch(`/api/${type}s/${slug}/view`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {
        // Silently ignore — tracking must never break the user experience
      });
    }, [type, slug]);

    return null;
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/analytics/track-view.tsx
  git commit -m "feat(analytics): add TrackView client component"
  ```

---

### Task 3: Place view tracking API route

- [ ] **Step 1: Create directory and file**

  Create `app/api/places/[slug]/view/route.ts`:

  ```ts
  import { type NextRequest, NextResponse } from "next/server";
  import { prisma } from "@/lib/prisma";

  export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
  ) {
    try {
      const { slug } = await params;

      const place = await prisma.place.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!place) {
        return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
      }

      const forwardedFor = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "";
      const userAgent = request.headers.get("user-agent") || "";
      const referer = (request.headers.get("referer") || "").substring(0, 255);

      if (ipAddress) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const existing = await prisma.placeView.findFirst({
          where: {
            placeId: place.id,
            ipAddress,
            createdAt: { gte: tenMinutesAgo },
          },
        });
        if (existing) {
          return NextResponse.json({ success: true });
        }
      }

      await prisma.placeView.create({
        data: { placeId: place.id, ipAddress, userAgent, referer },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Erreur enregistrement vue place:", error);
      return NextResponse.json({ success: false });
    }
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/api/places/
  git commit -m "feat(analytics): add place view tracking API route"
  ```

---

### Task 4: Event view tracking API route

- [ ] **Step 1: Create `app/api/events/[slug]/view/route.ts`**

  ```ts
  import { type NextRequest, NextResponse } from "next/server";
  import { prisma } from "@/lib/prisma";

  export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
  ) {
    try {
      const { slug } = await params;

      const event = await prisma.event.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!event) {
        return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
      }

      const forwardedFor = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "";
      const userAgent = request.headers.get("user-agent") || "";
      const referer = (request.headers.get("referer") || "").substring(0, 255);

      if (ipAddress) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const existing = await prisma.eventView.findFirst({
          where: {
            eventId: event.id,
            ipAddress,
            createdAt: { gte: tenMinutesAgo },
          },
        });
        if (existing) {
          return NextResponse.json({ success: true });
        }
      }

      await prisma.eventView.create({
        data: { eventId: event.id, ipAddress, userAgent, referer },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Erreur enregistrement vue événement:", error);
      return NextResponse.json({ success: false });
    }
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/api/events/
  git commit -m "feat(analytics): add event view tracking API route"
  ```

---

### Task 5: Add TrackView to place and event detail pages

- [ ] **Step 1: Add import and component to place detail page**

  In `app/(front)/places/[slug]/page.tsx`:

  1. Add import at the top (with other imports):
     ```tsx
     import { TrackView } from "@/components/analytics/track-view";
     ```
  2. Find the return statement's root JSX element and add as first child:
     ```tsx
     <TrackView type="place" slug={place.slug} />
     ```

- [ ] **Step 2: Add import and component to event detail page**

  In `app/(front)/events/[slug]/page.tsx`:

  1. Add import:
     ```tsx
     import { TrackView } from "@/components/analytics/track-view";
     ```
  2. Add as first child of root JSX:
     ```tsx
     <TrackView type="event" slug={event.slug} />
     ```

- [ ] **Step 3: Manual test — visit a place page**

  Run: `pnpm dev` (in worktree)
  Visit any place detail page (e.g. `/places/[slug]`)
  Open Network tab in DevTools — verify a POST to `/api/places/[slug]/view` returns 200 `{ success: true }`
  Check Prisma Studio: `place_views` table should have one record.

- [ ] **Step 4: Commit**

  ```bash
  git add app/\(front\)/places/ app/\(front\)/events/
  git commit -m "feat(analytics): track place and event page views"
  ```

---

## Chunk 3: Analytics API Routes

**Files:**
- Create: `app/api/analytics/admin/route.ts` — admin analytics endpoint
- Create: `app/api/analytics/user/route.ts` — user personal analytics endpoint

---

### Task 6: Admin analytics API

- [ ] **Step 1: Create `app/api/analytics/admin/route.ts`**

  ```ts
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
    else start.setDate(end.getDate() - 30); // default 30d
    return { start, end };
  }

  function buildTimeSeries(
    records: { createdAt: Date }[],
    start: Date,
    end: Date,
    period: string
  ) {
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const useWeekly = diffDays > 90;
    const buckets: Record<string, number> = {};

    for (const r of records) {
      const d = new Date(r.createdAt);
      let key: string;
      if (useWeekly) {
        // ISO week key: YYYY-WXX
        const jan1 = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
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

      if (!currentUser || !["admin", "moderator"].includes(currentUser.role ?? "")) {
        return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
      }

      const { searchParams } = new URL(request.url);
      const period = searchParams.get("period") || "30d";
      const from = searchParams.get("from") || undefined;
      const to = searchParams.get("to") || undefined;
      const tab = (searchParams.get("tab") || "global") as Tab;

      const validPeriods = ["7d", "30d", "12m"];
      const validTabs: Tab[] = ["global", "posts", "places", "events", "users"];

      if (!from && !validPeriods.includes(period)) {
        return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
      }
      if (!validTabs.includes(tab)) {
        return NextResponse.json({ error: "Onglet invalide" }, { status: 400 });
      }

      const { start, end } = getDateRange(period, from, to);
      const dateFilter = { createdAt: { gte: start, lte: end } };

      if (tab === "posts") {
        const views = await prisma.postView.findMany({
          where: dateFilter,
          select: { postId: true, ipAddress: true, referer: true, createdAt: true },
        });
        const topPosts = await prisma.post.findMany({
          where: { views: { some: dateFilter } },
          select: {
            id: true, title: true, slug: true,
            _count: { select: { views: { where: dateFilter } } },
          },
          orderBy: { views: { _count: "desc" } },
          take: 10,
        });
        const uniqueViewers = new Set(views.filter(v => v.ipAddress !== "").map(v => v.ipAddress)).size;
        const refererCounts: Record<string, number> = {};
        for (const v of views) {
          if (v.referer) {
            try {
              const host = new URL(v.referer).hostname;
              refererCounts[host] = (refererCounts[host] || 0) + 1;
            } catch {}
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
          topItems: topPosts.map(p => ({ id: p.id, name: p.title, slug: p.slug, views: p._count.views })),
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
            id: true, name: true, slug: true,
            _count: { select: { views: { where: dateFilter } } },
          },
          orderBy: { views: { _count: "desc" } },
          take: 10,
        });
        const uniqueViewers = new Set(views.filter(v => v.ipAddress !== "").map(v => v.ipAddress)).size;
        return NextResponse.json({
          tab,
          totalViews: views.length,
          uniqueViewers,
          timeSeries: buildTimeSeries(views, start, end, period),
          topItems: topPlaces.map(p => ({ id: p.id, name: p.name, slug: p.slug, views: p._count.views })),
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
            id: true, title: true, slug: true,
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
        const uniqueViewers = new Set(views.filter(v => v.ipAddress !== "").map(v => v.ipAddress)).size;
        return NextResponse.json({
          tab,
          totalViews: views.length,
          uniqueViewers,
          timeSeries: buildTimeSeries(views, start, end, period),
          topItems: topEvents.map(e => ({
            id: e.id, name: e.title, slug: e.slug,
            views: e._count.views,
            participants: e._count.participants,
          })),
        });
      }

      if (tab === "users") {
        const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
        const [newUsersCount, latestSignups, totalUsers, roleDistribution, prevCount] = await Promise.all([
          prisma.user.count({ where: { createdAt: { gte: start, lte: end }, deletedAt: null } }),
          prisma.user.findMany({
            where: { createdAt: { gte: start, lte: end }, deletedAt: null },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
          prisma.user.count({ where: { deletedAt: null } }),
          prisma.user.groupBy({
            by: ["role"],
            where: { deletedAt: null },
            _count: { role: true },
          }),
          prisma.user.count({
            where: { createdAt: { gte: prevStart, lte: start }, deletedAt: null },
          }),
        ]);
        const growth = prevCount > 0 ? Math.round(((newUsersCount - prevCount) / prevCount) * 100) : 0;

        return NextResponse.json({
          tab,
          totalUsers,
          newUsers: newUsersCount,
          growth,
          roleDistribution: roleDistribution.map(r => ({ role: r.role, count: r._count.role })),
          latestSignups,
          timeSeries: buildTimeSeries(latestSignups, start, end, period),
        });
      }

      // tab === "global"
      const [postViews, placeViews, eventViews, newUsers] = await Promise.all([
        prisma.postView.findMany({ where: dateFilter, select: { ipAddress: true, createdAt: true } }),
        prisma.placeView.findMany({ where: dateFilter, select: { ipAddress: true, createdAt: true } }),
        prisma.eventView.findMany({ where: dateFilter, select: { ipAddress: true, createdAt: true } }),
        prisma.user.count({ where: { createdAt: { gte: start, lte: end }, deletedAt: null } }),
      ]);

      const totalViews = postViews.length + placeViews.length + eventViews.length;
      const allIps = new Set([
        ...postViews.filter(v => v.ipAddress !== "").map(v => v.ipAddress),
        ...placeViews.filter(v => v.ipAddress !== "").map(v => v.ipAddress),
        ...eventViews.filter(v => v.ipAddress !== "").map(v => v.ipAddress),
      ]);

      // Prev period for growth
      const periodMs = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - periodMs);
      const prevDateFilter = { createdAt: { gte: prevStart, lte: start } };
      const [prevPost, prevPlace, prevEvent] = await Promise.all([
        prisma.postView.count({ where: prevDateFilter }),
        prisma.placeView.count({ where: prevDateFilter }),
        prisma.eventView.count({ where: prevDateFilter }),
      ]);
      const prevTotal = prevPost + prevPlace + prevEvent;
      const growth = prevTotal > 0 ? Math.round(((totalViews - prevTotal) / prevTotal) * 100) : 0;

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
  ```

- [ ] **Step 2: Test the endpoint manually**

  With dev server running:
  ```bash
  curl -s "http://localhost:3000/api/analytics/admin?tab=global&period=30d" \
    -H "Cookie: <your session cookie>" | head -200
  ```
  Expected: JSON with `totalViews`, `uniqueViewers`, `series` keys.

- [ ] **Step 3: Commit**

  ```bash
  git add app/api/analytics/
  git commit -m "feat(analytics): add admin analytics API route"
  ```

---

### Task 7: User analytics API

- [ ] **Step 1: Create `app/api/analytics/user/route.ts`**

  ```ts
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
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const useWeekly = diffDays > 90;
    const buckets: Record<string, number> = {};
    for (const r of records) {
      const d = new Date(r.createdAt);
      let key: string;
      if (useWeekly) {
        const jan1 = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
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
        return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
      }

      const { start, end } = getDateRange(period, from, to);
      const dateFilter = { createdAt: { gte: start, lte: end } };

      const [postViews, placeViews, eventViews, favoritesReceived, reviewsReceived, participants] =
        await Promise.all([
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
            where: { place: { ownerId: userId }, createdAt: { gte: start, lte: end } },
          }),
          prisma.review.count({
            where: { place: { ownerId: userId }, createdAt: { gte: start, lte: end } },
          }),
          prisma.eventParticipant.count({
            where: { event: { organizerId: userId }, createdAt: { gte: start, lte: end } },
          }),
        ]);

      // Top posts
      const topPosts = await prisma.post.findMany({
        where: { authorId: userId, views: { some: dateFilter } },
        select: {
          id: true, title: true, slug: true,
          _count: { select: { views: { where: dateFilter } } },
        },
        orderBy: { views: { _count: "desc" } },
        take: 5,
      });

      // Top places
      const topPlaces = await prisma.place.findMany({
        where: { ownerId: userId, views: { some: dateFilter } },
        select: {
          id: true, name: true, slug: true,
          _count: { select: { views: { where: dateFilter } } },
        },
        orderBy: { views: { _count: "desc" } },
        take: 5,
      });

      // Top events
      const topEvents = await prisma.event.findMany({
        where: { organizerId: userId, views: { some: dateFilter } },
        select: {
          id: true, title: true, slug: true,
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
        ...postViews.map(v => ({ createdAt: v.createdAt })),
        ...placeViews.map(v => ({ createdAt: v.createdAt })),
        ...eventViews.map(v => ({ createdAt: v.createdAt })),
      ];

      return NextResponse.json({
        totalViews: allViews.length,
        postViews: postViews.length,
        placeViews: placeViews.length,
        eventViews: eventViews.length,
        favoritesReceived,
        reviewsReceived,
        participants,
        timeSeries: buildTimeSeries(allViews, start, end),
        topPosts: topPosts.map(p => ({ id: p.id, name: p.title, slug: p.slug, views: p._count.views })),
        topPlaces: topPlaces.map(p => ({ id: p.id, name: p.name, slug: p.slug, views: p._count.views })),
        topEvents: topEvents.map(e => ({
          id: e.id, name: e.title, slug: e.slug,
          views: e._count.views,
          participants: e._count.participants,
        })),
      });
    } catch (error) {
      console.error("Erreur analytics user:", error);
      return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/api/analytics/user/
  git commit -m "feat(analytics): add user personal analytics API route"
  ```

---

## Chunk 4: Shared UI Components

**Files:**
- Create: `components/analytics/period-selector.tsx`
- Create: `components/analytics/analytics-kpi-cards.tsx`
- Create: `components/analytics/analytics-chart.tsx`
- Create: `components/analytics/analytics-top-table.tsx`

---

### Task 8: PeriodSelector component

- [ ] **Step 1: Create `components/analytics/period-selector.tsx`**

  ```tsx
  "use client";

  import { useState } from "react";
  import { Button } from "@/components/ui/button";
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
  import { Calendar } from "@/components/ui/calendar";
  import { CalendarIcon } from "lucide-react";
  import { format } from "date-fns";
  import { fr } from "date-fns/locale";
  import type { DateRange } from "react-day-picker";

  export type Period = "7d" | "30d" | "12m" | "custom";

  interface PeriodSelectorProps {
    value: Period;
    customRange?: { from: string; to: string };
    onChange: (period: Period, range?: { from: string; to: string }) => void;
  }

  const PRESETS: { label: string; value: Period }[] = [
    { label: "7j", value: "7d" },
    { label: "30j", value: "30d" },
    { label: "12m", value: "12m" },
  ];

  export function PeriodSelector({ value, customRange, onChange }: PeriodSelectorProps) {
    const [open, setOpen] = useState(false);
    const [range, setRange] = useState<DateRange | undefined>(
      customRange
        ? { from: new Date(customRange.from), to: new Date(customRange.to) }
        : undefined
    );

    const handlePreset = (preset: Period) => {
      onChange(preset);
    };

    const handleCustomApply = () => {
      if (range?.from && range?.to) {
        onChange("custom", {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
        });
        setOpen(false);
      }
    };

    return (
      <div className="flex items-center gap-1">
        {PRESETS.map(preset => (
          <Button
            key={preset.value}
            variant={value === preset.value ? "default" : "outline"}
            size="sm"
            onClick={() => handlePreset(preset.value)}
          >
            {preset.label}
          </Button>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={value === "custom" ? "default" : "outline"}
              size="sm"
              className="gap-1"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {value === "custom" && customRange
                ? `${format(new Date(customRange.from), "dd/MM", { locale: fr })} – ${format(new Date(customRange.to), "dd/MM", { locale: fr })}`
                : "Personnalisé"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="end">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              locale={fr}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
            />
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={handleCustomApply} disabled={!range?.from || !range?.to}>
                Appliquer
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/analytics/period-selector.tsx
  git commit -m "feat(analytics): add PeriodSelector component"
  ```

---

### Task 9: AnalyticsKpiCards component

- [ ] **Step 1: Create `components/analytics/analytics-kpi-cards.tsx`**

  ```tsx
  import { Card, CardContent } from "@/components/ui/card";
  import { TrendingUp, TrendingDown, Minus } from "lucide-react";
  import { cn } from "@/lib/utils";

  interface KpiCard {
    label: string;
    value: string | number;
    growth?: number;
    icon?: React.ReactNode;
  }

  interface AnalyticsKpiCardsProps {
    cards: KpiCard[];
  }

  const gridCols: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  export function AnalyticsKpiCards({ cards }: AnalyticsKpiCardsProps) {
    const colClass = gridCols[Math.min(cards.length, 4)] ?? "grid-cols-2 md:grid-cols-4";
    return (
      <div className={cn("grid gap-4", colClass)}>
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                {card.icon && <div className="text-muted-foreground">{card.icon}</div>}
              </div>
              <p className="text-2xl font-bold">{card.value.toLocaleString("fr-FR")}</p>
              {card.growth !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {card.growth > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  ) : card.growth < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      card.growth > 0 ? "text-green-500" : card.growth < 0 ? "text-red-500" : "text-muted-foreground"
                    )}
                  >
                    {card.growth > 0 ? "+" : ""}{card.growth}% vs période précédente
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/analytics/analytics-kpi-cards.tsx
  git commit -m "feat(analytics): add AnalyticsKpiCards component"
  ```

---

### Task 10: AnalyticsChart component

- [ ] **Step 1: Create `components/analytics/analytics-chart.tsx`**

  ```tsx
  "use client";

  import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
  } from "recharts";

  interface Series {
    key: string;
    label: string;
    color: string;
    data: { date: string; count: number }[];
  }

  interface AnalyticsChartProps {
    series: Series[];
    type?: "bar" | "line";
    height?: number;
  }

  function mergeSeriesData(series: Series[]) {
    const map: Record<string, Record<string, number>> = {};
    for (const s of series) {
      for (const point of s.data) {
        if (!map[point.date]) map[point.date] = { date: point.date as unknown as number };
        map[point.date][s.key] = point.count;
      }
    }
    return Object.values(map).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
  }

  export function AnalyticsChart({ series, type = "line", height = 260 }: AnalyticsChartProps) {
    const data = mergeSeriesData(series);
    const ChartComponent = type === "bar" ? BarChart : LineChart;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip />
          {series.length > 1 && <Legend />}
          {series.map((s) =>
            type === "bar" ? (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
            ) : (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
              />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/analytics/analytics-chart.tsx
  git commit -m "feat(analytics): add AnalyticsChart component"
  ```

---

### Task 11: AnalyticsTopTable component

- [ ] **Step 1: Create `components/analytics/analytics-top-table.tsx`**

  ```tsx
  import Link from "next/link";
  import { Badge } from "@/components/ui/badge";
  import { Eye } from "lucide-react";

  interface TopItem {
    id: string;
    name: string;
    slug: string;
    views: number;
    participants?: number;
  }

  interface AnalyticsTopTableProps {
    items: TopItem[];
    hrefPrefix: string;
    emptyMessage?: string;
    showParticipants?: boolean;
  }

  export function AnalyticsTopTable({
    items,
    hrefPrefix,
    emptyMessage = "Aucune donnée sur la période",
    showParticipants = false,
  }: AnalyticsTopTableProps) {
    if (items.length === 0) {
      return (
        <div className="text-center text-sm text-muted-foreground py-8">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-mono text-muted-foreground w-5 shrink-0">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <Link
                href={`${hrefPrefix}/${item.slug}`}
                className="text-sm font-medium hover:underline truncate block"
              >
                {item.name}
              </Link>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showParticipants && item.participants !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  {item.participants} part.
                </Badge>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                {item.views.toLocaleString("fr-FR")}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/analytics/analytics-top-table.tsx
  git commit -m "feat(analytics): add AnalyticsTopTable component"
  ```

---

## Chunk 5: Admin Analytics Page + Widget

**Files:**
- Create: `app/(dashboard)/dashboard/admin/analytics/page.tsx`
- Create: `components/analytics/analytics-widget.tsx`
- Modify: `app/(dashboard)/dashboard/admin/page.tsx` — add AnalyticsWidget
- Modify: `components/sidebar/app-sidebar.tsx` — add Analytics nav link

---

### Task 12: Admin analytics page

- [ ] **Step 1: Create `app/(dashboard)/dashboard/admin/analytics/page.tsx`**

  ```tsx
  "use client";

  import { useState, useEffect, useCallback } from "react";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { PeriodSelector, type Period } from "@/components/analytics/period-selector";
  import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
  import { AnalyticsChart } from "@/components/analytics/analytics-chart";
  import { AnalyticsTopTable } from "@/components/analytics/analytics-top-table";
  import { IconEye, IconUsers, IconBuilding, IconCalendar, IconArticle } from "@tabler/icons-react";
  import { Loader2 } from "lucide-react";

  const STORAGE_KEY = "admin-analytics-period";

  export default function AdminAnalyticsPage() {
    const [tab, setTab] = useState("global");
    const [period, setPeriod] = useState<Period>(() => {
      if (typeof window !== "undefined") {
        return (localStorage.getItem(STORAGE_KEY) as Period) || "30d";
      }
      return "30d";
    });
    const [customRange, setCustomRange] = useState<{ from: string; to: string } | undefined>();
    const [data, setData] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ tab, period });
        if (period === "custom" && customRange) {
          params.set("from", customRange.from);
          params.set("to", customRange.to);
        }
        const res = await fetch(`/api/analytics/admin?${params}`);
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    }, [tab, period, customRange]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handlePeriodChange = (p: Period, range?: { from: string; to: string }) => {
      setPeriod(p);
      setCustomRange(range);
      if (p !== "custom") localStorage.setItem(STORAGE_KEY, p);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Statistiques globales de la plateforme</p>
          </div>
          <PeriodSelector value={period} customRange={customRange} onChange={handlePeriodChange} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="global" className="gap-1.5">
              <IconEye className="h-4 w-4" /> Global
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-1.5">
              <IconArticle className="h-4 w-4" /> Articles
            </TabsTrigger>
            <TabsTrigger value="places" className="gap-1.5">
              <IconBuilding className="h-4 w-4" /> Places
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5">
              <IconCalendar className="h-4 w-4" /> Événements
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <IconUsers className="h-4 w-4" /> Utilisateurs
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <TabsContent value="global" className="space-y-6 mt-6">
                {data && (
                  <>
                    <AnalyticsKpiCards cards={[
                      { label: "Vues totales", value: (data.totalViews as number) ?? 0, growth: data.growth as number, icon: <IconEye className="h-4 w-4" /> },
                      { label: "Visiteurs uniques", value: (data.uniqueViewers as number) ?? 0 },
                      { label: "Nouveaux inscrits", value: (data.newUsers as number) ?? 0 },
                    ]} />
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Vues dans le temps</CardTitle></CardHeader>
                      <CardContent>
                        <AnalyticsChart
                          type="line"
                          series={[
                            { key: "posts", label: "Articles", color: "#6366f1", data: ((data.series as Record<string, {date:string;count:number}[]>)?.posts) ?? [] },
                            { key: "places", label: "Places", color: "#10b981", data: ((data.series as Record<string, {date:string;count:number}[]>)?.places) ?? [] },
                            { key: "events", label: "Événements", color: "#f59e0b", data: ((data.series as Record<string, {date:string;count:number}[]>)?.events) ?? [] },
                          ]}
                        />
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="posts" className="space-y-6 mt-6">
                {data && (
                  <>
                    <AnalyticsKpiCards cards={[
                      { label: "Vues articles", value: (data.totalViews as number) ?? 0 },
                      { label: "Visiteurs uniques", value: (data.uniqueViewers as number) ?? 0 },
                    ]} />
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Vues dans le temps</CardTitle></CardHeader>
                        <CardContent>
                          <AnalyticsChart type="bar" series={[{ key: "posts", label: "Articles", color: "#6366f1", data: (data.timeSeries as {date:string;count:number}[]) ?? [] }]} />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Top articles</CardTitle></CardHeader>
                        <CardContent>
                          <AnalyticsTopTable items={(data.topItems as {id:string;name:string;slug:string;views:number}[]) ?? []} hrefPrefix="/posts" />
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="places" className="space-y-6 mt-6">
                {data && (
                  <>
                    <AnalyticsKpiCards cards={[
                      { label: "Vues places", value: (data.totalViews as number) ?? 0 },
                      { label: "Visiteurs uniques", value: (data.uniqueViewers as number) ?? 0 },
                    ]} />
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Vues dans le temps</CardTitle></CardHeader>
                        <CardContent>
                          <AnalyticsChart type="bar" series={[{ key: "places", label: "Places", color: "#10b981", data: (data.timeSeries as {date:string;count:number}[]) ?? [] }]} />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Top places</CardTitle></CardHeader>
                        <CardContent>
                          <AnalyticsTopTable items={(data.topItems as {id:string;name:string;slug:string;views:number}[]) ?? []} hrefPrefix="/places" />
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="events" className="space-y-6 mt-6">
                {data && (
                  <>
                    <AnalyticsKpiCards cards={[
                      { label: "Vues événements", value: (data.totalViews as number) ?? 0 },
                      { label: "Visiteurs uniques", value: (data.uniqueViewers as number) ?? 0 },
                    ]} />
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Vues dans le temps</CardTitle></CardHeader>
                        <CardContent>
                          <AnalyticsChart type="bar" series={[{ key: "events", label: "Événements", color: "#f59e0b", data: (data.timeSeries as {date:string;count:number}[]) ?? [] }]} />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Top événements</CardTitle></CardHeader>
                        <CardContent>
                          <AnalyticsTopTable items={(data.topItems as {id:string;name:string;slug:string;views:number;participants?:number}[]) ?? []} hrefPrefix="/events" showParticipants />
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="users" className="space-y-6 mt-6">
                {data && (
                  <>
                    <AnalyticsKpiCards cards={[
                      { label: "Total utilisateurs", value: (data.totalUsers as number) ?? 0 },
                      { label: "Nouveaux inscrits", value: (data.newUsers as number) ?? 0, growth: data.growth as number },
                    ]} />
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Inscriptions dans le temps</CardTitle></CardHeader>
                      <CardContent>
                        <AnalyticsChart type="bar" series={[{ key: "users", label: "Inscriptions", color: "#8b5cf6", data: (data.timeSeries as {date:string;count:number}[]) ?? [] }]} />
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/\(dashboard\)/dashboard/admin/analytics/
  git commit -m "feat(analytics): add admin analytics page with tabs"
  ```

---

### Task 13: AnalyticsWidget for admin home

- [ ] **Step 1: Create `components/analytics/analytics-widget.tsx`**

  ```tsx
  "use client";

  import { useEffect, useState } from "react";
  import Link from "next/link";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { IconEye, IconUsers, IconBuilding } from "@tabler/icons-react";
  import { TrendingUp, ArrowRight } from "lucide-react";

  interface WidgetData {
    totalViews: number;
    newUsers: number;
    growth: number;
  }

  export function AnalyticsWidget() {
    const [data, setData] = useState<WidgetData | null>(null);

    useEffect(() => {
      fetch("/api/analytics/admin?tab=global&period=7d")
        .then(r => r.json())
        .then(setData)
        .catch(() => {});
    }, []);

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Analytics — 7 derniers jours
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin/analytics" className="flex items-center gap-1 text-xs">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <IconEye className="h-4 w-4 text-indigo-500 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{data.totalViews.toLocaleString("fr-FR")}</p>
                  <p className="text-xs text-muted-foreground">Vues totales</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IconUsers className="h-4 w-4 text-purple-500 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{data.newUsers.toLocaleString("fr-FR")}</p>
                  <p className="text-xs text-muted-foreground">Nouveaux inscrits</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className={`h-4 w-4 shrink-0 ${data.growth >= 0 ? "text-green-500" : "text-red-500"}`} />
                <div>
                  <p className="text-lg font-bold">{data.growth > 0 ? "+" : ""}{data.growth}%</p>
                  <p className="text-xs text-muted-foreground">Croissance</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-12 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  ```

- [ ] **Step 2: Add AnalyticsWidget to admin home page**

  In `app/(dashboard)/dashboard/admin/page.tsx`:

  1. Add import:
     ```tsx
     import { AnalyticsWidget } from "@/components/analytics/analytics-widget";
     ```
  2. After `<AdminStatsCards />`, add:
     ```tsx
     <AnalyticsWidget />
     ```

- [ ] **Step 3: Add Analytics link to sidebar**

  In `components/sidebar/app-sidebar.tsx`, in the `adminAll` array, add after the `"Vue d'ensemble"` entry:
  ```ts
  {
    title: "Analytics",
    url: "/dashboard/admin/analytics",
  },
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add components/analytics/analytics-widget.tsx \
    app/\(dashboard\)/dashboard/admin/page.tsx \
    components/sidebar/app-sidebar.tsx
  git commit -m "feat(analytics): add analytics widget and sidebar link"
  ```

---

## Chunk 6: User Dashboard Analytics Tab

**Files:**
- Create: `components/analytics/user-analytics.tsx` — full user analytics tab content
- Modify: `app/(dashboard)/dashboard/page.tsx` — replace ViewsAnalytics with UserAnalytics

---

### Task 14: UserAnalytics component

- [ ] **Step 1: Create `components/analytics/user-analytics.tsx`**

  ```tsx
  "use client";

  import { useState, useEffect, useCallback } from "react";
  import Link from "next/link";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { PeriodSelector, type Period } from "@/components/analytics/period-selector";
  import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
  import { AnalyticsChart } from "@/components/analytics/analytics-chart";
  import { AnalyticsTopTable } from "@/components/analytics/analytics-top-table";
  import { IconEye, IconStar, IconUsers, IconHeart } from "@tabler/icons-react";
  import { Loader2, PlusCircle } from "lucide-react";
  import { Button } from "@/components/ui/button";

  const STORAGE_KEY = "analytics-period";

  interface AnalyticsData {
    totalViews: number;
    postViews: number;
    placeViews: number;
    eventViews: number;
    favoritesReceived: number;
    reviewsReceived: number;
    participants: number;
    timeSeries: { date: string; count: number }[];
    topPosts: { id: string; name: string; slug: string; views: number }[];
    topPlaces: { id: string; name: string; slug: string; views: number }[];
    topEvents: { id: string; name: string; slug: string; views: number; participants: number }[];
  }

  export function UserAnalytics() {
    const [period, setPeriod] = useState<Period>(() => {
      if (typeof window !== "undefined") {
        return (localStorage.getItem(STORAGE_KEY) as Period) || "30d";
      }
      return "30d";
    });
    const [customRange, setCustomRange] = useState<{ from: string; to: string } | undefined>();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ period });
        if (period === "custom" && customRange) {
          params.set("from", customRange.from);
          params.set("to", customRange.to);
        }
        const res = await fetch(`/api/analytics/user?${params}`);
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    }, [period, customRange]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handlePeriodChange = (p: Period, range?: { from: string; to: string }) => {
      setPeriod(p);
      setCustomRange(range);
      if (p !== "custom") localStorage.setItem(STORAGE_KEY, p);
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    const hasNoContent =
      data &&
      data.totalViews === 0 &&
      data.topPosts.length === 0 &&
      data.topPlaces.length === 0 &&
      data.topEvents.length === 0;

    if (hasNoContent) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <IconEye className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <p className="font-medium">Aucun contenu pour l&apos;instant</p>
            <p className="text-sm text-muted-foreground mt-1">
              Publiez des articles, places ou événements pour voir vos statistiques ici.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/posts/new"><PlusCircle className="h-3.5 w-3.5 mr-1" />Nouvel article</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/places/new"><PlusCircle className="h-3.5 w-3.5 mr-1" />Nouvelle place</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mon activité</h2>
          <PeriodSelector value={period} customRange={customRange} onChange={handlePeriodChange} />
        </div>

        {data && (
          <>
            <AnalyticsKpiCards cards={[
              { label: "Vues totales", value: data.totalViews, icon: <IconEye className="h-4 w-4" /> },
              { label: "Favoris reçus", value: data.favoritesReceived, icon: <IconHeart className="h-4 w-4" /> },
              { label: "Avis reçus", value: data.reviewsReceived, icon: <IconStar className="h-4 w-4" /> },
              { label: "Participants events", value: data.participants, icon: <IconUsers className="h-4 w-4" /> },
            ]} />

            {data.timeSeries.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Vues dans le temps</CardTitle></CardHeader>
                <CardContent>
                  <AnalyticsChart
                    type="line"
                    series={[{ key: "count", label: "Vues", color: "#6366f1", data: data.timeSeries }]}
                  />
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {data.topPosts.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Mes articles</CardTitle></CardHeader>
                  <CardContent>
                    <AnalyticsTopTable items={data.topPosts} hrefPrefix="/posts" />
                    <div className="mt-3">
                      <Link href="/dashboard/posts" className="text-xs text-muted-foreground hover:underline">
                        Voir tous mes articles →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.topPlaces.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Mes places</CardTitle></CardHeader>
                  <CardContent>
                    <AnalyticsTopTable items={data.topPlaces} hrefPrefix="/places" />
                    <div className="mt-3">
                      <Link href="/dashboard/places" className="text-xs text-muted-foreground hover:underline">
                        Voir toutes mes places →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {data.topEvents.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Mes événements</CardTitle></CardHeader>
                <CardContent>
                  <AnalyticsTopTable items={data.topEvents} hrefPrefix="/events" showParticipants />
                  <div className="mt-3">
                    <Link href="/dashboard/events" className="text-xs text-muted-foreground hover:underline">
                      Voir tous mes événements →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Replace ViewsAnalytics in dashboard page**

  In `app/(dashboard)/dashboard/page.tsx`:

  1. Remove import:
     ```tsx
     import { ViewsAnalytics } from "@/components/dashboard/views-analytics";
     ```
  2. Add import:
     ```tsx
     import { UserAnalytics } from "@/components/analytics/user-analytics";
     ```
  3. Replace `<ViewsAnalytics />` with `<UserAnalytics />`.

- [ ] **Step 3: Retire old ViewsAnalytics files**

  Delete the retired component and API:
  ```bash
  rm components/dashboard/views-analytics.tsx
  ```

  Check if `/api/dashboard/views` route exists and delete it:
  ```bash
  ls app/api/dashboard/views/ 2>/dev/null && rm -rf app/api/dashboard/views/
  ```

  Verify nothing else imports the old component:
  ```bash
  grep -r "views-analytics\|ViewsAnalytics" app/ components/ --include="*.tsx" --include="*.ts"
  ```
  Expected: No results (only the file we deleted should have had it).

- [ ] **Step 4: Build check**

  Run: `pnpm type-check`
  Expected: No TypeScript errors.
  Fix any type errors before proceeding.

- [ ] **Step 5: Commit**

  ```bash
  git add components/analytics/user-analytics.tsx \
    app/\(dashboard\)/dashboard/page.tsx
  git commit -m "feat(analytics): add user analytics tab, retire ViewsAnalytics"
  ```

---

### Task 15: Final verification

- [ ] **Step 1: Full build**

  Run: `pnpm build`
  Expected: Build completes with no errors (warnings are acceptable).

- [ ] **Step 2: Smoke test checklist**

  Start dev server (`pnpm dev`) and verify:
  - [ ] Visit a place detail page → Network tab shows POST to `/api/places/[slug]/view` returning 200
  - [ ] Visit an event detail page → Network tab shows POST to `/api/events/[slug]/view` returning 200
  - [ ] Visit `/dashboard/admin/analytics` → page loads with tabs, global data shows
  - [ ] Switch tabs (Articles, Places, Events, Users) → each loads correctly
  - [ ] Change period (7j, 30j, 12m) → data updates
  - [ ] Admin home `/dashboard/admin` → AnalyticsWidget shows with "Voir tout" link
  - [ ] Sidebar shows "Analytics" link pointing to correct page
  - [ ] User dashboard analytics tab → KPI cards and empty state or data shows

- [ ] **Step 3: Final commit**

  ```bash
  git add -A
  git commit -m "feat(analytics): complete analytics dashboard implementation"
  ```
