"use server";

import { prisma } from "@/lib/prisma";

export async function getFeaturedPartners() {
  try {
    const partners = await prisma.partner.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      orderBy: {
        priority: "asc",
      },
      take: 6,
    });

    return partners;
  } catch (error) {
    console.error("Error fetching featured partners:", error);
    return [];
  }
}

export async function getPartnersStats() {
  try {
    const [total, active, featured, byType] = await Promise.all([
      prisma.partner.count(),
      prisma.partner.count({ where: { isActive: true } }),
      prisma.partner.count({ where: { isFeatured: true, isActive: true } }),
      prisma.partner.groupBy({
        by: ["partnerType"],
        _count: { id: true },
        where: { isActive: true },
      }),
    ]);

    const institutional = byType.find((t) => t.partnerType === "INSTITUTIONAL")?._count.id || 0;
    const commercial = byType.find((t) => t.partnerType === "COMMERCIAL")?._count.id || 0;

    return {
      total,
      active,
      featured,
      institutional,
      commercial,
    };
  } catch (error) {
    console.error("Error fetching partners stats:", error);
    return {
      total: 0,
      active: 0,
      featured: 0,
      institutional: 0,
      commercial: 0,
    };
  }
}
