import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ActionStatus } from "@/lib/generated/prisma";

// GET - Lister les actions publiques
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") ?? "10");

    const where: {
      status: ActionStatus;
      isActive: boolean;
      isFeatured?: boolean;
    } = {
      status: ActionStatus.PUBLISHED,
      isActive: true,
    };

    if (featured === "true") {
      where.isFeatured = true;
    }

    const actions = await prisma.action.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        summary: true,
        coverImage: true,
        isFeatured: true,
        startDate: true,
        endDate: true,
        sortOrder: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Erreur lors de la récupération des actions:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
