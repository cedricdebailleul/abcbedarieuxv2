# Association ABC Phase 1 — Données membres — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add member-place bidirectional linking and CSV/XLSX import-export to the ABC association admin interface.

**Architecture:** Schema-first approach — AbcMemberPlace join table is added first (required by export feature). Then API routes for member-place management. Then export/import API + UI. All new code follows existing codebase patterns (Next.js 15 App Router, Prisma, shadcn/ui, French locale).

**Tech Stack:** Next.js 15 App Router, Prisma ORM (db:push), PostgreSQL, shadcn/ui, SheetJS (xlsx), TypeScript, Jest

---

## Schema field mappings (read before implementing)

The spec uses simplified names — actual Prisma field names differ:

| Spec name | Actual Prisma field | Notes |
|---|---|---|
| `nom` | `member.user.profile.lastname` | Profile uses lowercase |
| `prenom` | `member.user.profile.firstname` | Profile uses lowercase |
| `telephone` | `member.user.profile.phone` | nullable |
| `type` | `member.type` | **NOT** `memberType` — field is `type: AbcMemberType` |
| `dateAdhesion` | `member.membershipDate` | nullable DateTime |
| `dateExpiration` | `member.expiresAt` | nullable DateTime |
| `cotisationAnnee` | `member.payments[0].year` | sorted `year` desc, `createdAt` desc |
| `cotisationMontant` | `member.payments[0].amount` | |
| `cotisationStatut` | `member.payments[0].status` | |

Auth pattern for all admin routes:
```typescript
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-utils"; // or inline cast

const session = await auth.api.getSession({ headers: request.headers });
if (!session?.user || !["admin", "moderator"].includes((session.user as any).role)) {
  return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
}
```

Prisma import path (non-standard):
```typescript
import { prisma } from "@/lib/prisma";
```

---

## Chunk 1: Schema — AbcMemberPlace join table

### Task 1: Add enum and model to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the enum after the existing AbcMemberStatus enum block**

Find the block containing `enum AbcMemberStatus` in `prisma/schema.prisma` and add after it:

```prisma
enum AbcMemberPlaceRole {
  GERANT
  ASSOCIE
  SALARIE
  AUTRE
}
```

- [ ] **Step 2: Add the AbcMemberPlace model after the AbcMember model**

Find the `model AbcMember` block and add this new model after its closing `}`:

```prisma
model AbcMemberPlace {
  id        String             @id @default(cuid())
  memberId  String
  placeId   String
  role      AbcMemberPlaceRole @default(GERANT)
  member    AbcMember          @relation(fields: [memberId], references: [id], onDelete: Cascade)
  place     Place              @relation(fields: [placeId], references: [id], onDelete: Cascade)
  createdAt DateTime           @default(now())

  @@unique([memberId, placeId])
  @@index([memberId])
  @@index([placeId])
  @@map("abc_member_places")
}
```

- [ ] **Step 3: Add relation fields to AbcMember and Place models**

In `model AbcMember`, add inside the `// Relations` section (after `documents AbcDocumentShare[]`):
```prisma
places    AbcMemberPlace[]
```

In `model Place`, add at the end of the relations section (near `reviews`, `favorites`, etc.):
```prisma
abcMembers AbcMemberPlace[]
```

Both fields are required for the bidirectional relation — without `abcMembers` on Place, the Prisma relation will fail to generate.

- [ ] **Step 4: Push schema to database**

```bash
pnpm db:push
```

Expected: `Your database is now in sync with your Prisma schema.`
If prompted about data loss: there is none — only new tables and new relation fields.

- [ ] **Step 5: Regenerate Prisma client**

```bash
pnpm db:generate
```

Expected: `Generated Prisma Client ... in Xms`

- [ ] **Step 6: Verify TypeScript compiles**

```bash
pnpm type-check
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma lib/generated/prisma
git commit -m "feat(association): add AbcMemberPlace join table and AbcMemberPlaceRole enum"
```

---

## Chunk 2: API — Member-Place link management

### Task 2: API routes for member → places

**Files:**
- Create: `app/api/admin/abc/members/[memberId]/places/route.ts`
- Create: `app/api/admin/abc/members/[memberId]/places/[placeId]/route.ts`

- [ ] **Step 1: Write test for GET and POST**

Create `__tests__/api/abc-member-places.test.ts`:

