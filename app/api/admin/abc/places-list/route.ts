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
