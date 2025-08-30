import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { 
  HistoryConfigCreateSchema, 
  HistoryConfigUpdateSchema,
  HistoryApiResponse 
} from "@/lib/types/history";

// GET - Récupérer la configuration actuelle de l'histoire
export async function GET(): Promise<NextResponse<HistoryApiResponse | { error: string }>> {
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

    // Récupérer la configuration active (il ne devrait y en avoir qu'une seule)
    const config = await prisma.historyConfig.findFirst({
      where: { isActive: true },
      include: {
        milestones: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        timelineEvents: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const milestones = config?.milestones || [];
    const timelineEvents = config?.timelineEvents || [];

    const response: HistoryApiResponse = {
      config: config || null,
      milestones,
      timelineEvents
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'histoire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour la configuration de l'histoire
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = HistoryConfigCreateSchema.parse(body);

    // Désactiver l'ancienne configuration s'il y en a une
    await prisma.historyConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Créer la nouvelle configuration
    const config = await prisma.historyConfig.create({
      data: {
        ...validatedData,
        updatedBy: session.user.id,
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        },
        timelineEvents: {
          orderBy: { order: 'asc' }
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création de l'histoire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour la configuration existante
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = HistoryConfigUpdateSchema.parse(body);

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

    // Mettre à jour la configuration
    const updatedConfig = await prisma.historyConfig.update({
      where: { id: activeConfig.id },
      data: {
        ...validatedData,
        updatedBy: session.user.id,
      },
      include: {
        milestones: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        timelineEvents: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la mise à jour de l'histoire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}