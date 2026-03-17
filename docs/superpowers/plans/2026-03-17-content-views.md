# Content Views (Produits / Services / Offres) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un tracking de vues complet (table `ContentView`) pour les produits, services et offres d'une fiche Place, avec une page stats gérant et des sous-onglets dans l'analytics admin.

**Architecture:** Une table unifiée `ContentView` avec discriminant `contentType` (PRODUCT/SERVICE/OFFER) remplace les compteurs `viewCount` en tant que source de vérité. Le tracking public est déclenché côté client à la consultation d'un produit/service/offre. Les stats sont exposées via deux endpoints : un pour le gérant (scope = sa propre fiche), un pour l'admin (top 10 global).

**Tech Stack:** Next.js 15 App Router, Prisma ORM (client path `lib/generated/prisma`), TypeScript, shadcn/ui, Jest pour les tests.

**Spec:** `docs/superpowers/specs/2026-03-17-content-views-design.md`

---

## Chunk 1: Worktree + Schéma + DB

### Task 1: Créer le worktree feature

**Files:**
- None (git operations)

- [ ] **Step 1: Créer le worktree**

```bash
cd /c/abcbedarieuxv2
git worktree add .worktrees/feature-content-views -b feature/content-views
```

- [ ] **Step 2: Vérifier**

```bash
git worktree list
```

Attendu : la branche `feature/content-views` apparaît dans la liste.

- [ ] **Step 3: Commit initial**

```bash
cd /c/abcbedarieuxv2/.worktrees/feature-content-views
git commit --allow-empty -m "chore: init feature/content-views branch"
```

---

### Task 2: Schéma Prisma — ContentView

**Files:**
- Modify: `prisma/schema.prisma` (dans le worktree)

- [ ] **Step 1: Ajouter l'enum `ContentViewType` après `enum AbcMemberStatus`**

Chercher le bloc `enum AbcMemberStatus` et insérer après :

```prisma
enum ContentViewType {
  PRODUCT
  SERVICE
  OFFER
}
```

- [ ] **Step 2: Ajouter le modèle `ContentView` après le modèle `EventView`**

Insérer après la fermeture de `model EventView { ... }` :

```prisma
model ContentView {
  id          String          @id @default(cuid())
  contentType ContentViewType
  contentId   String
  placeId     String
  ipAddress   String          @default("")
  userAgent   String          @default("")
  referer     String          @default("")
  country     String          @default("")
  region      String          @default("")
  city        String          @default("")
  createdAt   DateTime        @default(now())

  place Place @relation(fields: [placeId], references: [id], onDelete: Cascade)

  @@index([contentType, contentId, ipAddress])
  @@index([placeId])
  @@index([createdAt])
  @@map("content_views")
}
```

Note : pas de `updatedAt` — table append-only.

- [ ] **Step 3: Ajouter la relation dans `model Place`**

Dans `model Place`, après la ligne `views PlaceView[]`, ajouter :

```prisma
  contentViews ContentView[]
```

- [ ] **Step 4: Vérifier le schéma avec type-check**

```bash
cd /c/abcbedarieuxv2/.worktrees/feature-content-views
pnpm db:generate
pnpm type-check 2>&1 | head -30
```

Attendu : `pnpm db:generate` réussit, `type-check` sans erreurs liées au schéma.

- [ ] **Step 5: Pousser en base**

```bash
pnpm db:push
```

Attendu : "Your database is now in sync with your Prisma schema."

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma lib/generated/
git commit -m "feat(schema): add ContentView model for product/service/offer tracking"
```

---

## Chunk 2: Endpoint de tracking public

### Task 3: Tests — tracking endpoint

**Files:**
- Create: `__tests__/api/content-view-tracking.test.ts`

- [ ] **Step 1: Écrire les tests**

```typescript
// __tests__/api/content-view-tracking.test.ts
import { POST } from "@/app/api/places/[placeId]/content-view/route";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    place: { findUnique: jest.fn() },
    contentView: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    product: { update: jest.fn() },
    service: { update: jest.fn() },
    offer: { update: jest.fn() },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function makeRequest(body: unknown, ip = "1.2.3.4") {
  return new Request("http://localhost/api/places/test-slug/content-view", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  }) as any;
}

