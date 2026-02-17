import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: {
        status: { not: "ARCHIVED" },
        place: {
          OR: [
            { ownerId: session.user.id },
            ...(["admin", "moderator"].includes(safeUserCast(session.user).role || "")
              ? [{}]
              : []),
          ],
        },
      },
      include: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            type: true,
          },
        },
        _count: {
          select: {
            offers: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({
      products,
      total: products.length,
      userRole: safeUserCast(session.user).role,
    });
  } catch (error) {
    console.error("Erreur récupération produits utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
