import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/association/members - Récupérer la liste des membres actifs
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

    // Récupérer tous les membres actifs (informations publiques uniquement)
    const members = await prisma.abcMember.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { membershipDate: "desc" },
        { user: { name: "asc" } }
      ],
    });

    return NextResponse.json(members);

  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}