```typescript
import { buildMemberPlaceRows } from "@/lib/abc/member-place-utils";

describe("buildMemberPlaceRows", () => {
  it("returns empty array for member with no places", () => {
    expect(buildMemberPlaceRows([])).toEqual([]);
  });

  it("maps role to French label", () => {
    const rows = buildMemberPlaceRows([
      { id: "1", placeId: "p1", role: "GERANT", place: { name: "Commerce A", slug: "commerce-a", streetNumber: "12", street: "Rue de la Paix", postalCode: "34600", city: "Bédarieux" }, createdAt: new Date() }
    ]);
    expect(rows[0].roleLabel).toBe("Gérant");
    expect(rows[0].placeNom).toBe("Commerce A");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm test -- --testPathPattern="abc-member-places" --no-coverage
```

Expected: FAIL — `buildMemberPlaceRows` not found

- [ ] **Step 3: Create the utility**

Create `lib/abc/member-place-utils.ts`:

```typescript
export const ROLE_LABELS: Record<string, string> = {
  GERANT: "Gérant",
  ASSOCIE: "Associé",
  SALARIE: "Salarié",
  AUTRE: "Autre",
};

interface PlaceLink {
  id: string;
  placeId: string;
  role: string;
  place: {
    name: string;
    slug: string;
    streetNumber: string | null;
    street: string | null;
    postalCode: string;
    city: string;
  };
  createdAt: Date;
}

export function buildMemberPlaceRows(places: PlaceLink[]) {
  return places.map((link) => ({
    id: link.id,
    placeId: link.placeId,
    role: link.role,
    roleLabel: ROLE_LABELS[link.role] ?? link.role,
    placeNom: link.place.name,
    placeAdresse: [
      link.place.streetNumber,
      link.place.street,
      link.place.postalCode,
      link.place.city,
    ]
      .filter(Boolean)
      .join(" "),
    createdAt: link.createdAt,
  }));
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
pnpm test -- --testPathPattern="abc-member-places" --no-coverage
```

Expected: PASS

- [ ] **Step 5: Create GET + POST route for member places**

Create `app/api/admin/abc/members/[memberId]/places/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PLACE_SELECT = {
  id: true,
  placeId: true,
  role: true,
  createdAt: true,
  place: {
    select: {
      name: true,
      slug: true,
      streetNumber: true,
      street: true,
      postalCode: true,
      city: true,
    },
  },
};

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const role = (session?.user as any)?.role;
  if (!session?.user || !["admin", "moderator"].includes(role)) return null;
  return session;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }
  const { memberId } = await params;

  const member = await prisma.abcMember.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
  }

  const places = await prisma.abcMemberPlace.findMany({
    where: { memberId },
    select: PLACE_SELECT,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ places });
}

const createSchema = z.object({
  placeId: z.string().min(1),
  role: z.enum(["GERANT", "ASSOCIE", "SALARIE", "AUTRE"]).default("GERANT"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }
  const { memberId } = await params;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
  }

  const member = await prisma.abcMember.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
  }

  const place = await prisma.place.findUnique({ where: { id: parsed.data.placeId } });
  if (!place) {
    return NextResponse.json({ error: "Commerce non trouvé" }, { status: 404 });
  }

  const existing = await prisma.abcMemberPlace.findUnique({
    where: { memberId_placeId: { memberId, placeId: parsed.data.placeId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ce lien existe déjà" }, { status: 409 });
  }

  const link = await prisma.abcMemberPlace.create({
    data: { memberId, placeId: parsed.data.placeId, role: parsed.data.role },
    select: PLACE_SELECT,
  });

  return NextResponse.json({ link }, { status: 201 });
}
```

- [ ] **Step 6: Create PATCH + DELETE route for individual link**

Create `app/api/admin/abc/members/[memberId]/places/[placeId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const role = (session?.user as any)?.role;
  if (!session?.user || !["admin", "moderator"].includes(role)) return null;
  return session;
}

const patchSchema = z.object({
  role: z.enum(["GERANT", "ASSOCIE", "SALARIE", "AUTRE"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string; placeId: string }> }
) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }
  const { memberId, placeId } = await params;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const link = await prisma.abcMemberPlace.findUnique({
    where: { memberId_placeId: { memberId, placeId } },
  });
  if (!link) {
    return NextResponse.json({ error: "Lien non trouvé" }, { status: 404 });
  }

  const updated = await prisma.abcMemberPlace.update({
    where: { memberId_placeId: { memberId, placeId } },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({ link: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string; placeId: string }> }
) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }
  const { memberId, placeId } = await params;

  const link = await prisma.abcMemberPlace.findUnique({
    where: { memberId_placeId: { memberId, placeId } },
  });
  if (!link) {
    return NextResponse.json({ error: "Lien non trouvé" }, { status: 404 });
  }

  await prisma.abcMemberPlace.delete({
    where: { memberId_placeId: { memberId, placeId } },
  });

  return NextResponse.json({ success: true });
}
```

