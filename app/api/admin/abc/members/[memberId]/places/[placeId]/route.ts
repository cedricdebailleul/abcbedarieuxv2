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
