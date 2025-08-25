import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Récupérer le partenaire par son slug
    const partner = await prisma.partner.findFirst({
      where: {
        slug: params.slug,
        isActive: true,
        // Vérifier les dates de validité
        OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
        AND: [
          {
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        website: true,
        email: true,
        phone: true,
        partnerType: true,
        category: true,
        priority: true,
        isFeatured: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });

    if (!partner) {
      return NextResponse.json(
        { error: "Partenaire non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les partenaires similaires (même type, excluant le partenaire actuel)
    const similarPartners = await prisma.partner.findMany({
      where: {
        id: { not: partner.id },
        partnerType: partner.partnerType,
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
        AND: [
          {
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
          },
        ],
      },
      orderBy: [{ isFeatured: "desc" }, { priority: "desc" }, { name: "asc" }],
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        website: true,
        partnerType: true,
        category: true,
        isFeatured: true,
      },
    });

    return NextResponse.json({
      partner,
      similarPartners,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du partenaire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
