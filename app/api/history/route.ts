import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HistoryApiResponse } from "@/lib/types/history";

// GET - Récupérer la configuration publique de l'histoire
export async function GET(): Promise<NextResponse<HistoryApiResponse | { error: string }>> {
  try {
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
    console.error("Erreur lors de la récupération de l'histoire publique:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}