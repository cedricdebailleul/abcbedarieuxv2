import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { newsletterQueue } from "@/lib/newsletter-queue";

export async function POST() {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    if (
      !safeUserCast(session.user).role ||
      !["admin", "moderator"].includes(safeUserCast(session.user).role)
    ) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Corriger les campagnes bloquées
    await newsletterQueue.fixStuckCampaigns();

    return NextResponse.json({
      success: true,
      message: "Campagnes bloquées corrigées avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la correction des campagnes:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
