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

  const rawMembers = await prisma.abcMemberPlace.findMany({
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

  // Rename the join-table `role` to `placeRole` to distinguish it from `member.role`
  const members = rawMembers.map(({ role: placeRole, ...rest }) => ({ ...rest, placeRole }));

  return NextResponse.json({ members });
}
