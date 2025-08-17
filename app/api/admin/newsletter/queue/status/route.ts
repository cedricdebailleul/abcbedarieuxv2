import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { newsletterQueue } from "@/lib/newsletter-queue";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    if (!session.user.role || !["admin", "moderator", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    // Récupérer le statut de la file d'attente
    const queueStatus = await newsletterQueue.getQueueStatus();

    return NextResponse.json({
      success: true,
      status: queueStatus,
      isProcessing: false, // TODO: Implémenter le suivi du statut de traitement
      batchSize: 10,
      processingDelay: "1 seconde entre emails",
      batchDelay: "5 secondes entre batches"
    });

  } catch (error) {
    console.error("Erreur lors de la récupération du statut de la queue:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}