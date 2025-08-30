import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  PartnerCreateSchema,
  PartnerFilters,
  PartnerWhereCondition,
  PartnerListResponse,
  isValidPartnerType,
  preparePartnerForDatabase,
} from "@/lib/types/partners";
import { Prisma } from "@/lib/generated/prisma";

// GET - Récupérer tous les partenaires avec filtres et pagination
export async function GET(
  request: NextRequest
): Promise<NextResponse<PartnerListResponse | { error: string }>> {
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

    // Récupération et validation des paramètres
    const url = new URL(request.url);
    const filters: PartnerFilters = {
      type: url.searchParams.get("type") || "all",
      search: url.searchParams.get("search") || "",
      isActive: url.searchParams.get("isActive") || undefined,
      page: parseInt(url.searchParams.get("page") || "1", 10),
      limit: parseInt(url.searchParams.get("limit") || "10", 10),
      sortBy: url.searchParams.get("sortBy") || "createdAt",
      sortOrder:
        (url.searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    // Construction des filtres de base de données
    const where: PartnerWhereCondition = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { category: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (
      filters.type &&
      filters.type !== "all" &&
      isValidPartnerType(filters.type)
    ) {
      where.partnerType = filters.type;
    }

    if (filters.isActive !== undefined && filters.isActive !== "all") {
      where.isActive = filters.isActive === "true";
    }

    // Récupération des partenaires avec pagination
    const [partners, totalCount] = await Promise.all([
      prisma.partner.findMany({
        where: where as Prisma.PartnerWhereInput, // Use a specific Prisma type instead of any
        orderBy: { [filters.sortBy!]: filters.sortOrder as Prisma.SortOrder },
        skip: ((filters.page || 1) - 1) * (filters.limit || 10),
        take: filters.limit || 10,
      }),
      prisma.partner.count({ where: where as Prisma.PartnerWhereInput }),
    ]);

    // Statistiques pour le dashboard
    const stats = await prisma.partner.groupBy({
      by: ["partnerType"],
      _count: { id: true },
      where: { isActive: true },
    });

    const totalPages = Math.ceil(totalCount / (filters.limit || 10));

    const response: PartnerListResponse = {
      partners,
      pagination: {
        currentPage: filters.page || 1,
        totalPages,
        totalCount,
        limit: filters.limit || 10,
      },
      stats: {
        total: totalCount,
        featured: partners.filter((p) => p.isFeatured).length,
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

// POST - Créer un nouveau partenaire
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
    const validatedData = PartnerCreateSchema.parse(body);

    // Vérifier l'unicité du slug
    const existingPartner = await prisma.partner.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingPartner) {
      return NextResponse.json(
        { error: "Un partenaire avec ce slug existe déjà" },
        { status: 400 }
      );
    }

    // Préparer les données pour la création
    const partnerData = {
      ...preparePartnerForDatabase(validatedData),
      createdBy: session.user.id,
    };

    const partner = await prisma.partner.create({
      data: partnerData as Prisma.PartnerCreateInput, // Use specific Prisma type instead of any
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création du partenaire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
