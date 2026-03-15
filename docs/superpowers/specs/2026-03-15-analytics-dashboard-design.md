# Analytics Dashboard — Design Spec
**Date:** 2026-03-15
**Project:** ABC Bédarieux v2
**Status:** Approved

---

## Overview

Add a comprehensive analytics system to the dashboard covering views for posts, places, and events. Admins get a global analytics page with tabs per entity type. Connected users get a personal analytics dashboard showing stats on their own content.

---

## 1. Data Layer

### New Prisma Models

Two new models added via additive migration — no existing data touched. Field names, types and conventions **exactly match** the existing `PostView` model.

```prisma
model PlaceView {
  id      String @id @default(cuid())
  placeId String
  place   Place  @relation(fields: [placeId], references: [id], onDelete: Cascade)

  ipAddress String  @default("")
  userAgent String  @default("")
  referer   String  @default("")

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

  ipAddress String  @default("")
  userAgent String  @default("")
  referer   String  @default("")

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

**Schema changes:** Add `views PlaceView[]` to `Place` model and `views EventView[]` to `Event` model.

**Cascade delete:** `onDelete: Cascade` means deleting a Place or Event removes its associated view records. This is intentional — views are derived/aggregated data, not primary records. No archive or soft-delete of view data is required.

---

## 2. Tracking Layer

### API Routes (new)

```
POST /api/places/[slug]/view
POST /api/events/[slug]/view
```

Both routes use `slug` matching the detail page URLs `/places/[slug]` and `/events/[slug]`. Each performs a `findUnique({ where: { slug } })` to resolve to an internal ID.

**Logic per route:**
1. Resolve slug → entity ID via `findUnique`. If not found → return `404`.
2. Extract `ipAddress` from `x-forwarded-for` (fallback `""`), `userAgent` (fallback `""`), `referer` (fallback `""`)
3. Deduplicate: same `ipAddress` (when non-empty) + same entity ID within last **10 minutes** → skip and return `{ success: true }` (matches `PostView` window)
4. Insert record
5. On DB error → log server-side, return `{ success: false }` with status 200. **Never return 500 to the client** — view tracking must never break the user experience.

### Unique viewer definition

"Unique viewers" = `COUNT(DISTINCT ipAddress) WHERE ipAddress != ''` within the period. This is consistent across `PostView`, `PlaceView`, and `EventView`. Requests with empty IP (bots, privacy-mode) are tracked for total view counts but excluded from unique viewer counts. All analytics queries that compute unique viewers must include an explicit `ipAddress != ''` filter.

### Client-side tracking

Place and event detail pages are **Server Components**. Tracking is injected via a dedicated null-rendering client component:

```tsx
// components/analytics/track-view.tsx
"use client"
export function TrackView({ type, slug }: { type: "place" | "event", slug: string }) {
  useEffect(() => {
    fetch(`/api/${type}s/${slug}/view`, { method: "POST", keepalive: true })
  }, [type, slug])
  return null
}
```

Usage in Server Component:
```tsx
// In place detail page (Server Component)
<TrackView type="place" slug={place.slug} />
```

### Files to create/modify

| File | Action |
|------|--------|
| `app/api/places/[slug]/view/route.ts` | Create |
| `app/api/events/[slug]/view/route.ts` | Create |
| `components/analytics/track-view.tsx` | Create |
| Place detail page(s) | Add `<TrackView type="place" slug={...} />` |
| Event detail page(s) | Add `<TrackView type="event" slug={...} />` |

---

## 3. Analytics API

### Endpoints

```
GET /api/analytics/admin?period=7d&tab=global
GET /api/analytics/user?period=30d
```

**Period parameters:**
- `period`: `7d` | `30d` | `12m` (predefined). Default: `30d`.
- `from` + `to`: ISO date strings for custom range. Takes priority over `period` when both are present.
- `tab`: `global` | `posts` | `places` | `events` | `users` (admin only). Default: `global`.

**Error responses:**
- Invalid `period` value or unparseable `from`/`to` dates → `400 { error: "Paramètres invalides" }`
- Unknown `tab` value → `400 { error: "Onglet invalide" }`
- Unauthenticated → `401`
- Insufficient role → `403`
- DB timeout or unexpected error → `500 { error: "Erreur interne" }` (logged server-side)

### Chart data granularity

Time series data points per period:
- `7d` → **daily** (7 data points)
- `30d` → **daily** (30 data points)
- `12m` → **weekly** (52 data points, ~1 per week)
- Custom range → daily if ≤ 90 days, weekly if > 90 days

### Admin endpoint response by tab

| Tab | Data returned | Source model |
|-----|--------------|--------------|
| `global` | Total views (posts+places+events), new users, growth rate, multi-series chart (one series per entity type) | PostView + PlaceView + EventView + User |
| `posts` | Total views, unique viewers (`ipAddress != ''`), top 10 posts, views time series, top referers | PostView |
| `places` | Total views, unique viewers, top 10 places, views time series, category breakdown | PlaceView |
| `events` | Total views, unique viewers, top 10 events, total participants, views time series | EventView + EventParticipant |
| `users` | New signups, active users, role distribution, growth rate, latest 10 signups | User |

### Existing PostView infrastructure

The existing `PostView` model and `POST /api/posts/[id]/view` tracking route are **kept as-is**. The new admin analytics `posts` tab reads from `PostView`. The existing `ViewsAnalytics` component (`components/dashboard/views-analytics.tsx`) is **retired** — its functionality is replaced by the new shared `AnalyticsChart` + `AnalyticsTopTable` in both admin and user dashboards. The old `/api/dashboard/views` endpoint (which used periods `24h`, `90d`, `1y`) is replaced by the new `/api/analytics/user` endpoint using `7d | 30d | 12m`.

### User endpoint response

- Views on own posts, places, events (totals + time series)
- Received favorites count, received reviews count, event participants count
- Top 5 most-viewed items per content type
- Daily views evolution series for chart

### Security

- `/api/analytics/admin` → allow `role === "admin"` or `role === "moderator"`. Editors do **not** have access to analytics. Role check via `prisma.user.findUnique` on `session.user.id`. Return 403 otherwise.
- `/api/analytics/user` → scope all queries to `session.user.id`. No cross-user data exposure.

---

## 4. Admin Interface

### A — Analytics widget on `/dashboard/admin`

New `AnalyticsWidget` component added below existing stats cards:

```
┌──────────────────────────────────────────────────────┐
│ Analytics — 7 derniers jours              [Voir tout →]│
│ 📊 1.2k vues totales  👤 234 actifs  📍 89 places vues │
│ [Sparkline chart — 7 days]                            │
└──────────────────────────────────────────────────────┘
```

### B — Dedicated page `/dashboard/admin/analytics`

```
Analytics                       [7j][30j][12m][Du___ Au___]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Global][Articles][Places][Événements][Utilisateurs]

