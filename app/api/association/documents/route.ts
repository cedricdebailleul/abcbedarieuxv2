import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/association/documents - Récupérer les documents publics
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

    // Récupérer tous les documents (les membres peuvent voir tous les documents)
    const documents = await prisma.abcDocument.findMany({
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Limiter aux 20 derniers documents
    });

    return NextResponse.json(documents);

  } catch (error) {
    console.error("Erreur lors de la récupération des documents:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}