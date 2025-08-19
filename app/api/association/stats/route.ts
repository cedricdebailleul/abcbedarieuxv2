import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/association/stats - Récupérer les statistiques de l'association
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

    // Calculer les statistiques en parallèle
    const [
      totalMembers,
      activeMembers,
      recentBulletins,
      totalDocuments
    ] = await Promise.all([
      // Nombre total de membres
      prisma.abcMember.count(),
      
      // Nombre de membres actifs
      prisma.abcMember.count({
        where: {
          status: "ACTIVE"
        }
      }),
      
      // Nombre de bulletins publiés dans les 30 derniers jours
      prisma.abcBulletin.count({
        where: {
          isPublished: true,
          publishedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
          }
        }
      }),
      
      // Nombre total de documents
      prisma.abcDocument.count()
    ]);

    const stats = {
      totalMembers,
      activeMembers,
      recentBulletins,
      publicDocuments: totalDocuments
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Erreur lors du calcul des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}