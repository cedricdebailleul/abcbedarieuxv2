import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer une action par slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const action = await prisma.action.findUnique({
      where: { 
        slug: slug,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!action) {
      return NextResponse.json({ error: "Action non trouvée" }, { status: 404 });
    }

    // Vérifier que l'action est publiée et active
    if (action.status !== "PUBLISHED" || !action.isActive) {
      return NextResponse.json({ error: "Action non disponible" }, { status: 404 });
    }

    return NextResponse.json(action);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'action:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}