### Task 3: API route — place → members

**Files:**
- Create: `app/api/admin/abc/places/[placeId]/members/route.ts`

- [ ] **Step 7: Create GET route for place members**

Create `app/api/admin/abc/places/[placeId]/members/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const role = (session?.user as any)?.role;
  if (!session?.user || !["admin", "moderator"].includes(role)) return null;
  return session;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }
  const { placeId } = await params;

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) {
    return NextResponse.json({ error: "Commerce non trouvé" }, { status: 404 });
  }

  const members = await prisma.abcMemberPlace.findMany({
    where: { placeId },
    select: {
      id: true,
      role: true,
      createdAt: true,
      member: {
        select: {
          id: true,
          memberNumber: true,
          role: true,
          status: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ members });
}
```

- [ ] **Step 8: Run type-check**

```bash
pnpm type-check
```

Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add app/api/admin/abc/members/[memberId]/places/ app/api/admin/abc/places/ lib/abc/ __tests__/api/abc-member-places.test.ts
git commit -m "feat(association): add member-place link API routes (GET, POST, PATCH, DELETE)"
```

---

## Chunk 3: UI — Member-Place linking

### Task 4: "Commerces" tab in edit-member-dialog

**Files:**
- Modify: `components/admin/abc/edit-member-dialog.tsx`

Note: Read the full existing file before modifying. The dialog currently has no tabs — you are adding a tabbed interface. Import `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs`.

- [ ] **Step 1: Read the current edit-member-dialog.tsx in full**

```bash
# In your editor or via Read tool
```

Expected: understand current structure — form fields, state, layout

- [ ] **Step 2: Add tab wrapping to the dialog**

Wrap the existing form content in `<TabsContent value="infos">` and add a new `<TabsContent value="commerces">`.

The dialog's `DialogContent` body should become:

```tsx
<Tabs defaultValue="infos">
  <TabsList className="mb-4">
    <TabsTrigger value="infos">Informations</TabsTrigger>
    <TabsTrigger value="commerces">Commerces</TabsTrigger>
  </TabsList>

  <TabsContent value="infos">
    {/* existing form fields here — unchanged */}
  </TabsContent>

  <TabsContent value="commerces">
    <MemberPlacesTab memberId={member.id} />
  </TabsContent>
</Tabs>
```

- [ ] **Step 3: Create MemberPlacesTab component**

Create `components/admin/abc/member-places-tab.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, Plus, ChevronsUpDown } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  GERANT: "Gérant",
  ASSOCIE: "Associé",
  SALARIE: "Salarié",
  AUTRE: "Autre",
};

interface PlaceLink {
  id: string;
  placeId: string;
  role: string;
  place: { name: string; slug: string };
}

interface Place {
  id: string;
  name: string;
  city: string;
}

interface MemberPlacesTabProps {
  memberId: string;
}

