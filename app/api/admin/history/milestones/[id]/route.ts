import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { 
  HistoryMilestoneUpdateSchema,
  HistoryMilestone
} from "@/lib/types/history";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Récupérer une milestone par ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<HistoryMilestone | { error: string }>> {
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

    const milestone = await prisma.historyMilestone.findUnique({
      where: { id: params.id }
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Erreur lors de la récupération de la milestone:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une milestone
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
    const validatedData = HistoryMilestoneUpdateSchema.parse(body);

    const milestone = await prisma.historyMilestone.findUnique({
      where: { id: params.id }
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone non trouvée" },
        { status: 404 }
      );
    }

    const updatedMilestone = await prisma.historyMilestone.update({
      where: { id: params.id },
      data: validatedData
    });

    return NextResponse.json(updatedMilestone);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la mise à jour de la milestone:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une milestone (soft delete)
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

    const milestone = await prisma.historyMilestone.findUnique({
      where: { id: params.id }
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone non trouvée" },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.historyMilestone.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: "Milestone supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la milestone:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}