describe("POST /api/places/[placeId]/content-view", () => {
  const params = Promise.resolve({ placeId: "test-slug" });

  beforeEach(() => jest.clearAllMocks());

  it("returns 404 if place not found", async () => {
    (mockPrisma.place.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest({ contentType: "PRODUCT", contentId: "prod-1" }), { params });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid contentType", async () => {
    (mockPrisma.place.findUnique as jest.Mock).mockResolvedValue({ id: "place-1" });
    const res = await POST(makeRequest({ contentType: "INVALID", contentId: "prod-1" }), { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing contentId", async () => {
    (mockPrisma.place.findUnique as jest.Mock).mockResolvedValue({ id: "place-1" });
    const res = await POST(makeRequest({ contentType: "PRODUCT", contentId: "" }), { params });
    expect(res.status).toBe(400);
  });

  it("skips duplicate view within 10 minutes", async () => {
    (mockPrisma.place.findUnique as jest.Mock).mockResolvedValue({ id: "place-1" });
    (mockPrisma.contentView.findFirst as jest.Mock).mockResolvedValue({ id: "existing" });
    const res = await POST(makeRequest({ contentType: "PRODUCT", contentId: "prod-1" }), { params });
    expect(res.status).toBe(200);
    expect(mockPrisma.contentView.create).not.toHaveBeenCalled();
  });

  it("returns 400 for null/unparseable body", async () => {
    (mockPrisma.place.findUnique as jest.Mock).mockResolvedValue({ id: "place-1" });
    const req = new Request("http://localhost/api/places/test-slug/content-view", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
      body: "not-json",
    }) as any;
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });

  it("creates view and increments viewCount for PRODUCT", async () => {
    (mockPrisma.place.findUnique as jest.Mock).mockResolvedValue({ id: "place-1" });
    (mockPrisma.contentView.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.contentView.create as jest.Mock).mockResolvedValue({});
    (mockPrisma.product.update as jest.Mock).mockResolvedValue({});
    const res = await POST(makeRequest({ contentType: "PRODUCT", contentId: "prod-1" }), { params });
    expect(res.status).toBe(200);
    expect(mockPrisma.contentView.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contentType: "PRODUCT", contentId: "prod-1", placeId: "place-1" }),
      })
    );
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { viewCount: { increment: 1 } },
    });
  });
});
```

- [ ] **Step 2: Lancer les tests pour confirmer qu'ils échouent**

```bash
cd /c/abcbedarieuxv2/.worktrees/feature-content-views
pnpm test __tests__/api/content-view-tracking.test.ts 2>&1 | tail -20
```

Attendu : FAIL — "Cannot find module '@/app/api/places/[placeId]/content-view/route'"

---

### Task 4: Implémenter l'endpoint de tracking

**Files:**
- Create: `app/api/places/[placeId]/content-view/route.ts`

- [ ] **Step 1: Créer le fichier**

```typescript
// app/api/places/[placeId]/content-view/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["PRODUCT", "SERVICE", "OFFER"] as const;
type ContentType = (typeof VALID_TYPES)[number];

async function incrementViewCount(contentType: ContentType, contentId: string) {
  if (contentType === "PRODUCT") {
    await prisma.product.update({ where: { id: contentId }, data: { viewCount: { increment: 1 } } });
  } else if (contentType === "SERVICE") {
    await prisma.service.update({ where: { id: contentId }, data: { viewCount: { increment: 1 } } });
  } else {
    await prisma.offer.update({ where: { id: contentId }, data: { viewCount: { increment: 1 } } });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId: slug } = await params;

    const body = await request.json().catch(() => null);
    const { contentType, contentId } = body ?? {};

    if (!VALID_TYPES.includes(contentType) || !contentId || typeof contentId !== "string" || contentId.trim() === "") {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

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
      const existing = await prisma.contentView.findFirst({
        where: {
          contentType,
          contentId,
          ipAddress,
          createdAt: { gte: tenMinutesAgo },
        },
      });
      if (existing) {
        return NextResponse.json({ success: true });
      }
    }

    await prisma.contentView.create({
      data: { contentType, contentId, placeId: place.id, ipAddress, userAgent, referer },
    });

    await incrementViewCount(contentType, contentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur enregistrement vue contenu:", error);
    return NextResponse.json({ success: false });
  }
}
```

- [ ] **Step 2: Lancer les tests**

```bash
pnpm test __tests__/api/content-view-tracking.test.ts 2>&1 | tail -20
```

Attendu : PASS — 5 tests passent.

- [ ] **Step 3: Type-check**

```bash
pnpm type-check 2>&1 | grep -E "error|warning" | head -20
```

Attendu : aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add app/api/places/[placeId]/content-view/ __tests__/api/content-view-tracking.test.ts
git commit -m "feat(api): add public content-view tracking endpoint with deduplication"
```