export function MemberPlacesTab({ memberId }: MemberPlacesTabProps) {
  const [links, setLinks] = useState<PlaceLink[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [selectedRole, setSelectedRole] = useState("GERANT");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/abc/members/${memberId}/places`).then((r) => r.json()),
      fetch("/api/admin/abc/places-list").then((r) => r.json()),
    ]).then(([linksData, placesData]) => {
      setLinks(linksData.places ?? []);
      setAllPlaces(placesData.places ?? []);
      setLoading(false);
    });
  }, [memberId]);

  async function handleAdd() {
    if (!selectedPlaceId) return;
    setAdding(true);
    setError(null);
    const res = await fetch(`/api/admin/abc/members/${memberId}/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: selectedPlaceId, role: selectedRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
    } else {
      setLinks((prev) => [...prev, data.link]);
      setSelectedPlaceId("");
      setSelectedRole("GERANT");
    }
    setAdding(false);
  }

  async function handleRoleChange(placeId: string, role: string) {
    await fetch(`/api/admin/abc/members/${memberId}/places/${placeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setLinks((prev) =>
      prev.map((l) => (l.placeId === placeId ? { ...l, role } : l))
    );
  }

  async function handleDelete(placeId: string) {
    await fetch(`/api/admin/abc/members/${memberId}/places/${placeId}`, {
      method: "DELETE",
    });
    setLinks((prev) => prev.filter((l) => l.placeId !== placeId));
  }

  if (loading) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-4">
      {links.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun commerce lié.</p>
      )}

      {links.map((link) => (
        <div key={link.id} className="flex items-center gap-2 rounded border p-2">
          <span className="flex-1 text-sm font-medium">{link.place.name}</span>
          <Select
            value={link.role}
            onValueChange={(role) => handleRoleChange(link.placeId, role)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(link.placeId)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-2 pt-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-between">
              {selectedPlaceId
                ? allPlaces.find((p) => p.id === selectedPlaceId)?.name
                : "Choisir un commerce..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <Command>
              <CommandInput placeholder="Rechercher..." />
              <CommandEmpty>Aucun résultat.</CommandEmpty>
              <CommandGroup>
                {allPlaces
                  .filter((p) => !links.some((l) => l.placeId === p.id))
                  .map((place) => (
                    <CommandItem
                      key={place.id}
                      onSelect={() => {
                        setSelectedPlaceId(place.id);
                        setOpen(false);
                      }}
                    >
                      {place.name} — {place.city}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleAdd} disabled={!selectedPlaceId || adding} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create places-list API endpoint (needed by MemberPlacesTab)**

Create `app/api/admin/abc/places-list/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const role = (session?.user as any)?.role;
  if (!session?.user || !["admin", "moderator"].includes(role)) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const places = await prisma.place.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ places });
}
```

- [ ] **Step 5: Run type-check**

```bash
pnpm type-check
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add components/admin/abc/edit-member-dialog.tsx components/admin/abc/member-places-tab.tsx app/api/admin/abc/places-list/
git commit -m "feat(association): add Commerces tab to edit-member-dialog"
```

### Task 5: "Commerce(s)" column in members table

**Files:**
- Modify: `app/(dashboard)/dashboard/admin/abc/members/page.tsx`

- [ ] **Step 7: Update the members fetch to include places**

In the `fetchMembers` function, the API call returns members. The existing GET endpoint needs to include `places` in the response. Update `app/api/admin/abc/members/route.ts` — in the `findMany` include block, add:

```typescript
places: {
  take: 2,
  select: {
    role: true,
    place: { select: { name: true } },
  },
  orderBy: { createdAt: "asc" },
},
```

- [ ] **Step 8: Add the "Commerce(s)" column to the table**

In `app/(dashboard)/dashboard/admin/abc/members/page.tsx`, find the `<TableHead>` row and add a new header after the "Paiements" column:

```tsx
<TableHead>Commerce(s)</TableHead>
```

Find the corresponding `<TableRow>` mapping and add:

```tsx
<TableCell>
  {member.places && member.places.length > 0 ? (
    <span className="text-sm">
      {member.places[0].place.name}
      {member.places.length > 1 && (
        <Badge variant="secondary" className="ml-1 text-xs">
          +{member.places.length - 1}
        </Badge>
      )}
    </span>
  ) : (
    <span className="text-muted-foreground text-sm">—</span>
  )}
</TableCell>
```

- [ ] **Step 9: Run type-check**

```bash
pnpm type-check
```

Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add app/(dashboard)/dashboard/admin/abc/members/page.tsx app/api/admin/abc/members/route.ts
git commit -m "feat(association): add Commerce(s) column to members table"
```

### Task 6: "Membres ABC" section in places admin

**Files:**
- Modify: `app/(dashboard)/dashboard/admin/places/page.tsx` (or wherever the places admin list lives)

- [ ] **Step 11: Read the places admin page**

Read `app/(dashboard)/dashboard/admin/places/page.tsx` to understand the current structure.

- [ ] **Step 12: Add AbcMember indicator to places list**

In the places list, add a "Membres ABC" badge to each row that shows the count of linked ABC members. This requires fetching `_count.abcMembers` from the API.

Update the places API include (or create a lightweight addition) to include `_count: { select: { abcMembers: true } }`.

In the places table row, add a cell or badge:

```tsx
{place._count?.abcMembers > 0 && (
  <Badge variant="outline" className="text-xs">
    {place._count.abcMembers} membre{place._count.abcMembers > 1 ? "s" : ""} ABC
  </Badge>
)}
```

- [ ] **Step 13: Run type-check**

```bash
pnpm type-check
```

Expected: no errors

- [ ] **Step 14: Commit**

```bash
git add app/(dashboard)/dashboard/admin/places/
git commit -m "feat(association): add ABC members count indicator on places admin page"
```

---

## Chunk 4: Export CSV & XLSX

### Task 7: Install xlsx and create export utility

**Files:**
- Modify: `package.json` (via pnpm add)
- Create: `lib/abc/member-export.ts`

- [ ] **Step 1: Install SheetJS**

```bash
pnpm add xlsx
```

Expected: `+ xlsx@X.X.X` in output

- [ ] **Step 2: Write test for the export helper**

Create `__tests__/api/abc-member-export.test.ts`:

