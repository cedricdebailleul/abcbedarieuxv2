# Appels à Cotisation (Phase 2 Association ABC) — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer le système d'appels à cotisation : campagnes, notices par membre, envoi email+PDF, suivi des états, interface admin.

**Architecture:** Deux nouveaux modèles Prisma (`AbcCotisationCampaign`, `AbcCotisationNotice`), API REST admin, génération PDF avec `@react-pdf/renderer`, emails via le système existant `lib/email.ts`, interface admin via Gemini.

**Tech Stack:** Next.js 15 App Router, Prisma ORM (client path `lib/generated/prisma`), TypeScript, shadcn/ui, `@react-pdf/renderer`, Jest.

**Spec:** `docs/superpowers/specs/2026-03-19-association-phase2-cotisation-design.md`

---

## Chunk 1: Worktree + Schéma + DB

### Task 1: Créer le worktree feature

**Files:** None (git operations)

- [ ] **Step 1: Créer le worktree**

```bash
cd /c/abcbedarieuxv2
git worktree add .worktrees/feature-cotisation -b feature/association-phase2-cotisation
```

- [ ] **Step 2: Vérifier**

```bash
git worktree list
```

Attendu : branche `feature/association-phase2-cotisation` dans la liste.

- [ ] **Step 3: Commit initial**

```bash
cd /c/abcbedarieuxv2/.worktrees/feature-cotisation
git commit --allow-empty -m "chore: init feature/association-phase2-cotisation branch"
```

---

### Task 2: Schéma Prisma + constantes

**Files:**
- Modify: `prisma/schema.prisma` (dans le worktree)
- Create: `lib/abc/cotisation-defaults.ts`

- [ ] **Step 1: Ajouter les enums après `enum AbcMemberPlaceRole`**

```prisma
enum AbcCampaignStatus {
  DRAFT
  SENT
  CLOSED
}

enum AbcNoticeStatus {
  PENDING
  SENT
  REMINDED
  PAID
  CANCELLED
}
```

- [ ] **Step 2: Ajouter le modèle `AbcCotisationCampaign`** (après `model AbcMemberPlace`)

```prisma
model AbcCotisationCampaign {
  id          String            @id @default(cuid())
  title       String
  year        Int
  dueDate     DateTime
  status      AbcCampaignStatus @default(DRAFT)
  description String?           @db.Text
  createdById String
  createdBy   User              @relation(fields: [createdById], references: [id])
  notices     AbcCotisationNotice[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@map("abc_cotisation_campaigns")
}
```

- [ ] **Step 3: Ajouter le modèle `AbcCotisationNotice`** (après `AbcCotisationCampaign`)

```prisma
model AbcCotisationNotice {
  id             String                @id @default(cuid())
  campaignId     String
  memberId       String
  amount         Float
  status         AbcNoticeStatus       @default(PENDING)
  sentAt         DateTime?
  reminderSentAt DateTime?
  paidAt         DateTime?
  pdfPath        String?
  notes          String?               @db.Text
  campaign       AbcCotisationCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  member         AbcMember             @relation(fields: [memberId], references: [id], onDelete: Cascade)
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt

  @@unique([campaignId, memberId])
  @@index([status])
  @@index([memberId])
  @@map("abc_cotisation_notices")
}
```

- [ ] **Step 4: Ajouter les relations dans les modèles existants**

Dans `model AbcMember`, après `places AbcMemberPlace[]`, ajouter :
```prisma
  cotisationNotices AbcCotisationNotice[]
```

Dans `model User`, après `abcMembers AbcMember[]` (ou à la fin des relations), ajouter :
```prisma
  abcCotisationCampaigns AbcCotisationCampaign[]
```

- [ ] **Step 5: Créer `lib/abc/cotisation-defaults.ts`**

```typescript
import { AbcMemberType } from "@/lib/generated/prisma";

export const DEFAULT_AMOUNTS: Record<AbcMemberType, number> = {
  ACTIF: 50,
  ARTISAN: 30,
  COMMERCANT: 40,
  ASSOCIATION: 25,
  SYMPATHISANT: 15,
  HONORAIRE: 0,
};
```

