import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { 
  HistoryTimelineEventCreateSchema,
  HistoryTimelineEvent
} from "@/lib/types/history";

// GET - Récupérer tous les événements de timeline
export async function GET(): Promise<NextResponse<HistoryTimelineEvent[] | { error: string }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (
      !session?.user ||
      (session.user.role !== "admin" && session.user.role !== "moderator")
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer la configuration active
    const activeConfig = await prisma.historyConfig.findFirst({
      where: { isActive: true }
    });

    if (!activeConfig) {
      return NextResponse.json([]);
    }

    const timelineEvents = await prisma.historyTimelineEvent.findMany({
      where: { 
        configId: activeConfig.id,
        isActive: true 
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(timelineEvents);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements de timeline:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel événement de timeline
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = HistoryTimelineEventCreateSchema.parse(body);

    // Récupérer la configuration active
    const activeConfig = await prisma.historyConfig.findFirst({
      where: { isActive: true }
    });

    if (!activeConfig) {
      return NextResponse.json(
        { error: "Aucune configuration d'histoire trouvée" },
        { status: 404 }
      );
    }

    // Si l'ordre n'est pas spécifié, prendre le suivant
    let order = validatedData.order;
    if (order === undefined) {
      const lastEvent = await prisma.historyTimelineEvent.findFirst({
        where: { configId: activeConfig.id },
        orderBy: { order: 'desc' }
      });
      order = (lastEvent?.order || 0) + 1;
    }

    const timelineEvent = await prisma.historyTimelineEvent.create({
      data: {
        ...validatedData,
        order,
        configId: activeConfig.id,
      }
    });

    return NextResponse.json(timelineEvent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création de l'événement de timeline:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Réorganiser les événements de timeline
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { events } = z.object({
      events: z.array(z.object({
        id: z.string(),
        order: z.number()
      }))
    }).parse(body);

    // Mettre à jour l'ordre de chaque événement
    const updatePromises = events.map(event =>
      prisma.historyTimelineEvent.update({
        where: { id: event.id },
        data: { order: event.order }
      })
    );

    await Promise.all(updatePromises);

    // Récupérer les événements mis à jour
    const activeConfig = await prisma.historyConfig.findFirst({
      where: { isActive: true }
    });

    if (!activeConfig) {
      return NextResponse.json(
        { error: "Aucune configuration d'histoire trouvée" },
        { status: 404 }
      );
    }

    const updatedEvents = await prisma.historyTimelineEvent.findMany({
      where: { 
        configId: activeConfig.id,
        isActive: true 
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(updatedEvents);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la réorganisation des événements:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}