── Active tab content ──
[KPI Card][KPI Card][KPI Card][KPI Card]
[Chart: views over time / multi-series on Global tab]
[Top N table with rank, name, views, trend]
```

### Navigation

Add "Analytics" link in admin sidebar pointing to `/dashboard/admin/analytics`.

### New components

| Component | Purpose |
|-----------|---------|
| `AnalyticsWidget` | Summary widget for admin home page |
| `AnalyticsTabs` | Tab container + period selector |
| `AnalyticsKpiCards` | Reusable KPI card row |
| `AnalyticsChart` | Bar/line chart using recharts (already in project) |
| `AnalyticsTopTable` | Top N table with rank, name, views, trend indicator |
| `PeriodSelector` | `[7j][30j][12m][custom]` date picker component |
| `TrackView` | Null-rendering client component for server page view tracking |

---

## 5. User Dashboard

Complete the existing "Analytics" tab on `/dashboard`. The existing `ViewsAnalytics` component and `/api/dashboard/views` endpoint are replaced.

### Layout

```
Mon activité                    [7j][30j][12m][Du___ Au___]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Vues totales][Favoris reçus][Avis reçus][Participants]

[Line chart: my views over time]

[My Articles top 5    ]  [My Places top 5      ]
 • Article 1 — 892 vues   • Boulangerie — 540 vues
 • Article 2 — 654 vues   • Pharmacie — 310 vues
[See all articles →]      [See all places →]

[My Events top 5                                    ]
 • Marché de Noël — 234 vues · 45 participants
[See all events →]
```

### Edge cases

- **No content yet:** Encouragement message with links to create content
- **Content but 0 views:** Explanation that tracking starts now (existing historical data has no PlaceView/EventView records — this is expected)
- **Period selector:** Persisted in `localStorage` under key `analytics-period`. Defaults to `30d` if not set or invalid.

### Component reuse

`AnalyticsKpiCards`, `AnalyticsChart`, `PeriodSelector` are shared with admin. `AnalyticsTopTable` gets a simplified `UserTopTable` variant (no admin actions).

---

## 6. File Summary

### New files

```
prisma/migrations/YYYYMMDD_add_place_event_views/
app/api/analytics/admin/route.ts
app/api/analytics/user/route.ts
app/api/places/[slug]/view/route.ts
app/api/events/[slug]/view/route.ts
app/(dashboard)/dashboard/admin/analytics/page.tsx
components/analytics/track-view.tsx
components/analytics/analytics-widget.tsx
components/analytics/analytics-tabs.tsx
components/analytics/analytics-kpi-cards.tsx
components/analytics/analytics-chart.tsx
components/analytics/analytics-top-table.tsx
components/analytics/period-selector.tsx
components/analytics/user-top-table.tsx
```

### Modified files

```
prisma/schema.prisma                              — add PlaceView, EventView + relations
app/(dashboard)/dashboard/admin/page.tsx          — add AnalyticsWidget
app/(dashboard)/dashboard/page.tsx                — replace ViewsAnalytics with new components
app/(dashboard)/dashboard/_components/sidebar     — add Analytics nav link
Place detail page(s)                              — add <TrackView>
Event detail page(s)                              — add <TrackView>
components/dashboard/views-analytics.tsx          — retire (replaced by shared components)
```

---

## 7. Build Order

1. Prisma schema + migration (data layer first)
2. `TrackView` client component + tracking API routes (places, events)
3. Add `<TrackView>` to place and event detail pages
4. Analytics API routes (`/api/analytics/admin` and `/api/analytics/user`)
5. Shared UI components (`PeriodSelector`, `AnalyticsKpiCards`, `AnalyticsChart`, `AnalyticsTopTable`)
6. Admin analytics page (`/dashboard/admin/analytics`) + `AnalyticsWidget` on admin home
7. User dashboard analytics tab (complete existing tab)
8. Sidebar navigation link