> Note : ajuster les clés selon les valeurs réelles de `enum AbcMemberType` dans le schema. Les lire avec `grep -A 10 "enum AbcMemberType" prisma/schema.prisma`.

- [ ] **Step 6: Générer le client + pousser en base**

```bash
cd /c/abcbedarieuxv2/.worktrees/feature-cotisation
pnpm db:generate
pnpm db:push
pnpm type-check 2>&1 | grep "error" | head -10
```

Attendu : 0 erreurs liées au schéma.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma lib/generated/ lib/abc/cotisation-defaults.ts
git commit -m "feat(schema): add AbcCotisationCampaign and AbcCotisationNotice models"
```

---

## Chunk 2: API Campagnes

### Task 3: Tests + Implémentation API campagnes CRUD

**Files:**
- Create: `app/api/admin/abc/cotisation/campaigns/route.ts`
- Create: `__tests__/api/cotisation-campaigns.test.ts`

- [ ] **Step 1: Écrire les tests**

```typescript
// __tests__/api/cotisation-campaigns.test.ts
import { GET, POST } from "@/app/api/admin/abc/cotisation/campaigns/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    abcCotisationCampaign: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));
jest.mock("@/lib/auth", () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock("next/headers", () => ({ headers: () => new Headers() }));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockAuth = auth as jest.Mocked<typeof auth>;

function makeRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/admin/abc/cotisation/campaigns", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }) as any;
}

describe("GET /api/admin/abc/cotisation/campaigns", () => {
  it("returns 401 when not authenticated", async () => {
    (mockAuth.api.getSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when not admin", async () => {
    (mockAuth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "user" } });
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(403);
  });

  it("returns campaign list for admin", async () => {
    (mockAuth.api.getSession as jest.Mock).mockResolvedValue({ user: { id: "u1", role: "admin" } });
    (mockPrisma.abcCotisationCampaign.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.abcCotisationCampaign.count as jest.Mock).mockResolvedValue(0);
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("campaigns");
  });
});

describe("POST /api/admin/abc/cotisation/campaigns", () => {
  const adminSession = { user: { id: "u1", role: "admin" } };

  it("returns 400 for missing title", async () => {
    (mockAuth.api.getSession as jest.Mock).mockResolvedValue(adminSession);
    const res = await POST(makeRequest("POST", { year: 2026, dueDate: "2026-04-30" }));
    expect(res.status).toBe(400);
  });

  it("creates campaign and returns 201", async () => {
    (mockAuth.api.getSession as jest.Mock).mockResolvedValue(adminSession);
    (mockPrisma.abcCotisationCampaign.create as jest.Mock).mockResolvedValue({
      id: "camp-1", title: "Cotisation 2026", year: 2026, dueDate: new Date("2026-04-30"), status: "DRAFT",
    });
    const res = await POST(makeRequest("POST", {
      title: "Cotisation 2026", year: 2026, dueDate: "2026-04-30T00:00:00.000Z",
    }));
    expect(res.status).toBe(201);
  });
});
```

- [ ] **Step 2: Implémenter `app/api/admin/abc/cotisation/campaigns/route.ts`**

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const campaigns = await prisma.abcCotisationCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { notices: true } },
      notices: { select: { status: true } },
    },
  });

  const total = campaigns.length;
  return NextResponse.json({ campaigns, total });
}

export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const { title, year, dueDate, description } = body ?? {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }
  if (!year || typeof year !== "number") {
    return NextResponse.json({ error: "Année requise" }, { status: 400 });
  }
  if (!dueDate) {
    return NextResponse.json({ error: "Date d'échéance requise" }, { status: 400 });
  }

  const campaign = await prisma.abcCotisationCampaign.create({
    data: {
      title: title.trim(),
      year,
      dueDate: new Date(dueDate),
      description: description?.trim() || null,
      createdById: session!.user.id,
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
```

