import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
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

    const body = await request.json();
    const { action, ids } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Action et IDs requis" },
        { status: 400 }
      );
    }

    let result;

    try {
      switch (action) {
        case "activate":
          result = await prisma.newsletterSubscriber.updateMany({
            where: { id: { in: ids } },
            data: { isActive: true },
          });
          break;

        case "deactivate":
          result = await prisma.newsletterSubscriber.updateMany({
            where: { id: { in: ids } },
            data: { isActive: false },
          });
          break;

        case "delete":
          // Supprimer d'abord les préférences liées
          await prisma.newsletterPreferences.deleteMany({
            where: { subscriberId: { in: ids } },
          });

          // Puis supprimer les abonnés
          result = await prisma.newsletterSubscriber.deleteMany({
            where: { id: { in: ids } },
          });
          break;

        default:
          return NextResponse.json(
            { error: "Action non supportée" },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        affected: result.count,
        message: `${result.count} abonné(s) ${
          action === "delete"
            ? "supprimé(s)"
            : action === "activate"
            ? "activé(s)"
            : "désactivé(s)"
        }`,
      });
    } catch (prismaError) {
      if (
        prismaError instanceof Error &&
        prismaError.message.includes("newsletterSubscriber")
      ) {
        return NextResponse.json(
          {
            error: "Les tables de newsletter ne sont pas encore créées.",
            migrationRequired: true,
          },
          { status: 500 }
        );
      }
      throw prismaError;
    }
  } catch (error) {
    console.error("Erreur lors de l'action groupée:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