```typescript
import { buildMemberRows, membersToWorkbook } from "@/lib/abc/member-export";

const fakeMember = {
  memberNumber: "ABC001",
  type: "ACTIF",
  role: "MEMBRE",
  status: "ACTIVE",
  membershipDate: new Date("2024-01-15"),
  expiresAt: new Date("2024-12-31"),
  joinedAt: new Date("2024-01-15"),
  user: {
    email: "test@example.com",
    name: "Marie Dupont",
    profile: { firstname: "Marie", lastname: "Dupont", phone: "0612345678" },
  },
  payments: [
    { year: 2024, amount: 50, status: "PAID", createdAt: new Date("2024-03-01") },
  ],
  places: [
    {
      place: {
        name: "Boutique Test",
        streetNumber: "12",
        street: "Rue de la Paix",
        postalCode: "34600",
        city: "Bédarieux",
      },
    },
  ],
};

describe("buildMemberRows", () => {
  it("builds a row with all expected fields", () => {
    const rows = buildMemberRows([fakeMember as any]);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.action).toBe("update");
    expect(row.email).toBe("test@example.com");
    expect(row.nom).toBe("Dupont");
    expect(row.prenom).toBe("Marie");
    expect(row.telephone).toBe("0612345678");
    expect(row.cotisationAnnee).toBe(2024);
    expect(row.placeNom).toBe("Boutique Test");
  });

  it("falls back to user.name split when profile missing", () => {
    const member = { ...fakeMember, user: { ...fakeMember.user, name: "Jean Martin", profile: null } };
    const rows = buildMemberRows([member as any]);
    expect(rows[0].prenom).toBe("Jean");
    expect(rows[0].nom).toBe("Martin");
  });

  it("returns empty strings for missing optional fields", () => {
    const member = { ...fakeMember, payments: [], places: [] };
    const rows = buildMemberRows([member as any]);
    expect(rows[0].cotisationAnnee).toBe("");
    expect(rows[0].placeNom).toBe("");
  });
});

describe("membersToWorkbook", () => {
  it("creates a workbook with one sheet", () => {
    const wb = membersToWorkbook(buildMemberRows([fakeMember as any]));
    expect(wb.SheetNames).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
pnpm test -- --testPathPattern="abc-member-export" --no-coverage
```

Expected: FAIL — module not found

- [ ] **Step 4: Create the export utility**

Create `lib/abc/member-export.ts`:

```typescript
import * as XLSX from "xlsx";

export const EXPORT_HEADERS = [
  "action", "numero", "nom", "prenom", "email", "telephone",
  "type", "role", "statut", "dateAdhesion", "dateExpiration",
  "cotisationAnnee", "cotisationMontant", "cotisationStatut",
  "placeNom", "placeAdresse",
];

function getNameParts(user: { name: string; profile?: { firstname?: string | null; lastname?: string | null } | null }) {
  if (user.profile?.firstname || user.profile?.lastname) {
    return { prenom: user.profile.firstname ?? "", nom: user.profile.lastname ?? "" };
  }
  const parts = user.name.split(" ");
  return { prenom: parts[0] ?? "", nom: parts.slice(1).join(" ") };
}

export function buildMemberRows(members: any[]) {
  return members.map((m) => {
    const { prenom, nom } = getNameParts(m.user);

    // Latest payment: sort by year desc, createdAt desc
    const latestPayment = [...(m.payments ?? [])].sort((a, b) =>
      b.year !== a.year ? b.year - a.year : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    const firstPlace = m.places?.[0]?.place;
    const placeAdresse = firstPlace
      ? [firstPlace.streetNumber, firstPlace.street, firstPlace.postalCode, firstPlace.city]
          .filter(Boolean)
          .join(" ")
      : "";

    return {
      action: "update",
      numero: m.memberNumber ?? "",
      nom,
      prenom,
      email: m.user.email,
      telephone: m.user.profile?.phone ?? "",
      type: m.type,
      role: m.role,
      statut: m.status,
      dateAdhesion: m.membershipDate ? new Date(m.membershipDate).toISOString().split("T")[0] : "",
      dateExpiration: m.expiresAt ? new Date(m.expiresAt).toISOString().split("T")[0] : "",
      cotisationAnnee: latestPayment?.year ?? "",
      cotisationMontant: latestPayment?.amount ?? "",
      cotisationStatut: latestPayment?.status ?? "",
      placeNom: firstPlace?.name ?? "",
      placeAdresse,
    };
  });
}

export function membersToWorkbook(rows: ReturnType<typeof buildMemberRows>) {
  const wsData = [EXPORT_HEADERS, ...rows.map((r) => EXPORT_HEADERS.map((h) => (r as any)[h] ?? ""))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Bold headers (row 1)
  for (let c = 0; c < EXPORT_HEADERS.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[cellRef]) ws[cellRef].s = { font: { bold: true } };
  }

  // Auto column widths
  ws["!cols"] = EXPORT_HEADERS.map((h, i) => ({
    wch: Math.max(h.length, ...rows.map((r) => String((r as any)[h] ?? "").length)) + 2,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Membres");
  return wb;
}

export function membersToCSV(rows: ReturnType<typeof buildMemberRows>): Buffer {
  const lines = [
    EXPORT_HEADERS.join(";"),
    ...rows.map((r) =>
      EXPORT_HEADERS.map((h) => {
        const val = String((r as any)[h] ?? "");
        return val.includes(";") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(";")
    ),
  ];
  // UTF-8 BOM for Excel Windows compatibility
  return Buffer.concat([Buffer.from("\uFEFF", "utf8"), Buffer.from(lines.join("\n"), "utf8")]);
}
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
pnpm test -- --testPathPattern="abc-member-export" --no-coverage
```