- [ ] **Step 3: Lancer les tests**

```bash
pnpm test __tests__/api/cotisation-campaigns.test.ts 2>&1 | tail -20
```

Attendu : PASS — 5 tests.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/abc/cotisation/campaigns/ __tests__/api/cotisation-campaigns.test.ts
git commit -m "feat(api): add cotisation campaigns CRUD endpoint"
```

---

### Task 4: API campagne individuelle + actions send/remind

**Files:**
- Create: `app/api/admin/abc/cotisation/campaigns/[id]/route.ts`
- Create: `app/api/admin/abc/cotisation/campaigns/[id]/send/route.ts`
- Create: `app/api/admin/abc/cotisation/campaigns/[id]/remind/route.ts`
- Create: `lib/abc/cotisation-email.ts`

- [ ] **Step 1: Créer `app/api/admin/abc/cotisation/campaigns/[id]/route.ts`** (GET/PUT/DELETE)

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const campaign = await prisma.abcCotisationCampaign.findUnique({
    where: { id },
    include: {
      notices: {
        include: {
          member: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { notices: true } },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
  return NextResponse.json({ campaign });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const campaign = await prisma.abcCotisationCampaign.findUnique({ where: { id }, select: { status: true } });
  if (!campaign) return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
  if (campaign.status !== "DRAFT") {
    return NextResponse.json({ error: "Seules les campagnes DRAFT sont modifiables" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const { title, description, dueDate } = body;

  const updated = await prisma.abcCotisationCampaign.update({
    where: { id },
    data: {
      ...(title ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
    },
  });

  return NextResponse.json({ campaign: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const campaign = await prisma.abcCotisationCampaign.findUnique({ where: { id }, select: { status: true } });
  if (!campaign) return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
  if (campaign.status === "SENT") {
    return NextResponse.json({ error: "Impossible de supprimer une campagne déjà envoyée" }, { status: 409 });
  }

  await prisma.abcCotisationCampaign.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Créer `lib/abc/cotisation-email.ts`** (helpers email)

```typescript
import { sendEmail } from "@/lib/email";

export interface NoticeEmailData {
  memberName: string;
  memberEmail: string;
  campaignTitle: string;
  year: number;
  amount: number;
  dueDate: Date;
  pdfUrl?: string;
  isReminder?: boolean;
}

export async function sendCotisationEmail(data: NoticeEmailData): Promise<void> {
  const subject = data.isReminder
    ? `Rappel — Cotisation ABC Bédarieux ${data.year} en attente`
    : `Cotisation ABC Bédarieux ${data.year} — Merci de régler avant le ${data.dueDate.toLocaleDateString("fr-FR")}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${data.isReminder ? '<p style="color: #dc2626; font-weight: bold;">Ceci est un rappel.</p>' : ""}
      <h2>${data.campaignTitle}</h2>
      <p>Bonjour ${data.memberName},</p>
      <p>
        Nous vous informons que votre cotisation pour l'année <strong>${data.year}</strong>
        s'élève à <strong>${data.amount}€</strong>.
      </p>
      <p>Date d'échéance : <strong>${data.dueDate.toLocaleDateString("fr-FR")}</strong></p>
      ${data.pdfUrl ? `<p><a href="${data.pdfUrl}" style="color: #2563eb;">Télécharger votre avis de cotisation (PDF)</a></p>` : ""}
      <p>Pour tout règlement, veuillez vous rapprocher du bureau de l'association ou effectuer un virement bancaire.</p>
      <hr />
      <p style="font-size: 12px; color: #6b7280;">Association ABC Bédarieux</p>
    </div>
  `;

  await sendEmail({ to: data.memberEmail, subject, html });
}
```

- [ ] **Step 3: Créer `app/api/admin/abc/cotisation/campaigns/[id]/send/route.ts`**

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCotisationEmail } from "@/lib/abc/cotisation-email";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const campaign = await prisma.abcCotisationCampaign.findUnique({
    where: { id },
    include: {
      notices: {
        where: { status: "PENDING" },
        include: { member: { include: { user: { select: { name: true, email: true } } } } },
      },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
  if (campaign.status !== "DRAFT") {
    return NextResponse.json({ error: "Seules les campagnes DRAFT peuvent être envoyées" }, { status: 409 });
  }

  const results = { sent: 0, failed: 0 };
  const now = new Date();

  for (const notice of campaign.notices) {
    const email = notice.member.user?.email;
    const name = notice.member.user?.name ?? "Membre";
    if (!email) { results.failed++; continue; }

    try {
      await sendCotisationEmail({
        memberName: name,
        memberEmail: email,
        campaignTitle: campaign.title,
        year: campaign.year,
        amount: notice.amount,
        dueDate: campaign.dueDate,
      });
      await prisma.abcCotisationNotice.update({
        where: { id: notice.id },
        data: { status: "SENT", sentAt: now },
      });
      results.sent++;
    } catch {
      results.failed++;
    }
  }

  // Passe la campagne en SENT si au moins un email envoyé
  if (results.sent > 0) {
    await prisma.abcCotisationCampaign.update({
      where: { id },
      data: { status: "SENT" },
    });
  }

  return NextResponse.json({ results });
}
```

