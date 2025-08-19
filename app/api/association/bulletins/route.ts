import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/association/bulletins - Récupérer les bulletins publiés
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Vérifier que l'utilisateur est connecté
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication requise" },
        { status: 401 }
      );
    }

    // Récupérer les bulletins publiés (visible pour tous les utilisateurs connectés)
    const bulletins = await prisma.abcBulletin.findMany({
      where: {
        isPublished: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        meeting: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 10, // Limiter aux 10 derniers bulletins
    });

    return NextResponse.json(bulletins);

  } catch (error) {
    console.error("Erreur lors de la récupération des bulletins:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}