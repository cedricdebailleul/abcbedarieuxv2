import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    // 1. Vérification Admin
    if (!session || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ids, isFeatured } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Aucun ID fourni" },
        { status: 400 }
      );
    }

    if (typeof isFeatured !== "boolean") {
      return NextResponse.json(
        { error: "Le paramètre isFeatured doit être un booléen" },
        { status: 400 }
      );
    }

    console.log(`⭐ Bulk feature request for ${ids.length} places (isFeatured: ${isFeatured})...`);

    // 2. Mettre à jour toutes les places en une seule requête
    const result = await prisma.place.updateMany({
      where: { id: { in: ids } },
      data: { isFeatured }
    });

    const action = isFeatured ? "mise(s) en vedette" : "retirée(s) de la vedette";

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} place(s) ${action}`
    });

  } catch (error) {
    console.error("Bulk feature error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