- [ ] **Step 4: Créer `app/api/admin/abc/cotisation/campaigns/[id]/remind/route.ts`**

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCotisationEmail } from "@/lib/abc/cotisation-email";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const campaign = await prisma.abcCotisationCampaign.findUnique({
    where: { id },
    include: {
      notices: {
        where: { status: "SENT" }, // uniquement les SENT non payés
        include: { member: { include: { user: { select: { name: true, email: true } } } } },
      },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });

  const results = { reminded: 0, failed: 0 };
  const now = new Date();

  for (const notice of campaign.notices) {
    const email = notice.member.user?.email;
    const name = notice.member.user?.name ?? "Membre";
    if (!email) { results.failed++; continue; }

    try {
      await sendCotisationEmail({
        memberName: name,
        memberEmail: email,
        campaignTitle: campaign.title,
        year: campaign.year,
        amount: notice.amount,
        dueDate: campaign.dueDate,
        isReminder: true,
      });
      await prisma.abcCotisationNotice.update({
        where: { id: notice.id },
        data: { status: "REMINDED", reminderSentAt: now },
      });
      results.reminded++;
    } catch {
      results.failed++;
    }
  }

  return NextResponse.json({ results });
}
```

- [ ] **Step 5: Type-check**

```bash
pnpm type-check 2>&1 | grep "error" | head -20
```

Attendu : 0 erreurs.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/abc/cotisation/campaigns/ lib/abc/cotisation-email.ts
git commit -m "feat(api): add cotisation campaign detail, send, and remind endpoints"
```

---

## Chunk 3: API Notices

### Task 5: API Notices (bulk add, patch, delete)

**Files:**
- Create: `app/api/admin/abc/cotisation/campaigns/[id]/notices/route.ts`
- Create: `app/api/admin/abc/cotisation/campaigns/[id]/notices/[noticeId]/route.ts`