---

## Chunk 3: Endpoint stats gérant + Admin analytics

### Task 5: Tests + Implémentation — endpoint stats gérant

**Files:**
- Create: `app/api/user/places/[placeId]/content-stats/route.ts`
- Create: `__tests__/api/content-stats.test.ts`

- [ ] **Step 1: Écrire les tests**

```typescript
// __tests__/api/content-stats.test.ts
import { GET } from "@/app/api/user/places/[placeId]/content-stats/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    place: { findUnique: jest.fn() },
    contentView: { groupBy: jest.fn(), findMany: jest.fn() },
    product: { findMany: jest.fn() },
    service: { findMany: jest.fn() },
    offer: { findMany: jest.fn() },
  },
}));
jest.mock("@/lib/auth", () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock("next/headers", () => ({ headers: () => new Headers() }));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockAuth = auth as jest.Mocked<typeof auth>;

function makeRequest(searchParams = "") {
  return new Request(`http://localhost/api/user/places/my-slug/content-stats?${searchParams}`) as any;
}

describe("GET /api/user/places/[placeId]/content-stats", () => {
  const params = Promise.resolve({ placeId: "my-slug" });

  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (mockAuth.api.getSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not owner", async () => {
    (mockAuth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: "user-2" } });
    (mockPrisma.place.findUnique as jest.Mock).mockResolvedValue({ id: "place-1", ownerId: "user-1" });
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(403);
  });

  it("returns 404 when place not found", async () => {
    (mockAuth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: "user-1" } });
    (mockPrisma.place.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(404);
  });

  it("uses 7-day window when period=7d", async () => {
    (mockAuth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: "user-1" } });
    (mockPrisma.place.findUnique as jest.Mock).mockResolvedValue({ id: "place-1", ownerId: "user-1" });
    (mockPrisma.contentView.groupBy as jest.Mock).mockResolvedValue([]);
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.service.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.offer.findMany as jest.Mock).mockResolvedValue([]);
    await GET(makeRequest("period=7d"), { params });
    const groupByCall = (mockPrisma.contentView.groupBy as jest.Mock).mock.calls[0][0];
    const gte: Date = groupByCall.where.createdAt.gte;
    const diffDays = (Date.now() - gte.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThan(8);
  });

  it("returns summary and items when owner", async () => {
    (mockAuth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: "user-1" } });
    (mockPrisma.place.findUnique as jest.Mock).mockResolvedValue({ id: "place-1", ownerId: "user-1" });
    (mockPrisma.contentView.groupBy as jest.Mock).mockResolvedValue([
      { contentType: "PRODUCT", contentId: "p1", _count: { id: 10 } },
    ]);
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([{ id: "p1", name: "Pain" }]);
    (mockPrisma.service.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.offer.findMany as jest.Mock).mockResolvedValue([]); // Offer uses `title` field, not `name`
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.summary.PRODUCT).toBe(10);
    expect(json.items[0]).toMatchObject({ contentType: "PRODUCT", name: "Pain", views: 10 });
  });
});
```

- [ ] **Step 2: Lancer les tests pour confirmer qu'ils échouent**

```bash
pnpm test __tests__/api/content-stats.test.ts 2>&1 | tail -20
```

Attendu : FAIL — module not found.

- [ ] **Step 3: Implémenter l'endpoint**

```typescript
// app/api/user/places/[placeId]/content-stats/route.ts
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getStartDate(period: string): Date {
  const d = new Date();
  if (period === "7d") d.setDate(d.getDate() - 7);
  else if (period === "12m") d.setMonth(d.getMonth() - 12);
  else d.setDate(d.getDate() - 30);
  return d;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { placeId: slug } = await params;
    const place = await prisma.place.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!place) {
      return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
    }

    if (place.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const typeFilter = searchParams.get("type") as "PRODUCT" | "SERVICE" | "OFFER" | null;
    const startDate = getStartDate(period);

    const whereBase = {
      placeId: place.id,
      createdAt: { gte: startDate },
      ...(typeFilter ? { contentType: typeFilter } : {}),
    };

    const grouped = await prisma.contentView.groupBy({
      by: ["contentType", "contentId"],
      where: whereBase,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const summary = { PRODUCT: 0, SERVICE: 0, OFFER: 0 };
    const byType: Record<string, { contentId: string; views: number }[]> = {
      PRODUCT: [], SERVICE: [], OFFER: [],
    };

    for (const row of grouped) {
      summary[row.contentType as keyof typeof summary] += row._count.id;
      byType[row.contentType].push({ contentId: row.contentId, views: row._count.id });
    }

    // Limit to top 20 per type and resolve names
    const resolveNames = async (
      type: "PRODUCT" | "SERVICE" | "OFFER",
      rows: { contentId: string; views: number }[]
    ) => {
      const top = rows.slice(0, 20);
      const ids = top.map((r) => r.contentId);
      let records: { id: string; name: string }[] = [];
      if (type === "PRODUCT") {
        records = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
      } else if (type === "SERVICE") {
        records = await prisma.service.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
      } else {
        const offerRecords = await prisma.offer.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } });
        records = offerRecords.map((o) => ({ id: o.id, name: o.title }));
      }
      const nameMap = Object.fromEntries(records.map((r) => [r.id, r.name]));
      return top.map((r) => ({
        contentType: type,
        contentId: r.contentId,
        name: nameMap[r.contentId] ?? r.contentId,
        views: r.views,
      }));
    };

    const [products, services, offers] = await Promise.all([
      resolveNames("PRODUCT", byType.PRODUCT),
      resolveNames("SERVICE", byType.SERVICE),
      resolveNames("OFFER", byType.OFFER),
    ]);

    const items = [...products, ...services, ...offers].sort((a, b) => b.views - a.views);

    return NextResponse.json({ summary, items });
  } catch (error) {
    console.error("Erreur stats contenu:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Lancer les tests**

```bash
pnpm test __tests__/api/content-stats.test.ts 2>&1 | tail -20
```

Attendu : PASS — 4 tests passent.

- [ ] **Step 5: Type-check**

```bash
pnpm type-check 2>&1 | grep -E "error" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add app/api/user/places/[placeId]/content-stats/ __tests__/api/content-stats.test.ts
git commit -m "feat(api): add owner content-stats endpoint for products/services/offers"
```

---

### Task 6: Étendre l'analytics admin

**Files:**
- Modify: `app/api/analytics/admin/route.ts`

- [ ] **Step 1: Mettre à jour le type `Tab` et `validTabs` (ligne ~6 et ~81)**

Remplacer :
```typescript
type Tab = "global" | "posts" | "places" | "events" | "users";
```
Par :
```typescript
type Tab = "global" | "posts" | "places" | "events" | "users" | "products" | "services" | "offers";
```

Remplacer :
```typescript
const validTabs: Tab[] = ["global", "posts", "places", "events", "users"];
```
Par :
```typescript
const validTabs: Tab[] = ["global", "posts", "places", "events", "users", "products", "services", "offers"];
```

- [ ] **Step 2: Ajouter le handler pour les trois nouveaux tabs**

Juste avant `// tab === "global"`, ajouter :

```typescript
    if (tab === "products" || tab === "services" || tab === "offers") {
      const contentType = tab === "products" ? "PRODUCT" : tab === "services" ? "SERVICE" : "OFFER";
      const views = await prisma.contentView.findMany({
        where: { contentType, ...dateFilter },
        select: { contentId: true, ipAddress: true, createdAt: true },
      });

      const uniqueViewers = new Set(
        views.filter((v) => v.ipAddress !== "").map((v) => v.ipAddress)
      ).size;

      // Group by contentId to find top 10
      const countMap: Record<string, number> = {};
      for (const v of views) {
        countMap[v.contentId] = (countMap[v.contentId] || 0) + 1;
      }
      const top10Ids = Object.entries(countMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id);

      // Resolve names + place name
      let topItems: { id: string; name: string; placeName: string; views: number }[] = [];
      if (top10Ids.length > 0) {
        if (contentType === "PRODUCT") {
          const products = await prisma.product.findMany({
            where: { id: { in: top10Ids } },
            select: { id: true, name: true, place: { select: { name: true } } },
          });
          topItems = products.map((p) => ({
            id: p.id,
            name: p.name,
            placeName: p.place?.name ?? "",
            views: countMap[p.id] ?? 0,
          }));
        } else if (contentType === "SERVICE") {
          const services = await prisma.service.findMany({
            where: { id: { in: top10Ids } },
            select: { id: true, name: true, place: { select: { name: true } } },
          });
          topItems = services.map((s) => ({
            id: s.id,
            name: s.name,
            placeName: s.place?.name ?? "",
            views: countMap[s.id] ?? 0,
          }));
        } else {
          const offers = await prisma.offer.findMany({
            where: { id: { in: top10Ids } },
            select: { id: true, title: true, place: { select: { name: true } } },
          });
          topItems = offers.map((o) => ({
            id: o.id,
            name: o.title,
            placeName: o.place?.name ?? "",
            views: countMap[o.id] ?? 0,
          }));
        }
        topItems.sort((a, b) => b.views - a.views);
      }

      return NextResponse.json({
        tab,
        totalViews: views.length,
        uniqueViewers,
        timeSeries: buildTimeSeries(views, start, end, period),
        topItems,
      });
    }
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check 2>&1 | grep -E "error" | head -20
```

Attendu : aucune erreur.

- [ ] **Step 4: Test rapide en dev (optionnel)**

```bash
# Démarrer le dev server et appeler l'API
curl "http://localhost:3000/api/analytics/admin?tab=products&period=30d" \
  -H "Cookie: ..." 2>/dev/null | head -100
```

- [ ] **Step 5: Commit**

```bash
git add app/api/analytics/admin/route.ts
git commit -m "feat(admin): add products/services/offers tabs in analytics admin endpoint"
```

---

## Chunk 4: UI — Page stats gérant + Admin sub-tabs

> ⚠️ **RÈGLE ABSOLUE (CLAUDE.md)** : Tout code UI/frontend DOIT passer par Gemini MCP. Ne pas écrire de composants React avec du styling directement. Appeler Gemini via `mcp__gemini__create_frontend` avec le contexte CSS/theme existant.

### Task 7: Page stats gérant (via Gemini)

**Files:**
- Create: `app/(dashboard)/dashboard/places/[placeId]/stats/page.tsx`

- [ ] **Step 1: Lire le fichier theme/CSS existant pour passer en contexte à Gemini**

Lire `app/globals.css` et `tailwind.config.ts` pour extraire les variables CSS et la config de couleurs.

- [ ] **Step 2: Appeler Gemini pour créer la page stats gérant**

Passer à Gemini :
- Les variables CSS du projet
- La structure de la réponse de l'API `GET /api/user/places/[placeId]/content-stats` :
  ```json
  { "summary": { "PRODUCT": 284, "SERVICE": 156, "OFFER": 93 }, "items": [...] }
  ```
- Specs UI :
  - Sélecteur de période 7j/30j/12m (state local)
  - 3 cartes résumé colorées : Produits (bleu), Services (vert), Offres (jaune)
  - Onglets Produits / Services / Offres (shadcn/ui Tabs)
  - Par onglet : tableau classé par vues décroissant avec barre de progression relative
  - Loader pendant le fetch, état vide si aucune vue
- Pattern existant : `app/(dashboard)/dashboard/places/[placeId]/edit/page.tsx` comme référence de layout

- [ ] **Step 3: Écrire le code retourné par Gemini sur le disque**

- [ ] **Step 4: Ajouter un lien "Statistiques" dans la page liste des places du gérant**

Modifier `app/(dashboard)/dashboard/places/page.tsx` pour ajouter un lien vers `/dashboard/places/[slug]/stats` dans les actions de chaque fiche. Utiliser Gemini si la modification touche le layout visuel.

- [ ] **Step 5: Type-check**

```bash
pnpm type-check 2>&1 | grep -E "error" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add app/(dashboard)/dashboard/places/[placeId]/stats/ app/(dashboard)/dashboard/places/page.tsx
git commit -m "feat(ui): add owner content stats page for products/services/offers"
```

---

### Task 8: Admin analytics — sous-onglets Places (via Gemini)

**Files:**
- Modify: `app/(dashboard)/dashboard/admin/analytics/page.tsx`

- [ ] **Step 1: Appeler Gemini pour modifier l'onglet Places**

Passer à Gemini :
- Le fichier actuel `app/(dashboard)/dashboard/admin/analytics/page.tsx` complet
- Modification demandée : dans `<TabsContent value="places">`, remplacer le contenu actuel par un système de sous-onglets shadcn/ui avec 4 valeurs : `fiches` / `products` / `services` / `offers`
  - `fiches` = contenu actuel Places inchangé
  - `products`, `services`, `offers` = tableau top 10 avec colonnes Nom / Fiche / Vues (appelle le même endpoint `/api/analytics/admin?tab=products|services|offers`)
- Le sous-onglet actif doit déclencher un nouveau fetch
- ⚠️ **Important pour Gemini** : la réponse de l'API pour les nouveaux tabs retourne `topItems[].views` et `timeSeries` avec des items `{ date, count }` (pas `{ date, views }`) — utiliser `count` comme clé pour le time-series si un graphique est affiché

- [ ] **Step 2: Écrire le code retourné par Gemini sur le disque**

- [ ] **Step 3: Type-check + lint**

```bash
pnpm type-check 2>&1 | grep -E "error" | head -20
pnpm lint 2>&1 | grep -E "error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/dashboard/admin/analytics/page.tsx
git commit -m "feat(admin): add product/service/offer sub-tabs in Places analytics"
```

---

## Chunk 5: Tracking frontend + Vérification finale

### Task 9: Intégration tracking côté client

**Files:**
- Modify: composant(s) qui affichent les produits/services/offres sur la fiche publique

- [ ] **Step 1: Identifier les composants qui rendent les produits/services/offres**

```bash
grep -r "products-services\|ProductCard\|ServiceCard\|OfferCard" \
  /c/abcbedarieuxv2/app --include="*.tsx" -l | head -10
grep -r "placeId.*content-view\|content-view" \
  /c/abcbedarieuxv2/app --include="*.tsx" -l | head -5
```

- [ ] **Step 2: Ajouter l'appel de tracking dans le composant approprié**

Pattern à utiliser (ajouter dans le `useEffect` de mount ou onClick d'ouverture d'un modal) :

```typescript
// Appel best-effort, pas de retry
fetch(`/api/places/${placeSlug}/content-view`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contentType: "PRODUCT", contentId: productId }),
}).catch(() => {/* ignore */});
```

> Si la modification touche le layout visuel, utiliser Gemini. Si c'est uniquement l'ajout d'un `useEffect` sans changement UI, le faire directement.

- [ ] **Step 3: Type-check**

```bash
pnpm type-check 2>&1 | grep -E "error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add <fichiers modifiés>
git commit -m "feat(tracking): trigger content-view on product/service/offer consultation"
```

---

### Task 10: Vérification finale

- [ ] **Step 1: Lancer tous les tests**

```bash
cd /c/abcbedarieuxv2/.worktrees/feature-content-views
pnpm test 2>&1 | tail -30
```

Attendu : tous les tests passent, aucun test existant cassé.

- [ ] **Step 2: Type-check complet**

```bash
pnpm type-check 2>&1 | grep -E "error" | wc -l
```

Attendu : 0 erreur.

- [ ] **Step 3: Lint**

```bash
pnpm lint 2>&1 | grep -E "error" | wc -l
```

Attendu : 0 erreur.

- [ ] **Step 4: `db:push` sur le repo principal**

```bash
cd /c/abcbedarieuxv2
pnpm db:push
pnpm db:generate
```

- [ ] **Step 5: Smoke test dev server**

Démarrer le dev server et vérifier :
1. `/dashboard/places` → lien "Statistiques" visible pour une fiche possédée
2. `/dashboard/places/[slug]/stats` → page stats charge sans erreur
3. `/dashboard/admin/analytics` → onglet Places → sous-onglets Fiches/Produits/Services/Offres visibles
4. `/dashboard/admin/analytics?tab=places` → sous-onglet "Fiches" → liste places existante toujours fonctionnelle (régression criterion 7)
5. `/dashboard/admin/analytics?tab=events` et `?tab=posts` → encore fonctionnels (pas de régression sur les autres onglets)

- [ ] **Step 6: Invoquer `superpowers:finishing-a-development-branch`**

```
Invoquer le skill superpowers:finishing-a-development-branch pour préparer le merge.
```
