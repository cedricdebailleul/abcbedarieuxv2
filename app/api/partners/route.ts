import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PartnerFilters,
  PartnerListResponse,
  isValidPartnerType,
} from "@/lib/types/partners";
import { Prisma } from "@/lib/generated/prisma/client";

export async function GET(
  request: NextRequest
): Promise<NextResponse<PartnerListResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);

    const filters: PartnerFilters = {
      type: searchParams.get("type") || "all",
      featured: searchParams.get("featured") || undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      search: searchParams.get("search") || "",
    };

    // Filtres de base (dates valides)
    const dateFilter = {
      OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
      AND: [
        {
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      ],
    };

    // Filtre pour les partenaires ACTIFS (affichage)
    const whereActive: Prisma.PartnerWhereInput = {
      isActive: true,
      ...dateFilter,
    };

    // Filtre pour TOUS les partenaires (stats)
    const whereAll: Prisma.PartnerWhereInput = {
      ...dateFilter,
    };

    // Appliquer filtres supplémentaires
    if (
      filters.type &&
      filters.type !== "all" &&
      isValidPartnerType(filters.type)
    ) {
      whereActive.partnerType = filters.type;
      whereAll.partnerType = filters.type;
    }

    if (filters.featured === "true") {
      whereActive.isFeatured = true;
      whereAll.isFeatured = true;
    }

if (filters.search) {
      const searchCondition: Prisma.PartnerWhereInput[] = [
        { name: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
        { category: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
      ];
      whereActive.OR = searchCondition;
      whereAll.OR = searchCondition;
    }

    // Récupérer les partenaires ACTIFS pour affichage
    const partners = await prisma.partner.findMany({
      where: whereActive,
      orderBy: [
        { isFeatured: "desc" },
        { priority: "desc" },
        { name: "asc" },
      ],
      take: filters.limit,
    });

    // Statistiques
    const [stats, totalPartners, activePartners, featuredPartners] = await Promise.all([
      prisma.partner.groupBy({
        by: ["partnerType"],
        _count: { id: true },
        where: whereAll,  // TOUS pour les stats globales
      }),
      prisma.partner.count({
        where: whereAll,  // TOUS
      }),
      prisma.partner.count({
        where: whereActive,  // Actifs seulement
      }),
      prisma.partner.count({
        where: { ...whereActive, isFeatured: true },
      }),
    ]);

    const response: PartnerListResponse = {
      partners,
      stats: {
        total: totalPartners,        // TOUS (y compris inactifs)
        active: activePartners,      // Actifs seulement
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