- [ ] **Step 1: Créer `notices/route.ts`** (POST bulk)

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AMOUNTS } from "@/lib/abc/cotisation-defaults";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: campaignId } = await params;
  const campaign = await prisma.abcCotisationCampaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
  if (campaign.status !== "DRAFT") {
    return NextResponse.json({ error: "Impossible d'ajouter des membres à une campagne non DRAFT" }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const memberInputs: { memberId: string; amount?: number }[] = body?.members ?? [];

  if (!Array.isArray(memberInputs) || memberInputs.length === 0) {
    return NextResponse.json({ error: "Liste de membres requise" }, { status: 400 });
  }

  // Récupère les types de membres pour les montants par défaut
  const memberIds = memberInputs.map((m) => m.memberId);
  const members = await prisma.abcMember.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, type: true },
  });
  const memberTypeMap = Object.fromEntries(members.map((m) => [m.id, m.type]));

  // createMany avec skipDuplicates pour ignorer les doublons
  const data = memberInputs.map((input) => ({
    campaignId,
    memberId: input.memberId,
    amount: input.amount ?? DEFAULT_AMOUNTS[memberTypeMap[input.memberId]] ?? 50,
  }));

  const result = await prisma.abcCotisationNotice.createMany({
    data,
    skipDuplicates: true,
  });

  return NextResponse.json({ created: result.count }, { status: 201 });
}
```

- [ ] **Step 2: Créer `notices/[noticeId]/route.ts`** (PATCH / DELETE)

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  return { session };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; noticeId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { noticeId } = await params;
  const body = await request.json().catch(() => ({}));
  const { amount, status, notes } = body;

  const updateData: Record<string, unknown> = {};
  if (amount !== undefined) {
    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 422 });
    }
    updateData.amount = amount;
  }
  if (status !== undefined) {
    const allowed = ["PAID", "CANCELLED", "PENDING"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 422 });
    }
    updateData.status = status;
    if (status === "PAID") updateData.paidAt = new Date();
  }
  if (notes !== undefined) updateData.notes = notes;

  try {
    const updated = await prisma.abcCotisationNotice.update({
      where: { id: noticeId },
      data: updateData,
    });
    return NextResponse.json({ notice: updated });
  } catch (e: any) {
    if (e?.code === "P2025") return NextResponse.json({ error: "Notice non trouvée" }, { status: 404 });
    throw e;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; noticeId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: campaignId, noticeId } = await params;
  const campaign = await prisma.abcCotisationCampaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 });
  if (campaign.status !== "DRAFT") {
    return NextResponse.json({ error: "Impossible de supprimer une notice d'une campagne envoyée" }, { status: 409 });
  }

  try {
    await prisma.abcCotisationNotice.delete({ where: { id: noticeId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "P2025") return NextResponse.json({ error: "Notice non trouvée" }, { status: 404 });
    throw e;
  }
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check 2>&1 | grep "error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/abc/cotisation/campaigns/[id]/notices/
git commit -m "feat(api): add cotisation notices bulk-add, patch, delete endpoints"
```

---

## Chunk 4: Lien paiement → notice + UI (via Gemini)

### Task 6: Lien AbcPayment → notice PAID automatique

**Files:**
- Modify: `app/api/admin/abc/members/[memberId]/payments/route.ts` (ou équivalent)

- [ ] **Step 1: Identifier l'endpoint de création de paiement**

```bash
grep -r "abcPayment.create\|AbcPayment" /c/abcbedarieuxv2/app/api --include="*.ts" -l | head -5
```

- [ ] **Step 2: Ajouter la logique post-création**

Après la création d'un `AbcPayment`, chercher une notice correspondante (`memberId` + `campaign.year === payment.year`) et la passer en PAID :

```typescript
// Après prisma.abcPayment.create(...)
const paidYear = payment.year; // ou l'année extraite du paiement
if (paidYear) {
  await prisma.abcCotisationNotice.updateMany({
    where: {
      memberId: payment.memberId,
      status: { in: ["PENDING", "SENT", "REMINDED"] },
      campaign: { year: paidYear },
    },
    data: { status: "PAID", paidAt: new Date() },
  });
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check 2>&1 | grep "error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/abc/
git commit -m "feat(api): auto-mark cotisation notice as PAID when payment is created"
```

---

### Task 7: UI — Liste campagnes (via Gemini)

**Files:**
- Create: `app/(dashboard)/dashboard/admin/abc/cotisation/page.tsx`

> ⚠️ **RÈGLE ABSOLUE (CLAUDE.md)** : Tout code UI/frontend DOIT passer par Gemini MCP.

- [ ] **Step 1: Passer à Gemini**

