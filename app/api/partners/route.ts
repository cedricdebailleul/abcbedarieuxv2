import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PartnerFilters,
  PartnerListResponse,
  isValidPartnerType,
} from "@/lib/types/partners";
import { Prisma } from "@/lib/generated/prisma";

export async function GET(
  request: NextRequest
): Promise<NextResponse<PartnerListResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);

    // Récupération et validation des paramètres
    const filters: PartnerFilters = {
      type: searchParams.get("type") || "all",
      featured: searchParams.get("featured") || undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      search: searchParams.get("search") || "",
    };
    // Construction des filtres de base de données pour les partenaires actifs
    const where: Prisma.PartnerWhereInput = {
      isActive: true,
      // Filtrer par dates si nécessaire
      OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
      AND: [
        {
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      ],
    };

    if (
      filters.type &&
      filters.type !== "all" &&
      isValidPartnerType(filters.type)
    ) {
      where.partnerType = filters.type;
    }

    if (filters.featured === "true") {
      where.isFeatured = true;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { category: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Récupération des partenaires actifs
    const partners = await prisma.partner.findMany({
      where: where,
      orderBy: [
        { isFeatured: "desc" }, // Les mis en avant en premier
        { priority: "desc" }, // Puis par priorité
        { name: "asc" }, // Puis par nom alphabétique
      ],
      take: filters.limit,
    });

    // Statistiques pour la page
    const [stats, totalPartners, featuredPartners] = await Promise.all([
      prisma.partner.groupBy({
        by: ["partnerType"],
        _count: { id: true },
        where: { isActive: true },
      }),
      prisma.partner.count({
        where: { isActive: true },
      }),
      prisma.partner.count({
        where: { isActive: true, isFeatured: true },
      }),
    ]);

    const response = {
      partners,
      stats: {
        total: totalPartners,
        featured: featuredPartners,
        byType: stats.reduce(
          (acc, stat) => {
            acc[stat.partnerType] = stat._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la récupération des partenaires:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
