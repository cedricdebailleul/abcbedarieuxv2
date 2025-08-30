import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les lieux de l'utilisateur
    const places = await prisma.place.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          // Si l'utilisateur est admin/moderator, il peut voir tous les lieux
          ...(["admin", "moderator"].includes(safeUserCast(session.user).role || "")
            ? [{}]
            : []),
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        type: true,
        status: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({
      places,
      total: places.length,
      userRole: safeUserCast(session.user).role,
    });
  } catch (error) {
    console.error("Erreur récupération lieux utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