Contexte à fournir :
- `app/globals.css` + `tailwind.config.ts` (variables CSS)
- Référence layout : `app/(dashboard)/dashboard/admin/abc/members/page.tsx`
- API : `GET /api/admin/abc/cotisation/campaigns` retourne `{ campaigns: [...] }`
- Chaque campagne a : `id`, `title`, `year`, `dueDate`, `status` (DRAFT/SENT/CLOSED), `notices[]` avec `status`
- Specs :
  - Tableau avec colonnes : Titre, Année, Échéance, Statut badge, Payés/Total, Actions
  - LATE calculé si `dueDate < now && status === "SENT"` et notices SENT/REMINDED
  - Badge "X en retard" rouge si applicable
  - Boutons : Voir (→ `/dashboard/admin/abc/cotisation/[id]`), Rappeler (si SENT), Supprimer (si DRAFT)
  - Bouton "Nouvelle campagne" en haut → dialog ou page de création

- [ ] **Step 2: Écrire le code Gemini sur le disque**

- [ ] **Step 3: Type-check**

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/dashboard/admin/abc/cotisation/
git commit -m "feat(ui): add cotisation campaigns list page"
```

---

### Task 8: UI — Détail campagne (via Gemini)

**Files:**
- Create: `app/(dashboard)/dashboard/admin/abc/cotisation/[id]/page.tsx`

- [ ] **Step 1: Passer à Gemini**

Contexte :
- API : `GET /api/admin/abc/cotisation/campaigns/[id]` retourne `{ campaign: { ...campaign, notices: [...] } }`
- Specs :
  - 4 cartes stats : Payés / En attente / Relancés / Annulés (calculées depuis `notices`)
  - Bouton "Ajouter membres" → dialog multi-sélection avec combobox + montants éditables
  - Bouton "Envoyer (N)" → confirmation → POST `/send` (N = nb notices PENDING)
  - Bouton "Envoyer rappels (N)" → confirmation → POST `/remind` (N = nb notices SENT)
  - Tableau notices : Membre, Montant, Statut badge coloré + "En retard" calculé, Envoyé le, Actions
  - Actions par notice : Marquer payé (PATCH status=PAID), Annuler (PATCH status=CANCELLED), Modifier montant, Supprimer
- Référence layout : pages existantes dans `/dashboard/admin/abc/`

- [ ] **Step 2: Écrire le code Gemini sur le disque**

- [ ] **Step 3: Ajouter lien "Cotisations" dans la navigation ABC**

Dans `app/(dashboard)/dashboard/admin/abc/page.tsx` ou la sidebar ABC, ajouter un lien vers `/dashboard/admin/abc/cotisation`.

- [ ] **Step 4: Type-check**

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/dashboard/admin/abc/cotisation/[id]/
git commit -m "feat(ui): add cotisation campaign detail page with notices management"
```

---

## Chunk 5: Vérification finale

### Task 9: Tests complets + lint + type-check + smoke test

- [ ] **Step 1: Tests**

```bash
cd /c/abcbedarieuxv2/.worktrees/feature-cotisation
pnpm test 2>&1 | tail -30
```

Attendu : tous les tests passent.

- [ ] **Step 2: Type-check**

```bash
pnpm type-check 2>&1 | grep "error" | wc -l
```

Attendu : 0 erreur.

- [ ] **Step 3: Lint**

```bash
pnpm lint 2>&1 | grep "error" | wc -l
```

Attendu : 0 erreur.

- [ ] **Step 4: db:push sur le repo principal**

```bash
cd /c/abcbedarieuxv2
pnpm db:push && pnpm db:generate
```

- [ ] **Step 5: Smoke test**

Démarrer le dev server et vérifier :
1. `/dashboard/admin/abc/cotisation` → page charge, tableau vide (pas de campagne)
2. Créer une campagne → apparaît dans la liste avec statut BROUILLON
3. Ajouter un membre → notice apparaît dans le détail
4. Vérifier que la navigation ABC affiche "Cotisations"

- [ ] **Step 6: Invoquer `superpowers:finishing-a-development-branch`**
