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
