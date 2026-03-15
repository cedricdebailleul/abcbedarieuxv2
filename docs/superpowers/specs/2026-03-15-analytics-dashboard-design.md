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

Two new models added via additive migration — no existing data touched.

```prisma
model PlaceView {
  id        String   @id @default(cuid())
  placeId   String
  place     Place    @relation(fields: [placeId], references: [id], onDelete: Cascade)
  ipAddress String?
  userAgent String?
  referrer  String?
  country   String?
  region    String?
  city      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([placeId])
  @@index([ipAddress])
  @@index([createdAt])
}

model EventView {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  ipAddress String?
  userAgent String?
  referrer  String?
  country   String?
  region    String?
  city      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([eventId])
  @@index([ipAddress])
  @@index([createdAt])
}
```

**Schema changes:** Add `views PlaceView[]` to `Place` model and `views EventView[]` to `Event` model.

**Migration safety:** `onDelete: Cascade` ensures view records are cleaned up when parent entity is deleted. No existing fields are modified.

---

## 2. Tracking Layer

### API Routes (new)

```
POST /api/places/[slug]/view
POST /api/events/[id]/view
```

**Logic per route:**
1. Extract IP from `x-forwarded-for` header, user-agent, referrer
2. Deduplicate: if same IP + same entity within last 2 hours → skip (prevents spam)
3. Insert record
4. Return `{ success: true }` — never throws a blocking error

### Client Hook (new)

```ts
// hooks/use-track-view.ts
useTrackView(type: "place" | "event", id: string)
```

- Called in place detail page and event detail page
- Single `useEffect` fire on mount — invisible to user, non-blocking
- Uses `fetch` with `keepalive: true` so navigation doesn't abort the request

### Files to create/modify

| File | Action |
|------|--------|
| `app/api/places/[slug]/view/route.ts` | Create |
| `app/api/events/[id]/view/route.ts` | Create |
| `hooks/use-track-view.ts` | Create |
| Place detail page(s) | Add `useTrackView("place", id)` |
| Event detail page(s) | Add `useTrackView("event", id)` |

---

## 3. Analytics API

### Endpoints

```
GET /api/analytics/admin?period=7d&tab=global
GET /api/analytics/user?period=30d
```

**Period parameters:**
- `period`: `7d` | `30d` | `12m` (predefined)
- `from` + `to`: ISO date strings for custom range (takes priority over `period`)
- `tab`: `global` | `posts` | `places` | `events` | `users` (admin only)

### Admin endpoint response by tab

| Tab | Data returned |
|-----|--------------|
| `global` | Total views (posts+places+events), new users, growth rate, multi-series chart data |
| `posts` | Total views, unique viewers, top 10 posts, views/day series, top referrers |
| `places` | Total views, unique viewers, top 10 places, views/day series, category breakdown |
| `events` | Total views, unique viewers, top 10 events, total participants, views/day series |
| `users` | New signups, active users, role distribution, growth rate, latest signups list |

### User endpoint response

- Views on own posts, places, events (totals + time series)
- Received favorites count, received reviews count, event participants count
- Top 5 most-viewed content items per type
- Daily views evolution series for chart

### Security

- `/api/analytics/admin` → checks `role === "admin"`, returns 403 otherwise
- `/api/analytics/user` → scopes all queries to `session.user.id`, never exposes other users' data

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
| `AnalyticsChart` | Bar/line chart (recharts — already in project) |
| `AnalyticsTopTable` | Top N table with rank, name, views, trend indicator |
| `PeriodSelector` | `[7j][30j][12m][custom]` date picker component |

---

## 5. User Dashboard

Complete the existing "Analytics" tab on `/dashboard`.

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
- **Content but 0 views:** Explanation that tracking starts now
- **Period selector:** Persisted in `localStorage` across visits

### Component reuse

`AnalyticsKpiCards`, `AnalyticsChart`, `PeriodSelector` are shared with admin. `AnalyticsTopTable` gets a simplified `UserTopTable` variant.

---

## 6. File Summary

### New files

```
prisma/migrations/YYYYMMDD_add_place_event_views/
app/api/analytics/admin/route.ts
app/api/analytics/user/route.ts
app/api/places/[slug]/view/route.ts
app/api/events/[id]/view/route.ts
hooks/use-track-view.ts
app/(dashboard)/dashboard/admin/analytics/page.tsx
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
prisma/schema.prisma                          — add PlaceView, EventView models + relations
app/(dashboard)/dashboard/admin/page.tsx      — add AnalyticsWidget
app/(dashboard)/dashboard/page.tsx            — complete Analytics tab
app/(dashboard)/dashboard/_components/        — sidebar nav link
Place detail page(s)                          — add useTrackView hook
Event detail page(s)                          — add useTrackView hook
```

---

## 7. Build Order

1. Prisma schema + migration (data layer first)
2. Tracking API routes + `useTrackView` hook
3. Add hook to place/event detail pages
4. Analytics API routes (admin + user)
5. Shared UI components (`PeriodSelector`, `AnalyticsKpiCards`, `AnalyticsChart`, `AnalyticsTopTable`)
6. Admin analytics page + widget
7. User dashboard analytics tab
8. Sidebar navigation link