Expected: PASS

### Task 8: Export API route

**Files:**
- Create: `app/api/admin/abc/members/export/route.ts`

- [ ] **Step 6: Create the export route**

Create `app/api/admin/abc/members/export/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMemberRows, membersToWorkbook, membersToCSV } from "@/lib/abc/member-export";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const role = (session?.user as any)?.role;
  if (!session?.user || !["admin", "moderator"].includes(role)) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  const members = await prisma.abcMember.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true,
          profile: { select: { firstname: true, lastname: true, phone: true } },
        },
      },
      payments: {
        select: { year: true, amount: true, status: true, createdAt: true },
        orderBy: [{ year: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
      places: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: {
          place: {
            select: { name: true, streetNumber: true, street: true, postalCode: true, city: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const rows = buildMemberRows(members);
  const dateStr = new Date().toISOString().split("T")[0];

  if (format === "xlsx") {
    const wb = membersToWorkbook(rows);
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="membres-abc-${dateStr}.xlsx"`,
      },
    });
  }

  const csv = membersToCSV(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="membres-abc-${dateStr}.csv"`,
    },
  });
}
```

- [ ] **Step 7: Add export buttons to the members page**

In `app/(dashboard)/dashboard/admin/abc/members/page.tsx`, find the action buttons area (near "Nouveau membre") and add an export dropdown:

```tsx
import { Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// In the JSX:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Exporter
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem
      onClick={() => window.open("/api/admin/abc/members/export?format=csv")}
    >
      CSV (.csv)
    </DropdownMenuItem>
    <DropdownMenuItem
      onClick={() => window.open("/api/admin/abc/members/export?format=xlsx")}
    >
      Excel (.xlsx)
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

- [ ] **Step 8: Run type-check**

```bash
pnpm type-check
```

Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add app/api/admin/abc/members/export/ lib/abc/member-export.ts __tests__/api/abc-member-export.test.ts app/(dashboard)/dashboard/admin/abc/members/page.tsx
git commit -m "feat(association): add CSV and XLSX member export"
```

---

## Chunk 5: Import CSV & XLSX

### Task 9: Import parser utility

**Files:**
- Create: `lib/abc/member-import.ts`

- [ ] **Step 1: Write tests for the import parser**

Create `__tests__/api/abc-member-import.test.ts`:

```typescript
import { parseImportRows, validateImportStructure } from "@/lib/abc/member-import";

describe("validateImportStructure", () => {
  it("rejects when action column is missing", () => {
    const result = validateImportStructure([{ email: "a@b.com" }]);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/action/);
  });

  it("rejects when email column is missing", () => {
    const result = validateImportStructure([{ action: "create" }]);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/email/);
  });

  it("accepts valid structure", () => {
    const result = validateImportStructure([{ action: "create", email: "a@b.com" }]);
    expect(result.ok).toBe(true);
  });

  it("accepts empty rows array", () => {
    const result = validateImportStructure([]);
    expect(result.ok).toBe(true);
  });
});

describe("parseImportRows", () => {
  it("returns skip result for action=skip rows", () => {
    const rows = parseImportRows([{ action: "skip", email: "a@b.com" }]);
    expect(rows[0].action).toBe("skip");
  });

  it("normalizes action to lowercase", () => {
    const rows = parseImportRows([{ action: "CREATE", email: "a@b.com" }]);
    expect(rows[0].action).toBe("create");
  });

  it("returns error for unknown action value", () => {
    const rows = parseImportRows([{ action: "delete", email: "a@b.com" }]);
    expect(rows[0].parseError).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test -- --testPathPattern="abc-member-import" --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Create the import utility**

Create `lib/abc/member-import.ts`:

```typescript
export interface ParsedImportRow {
  lineNumber: number;
  action: "create" | "update" | "skip";
  email: string;
  numero?: string;
  type?: string;
  role?: string;
  statut?: string;
  dateAdhesion?: string;
  dateExpiration?: string;
  parseError?: string;
}

export function validateImportStructure(
  rows: Record<string, unknown>[]
): { ok: true } | { ok: false; error: string } {
  if (rows.length === 0) return { ok: true };
  const first = rows[0];
  if (!("action" in first)) return { ok: false, error: "Colonne 'action' manquante" };
  if (!("email" in first)) return { ok: false, error: "Colonne 'email' manquante" };
  return { ok: true };
}

export function parseImportRows(
  rawRows: Record<string, unknown>[]
): ParsedImportRow[] {
  return rawRows.map((row, i) => {
    const lineNumber = i + 2; // 1-indexed, row 1 = headers
    const action = String(row.action ?? "").trim().toLowerCase();
    const email = String(row.email ?? "").trim().toLowerCase();

    if (!["create", "update", "skip"].includes(action)) {
      return {
        lineNumber,
        action: "skip" as const,
        email,
        parseError: `Action invalide: "${action}" (attendu: create, update, skip)`,
      };
    }

    return {
      lineNumber,
      action: action as "create" | "update" | "skip",
      email,
      numero: String(row.numero ?? "").trim() || undefined,
      type: String(row.type ?? "").trim() || undefined,
      role: String(row.role ?? "").trim() || undefined,
      statut: String(row.statut ?? "").trim() || undefined,
      dateAdhesion: String(row.dateAdhesion ?? "").trim() || undefined,
      dateExpiration: String(row.dateExpiration ?? "").trim() || undefined,
    };
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test -- --testPathPattern="abc-member-import" --no-coverage
```

Expected: PASS

### Task 10: Import API route

**Files:**
- Create: `app/api/admin/abc/members/import/route.ts`

- [ ] **Step 5: Create the import route**

Create `app/api/admin/abc/members/import/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateImportStructure, parseImportRows, ParsedImportRow } from "@/lib/abc/member-import";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 5000;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const role = (session?.user as any)?.role;
  if (!session?.user || !["admin"].includes(role)) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
  }

  // Parse file
  const buffer = Buffer.from(await file.arrayBuffer());
  let rawRows: Record<string, unknown>[];
  try {
    const wb = XLSX.read(buffer, { type: "buffer", codepage: 65001 });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  } catch {
    return NextResponse.json({ error: "Impossible de lire le fichier" }, { status: 400 });
  }

  if (rawRows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Trop de lignes (max ${MAX_ROWS})` }, { status: 400 });
  }

  // Structural validation
  const structCheck = validateImportStructure(rawRows);
  if (!structCheck.ok) {
    return NextResponse.json({ error: structCheck.error }, { status: 400 });
  }

  const parsed = parseImportRows(rawRows);
  const report = { created: 0, updated: 0, skipped: 0, errors: [] as { line: number; email: string; message: string }[] };

  for (const row of parsed) {
    if (row.parseError) {
      report.errors.push({ line: row.lineNumber, email: row.email, message: row.parseError });
      continue;
    }

    if (row.action === "skip") {
      report.skipped++;
      continue;
    }

    try {
      const user = await prisma.user.findUnique({ where: { email: row.email } });
      if (!user) {
        report.errors.push({ line: row.lineNumber, email: row.email, message: "Utilisateur introuvable" });
        continue;
      }

      if (row.action === "create") {
        const existing = await prisma.abcMember.findUnique({ where: { userId: user.id } });
        if (existing) {
          report.errors.push({ line: row.lineNumber, email: row.email, message: "Membre déjà existant" });
          continue;
        }
        await prisma.abcMember.create({
          data: {
            userId: user.id,
            type: (row.type as any) ?? "ACTIF",
            role: (row.role as any) ?? "MEMBRE",
            status: (row.statut as any) ?? "ACTIVE",
            memberNumber: row.numero || undefined,
            membershipDate: row.dateAdhesion ? new Date(row.dateAdhesion) : undefined,
            expiresAt: row.dateExpiration ? new Date(row.dateExpiration) : undefined,
          },
        });
        report.created++;
      } else {
        // update
        const member = await prisma.abcMember.findUnique({ where: { userId: user.id } });
        if (!member) {
          report.errors.push({ line: row.lineNumber, email: row.email, message: "Membre introuvable" });
          continue;
        }
        const updateData: Record<string, unknown> = {};
        if (row.numero) updateData.memberNumber = row.numero;
        if (row.type) updateData.memberType = row.type;
        if (row.role) updateData.role = row.role;
        if (row.statut) updateData.status = row.statut;
        if (row.dateAdhesion) updateData.membershipDate = new Date(row.dateAdhesion);
        if (row.dateExpiration) updateData.expiresAt = new Date(row.dateExpiration);
        await prisma.abcMember.update({ where: { id: member.id }, data: updateData });
        report.updated++;
      }
    } catch (err) {
      report.errors.push({ line: row.lineNumber, email: row.email, message: "Erreur lors du traitement" });
    }
  }

  return NextResponse.json({ report });
}
```

### Task 11: Import modal UI

**Files:**
- Create: `components/admin/abc/import-members-dialog.tsx`
- Modify: `app/(dashboard)/dashboard/admin/abc/members/page.tsx`

- [ ] **Step 6: Create the import dialog component**

Create `components/admin/abc/import-members-dialog.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportReport {
  created: number;
  updated: number;
  skipped: number;
  errors: { line: number; email: string; message: string }[];
}

interface ImportMembersDialogProps {
  onSuccess: () => void;
}

export function ImportMembersDialog({ onSuccess }: ImportMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setReport(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/abc/members/import", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur lors de l'import");
      return;
    }

    setReport(data.report);
    if (data.report.created > 0 || data.report.updated > 0) {
      onSuccess();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des membres</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Formats acceptés : CSV ou Excel (.xlsx). Le fichier doit contenir les colonnes{" "}
            <code className="rounded bg-muted px-1">action</code> et{" "}
            <code className="rounded bg-muted px-1">email</code>. Actions disponibles :{" "}
            <code className="rounded bg-muted px-1">create</code>,{" "}
            <code className="rounded bg-muted px-1">update</code>,{" "}
            <code className="rounded bg-muted px-1">skip</code>.
          </p>

          {!report && (
            <Button
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => fileRef.current?.click()}
            >
              {loading ? "Import en cours..." : "Choisir un fichier"}
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleUpload}
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {report && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Créés", value: report.created, color: "text-green-600" },
                  { label: "Mis à jour", value: report.updated, color: "text-blue-600" },
                  { label: "Ignorés", value: report.skipped, color: "text-muted-foreground" },
                  { label: "Erreurs", value: report.errors.length, color: "text-red-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded border p-2">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {report.errors.length > 0 && (
                <div className="max-h-40 overflow-auto rounded border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-1 text-left">Ligne</th>
                        <th className="px-2 py-1 text-left">Email</th>
                        <th className="px-2 py-1 text-left">Erreur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.errors.map((e, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1">{e.line}</td>
                          <td className="px-2 py-1">{e.email}</td>
                          <td className="px-2 py-1 text-red-600">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReport(null);
                    setError(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  Nouvel import
                </Button>
                <Button size="sm" onClick={() => setOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 7: Add ImportMembersDialog to the members page**

In `app/(dashboard)/dashboard/admin/abc/members/page.tsx`, import and add the dialog next to the export button:

```tsx
import { ImportMembersDialog } from "@/components/admin/abc/import-members-dialog";

// In JSX, next to export button:
<ImportMembersDialog onSuccess={fetchMembers} />
```

- [ ] **Step 8: Run all tests**

```bash
pnpm test --no-coverage
```

Expected: all tests pass

- [ ] **Step 9: Run type-check**

```bash
pnpm type-check
```

Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add app/api/admin/abc/members/import/ lib/abc/member-import.ts components/admin/abc/import-members-dialog.tsx app/(dashboard)/dashboard/admin/abc/members/page.tsx __tests__/api/abc-member-import.test.ts
git commit -m "feat(association): add CSV and XLSX member import with action column and report"
```

---

## Final verification

- [ ] **Run full test suite**

```bash
pnpm test --no-coverage
```

Expected: all tests pass

- [ ] **Run type-check**

```bash
pnpm type-check
```

Expected: no errors

- [ ] **Run lint**

```bash
pnpm lint
```

Expected: no errors (fix any if found)

- [ ] **Manual smoke test checklist**
  - [ ] Visit `/dashboard/admin/abc/members` — export CSV button visible, click downloads file
  - [ ] Export XLSX opens correctly in Excel/LibreOffice with bold headers
  - [ ] Import a CSV with `action=create` row for an existing User → member created
  - [ ] Import a CSV with `action=update` row → member fields updated
  - [ ] Import with missing `action` column → blocked with error message
  - [ ] Edit a member → "Commerces" tab visible → add a place link → link appears in table column
  - [ ] Modify role of linked place → role updated
  - [ ] Delete place link → link removed

- [ ] **Final commit if any lint fixes**

```bash
git add -A
git commit -m "fix: lint and type issues from association phase 1"
```
