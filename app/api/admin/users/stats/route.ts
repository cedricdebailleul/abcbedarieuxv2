import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Vérifier l'authentification et les permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user?.role || !["admin", "moderator", "editor"].includes(user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Calculer les statistiques
    const [totalUsers, activeUsers, bannedUsers, newUsersThisMonth] =
      await Promise.all([
        // Total des utilisateurs
        prisma.user.count(),

        // Utilisateurs actifs (non supprimés, non bannis)
        prisma.user.count({
          where: {
            status: "ACTIVE",
          },
        }),

        // Utilisateurs bannis
        prisma.user.count({
          where: {
            OR: [{ status: "BANNED" }, { status: "SUSPENDED" }],
          },
        }),

        // Nouveaux utilisateurs ce mois
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

    const stats = {
      totalUsers,
      activeUsers,
      bannedUsers,
      newUsersThisMonth,
      inactiveUsers: totalUsers - activeUsers - bannedUsers,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
