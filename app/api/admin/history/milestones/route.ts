import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { 
  HistoryMilestoneCreateSchema,
  HistoryMilestone
} from "@/lib/types/history";

// GET - Récupérer toutes les milestones
export async function GET(): Promise<NextResponse<HistoryMilestone[] | { error: string }>> {
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

    const milestones = await prisma.historyMilestone.findMany({
      where: { 
        configId: activeConfig.id,
        isActive: true 
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error("Erreur lors de la récupération des milestones:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle milestone
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
    const validatedData = HistoryMilestoneCreateSchema.parse(body);

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
      const lastMilestone = await prisma.historyMilestone.findFirst({
        where: { configId: activeConfig.id },
        orderBy: { order: 'desc' }
      });
      order = (lastMilestone?.order || 0) + 1;
    }

    const milestone = await prisma.historyMilestone.create({
      data: {
        ...validatedData,
        order,
        configId: activeConfig.id,
      }
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création de la milestone:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Réorganiser les milestones
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
    const { milestones } = z.object({
      milestones: z.array(z.object({
        id: z.string(),
        order: z.number()
      }))
    }).parse(body);

    // Mettre à jour l'ordre de chaque milestone
    const updatePromises = milestones.map(milestone =>
      prisma.historyMilestone.update({
        where: { id: milestone.id },
        data: { order: milestone.order }
      })
    );

    await Promise.all(updatePromises);

    // Récupérer les milestones mises à jour
    const activeConfig = await prisma.historyConfig.findFirst({
      where: { isActive: true }
    });

    if (!activeConfig) {
      return NextResponse.json(
        { error: "Aucune configuration d'histoire trouvée" },
        { status: 404 }
      );
    }

    const updatedMilestones = await prisma.historyMilestone.findMany({
      where: { 
        configId: activeConfig.id,
        isActive: true 
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(updatedMilestones);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la réorganisation des milestones:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}