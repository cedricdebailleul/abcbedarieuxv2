import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { 
  HistoryTimelineEventUpdateSchema,
  HistoryTimelineEvent
} from "@/lib/types/history";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Récupérer un événement de timeline par ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<HistoryTimelineEvent | { error: string }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (
      !session?.user ||
      (safeUserCast(session.user).role !== "admin" && safeUserCast(session.user).role !== "moderator")
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const timelineEvent = await prisma.historyTimelineEvent.findUnique({
      where: { id: params.id }
    });

    if (!timelineEvent) {
      return NextResponse.json(
        { error: "Événement de timeline non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(timelineEvent);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement de timeline:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un événement de timeline
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = HistoryTimelineEventUpdateSchema.parse(body);

    const timelineEvent = await prisma.historyTimelineEvent.findUnique({
      where: { id: params.id }
    });

    if (!timelineEvent) {
      return NextResponse.json(
        { error: "Événement de timeline non trouvé" },
        { status: 404 }
      );
    }

    const updatedEvent = await prisma.historyTimelineEvent.update({
      where: { id: params.id },
      data: validatedData
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la mise à jour de l'événement de timeline:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un événement de timeline (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const timelineEvent = await prisma.historyTimelineEvent.findUnique({
      where: { id: params.id }
    });

    if (!timelineEvent) {
      return NextResponse.json(
        { error: "Événement de timeline non trouvé" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.historyTimelineEvent.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: "Événement de timeline supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement de timeline:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}