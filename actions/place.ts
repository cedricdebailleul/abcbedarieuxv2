"use server";

import { prisma } from "@/lib/prisma";
import { PlaceStatus } from "@/lib/generated/prisma";

export async function getFeaturedPlacesAction(limit: number = 6) {
  try {
    const places = await prisma.place.findMany({
      where: {
        status: PlaceStatus.ACTIVE,
        isFeatured: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        summary: true,
        street: true,
        streetNumber: true,
        postalCode: true,
        city: true,
        latitude: true,
        longitude: true,
        phone: true,
        email: true,
        website: true,
        facebook: true,
        instagram: true,
        twitter: true,
        linkedin: true,
        tiktok: true,
        coverImage: true,
        logo: true,
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                color: true,
              },
            },
          },
        },
        reviews: {
          select: { rating: true },
          where: { status: "APPROVED" },
        },
        googleReviews: {
          select: { rating: true },
          where: { status: "APPROVED" },
        },
        _count: {
          select: {
            reviews: true,
            googleReviews: { where: { status: "APPROVED" } },
          },
        },
      },
      orderBy: [{ name: "asc" }],
      take: limit,
    });

    return { success: true, data: places };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des places en vedette:",
      error
    );
    return {
      success: false,
      error: "Erreur lors de la récupération des places",
    };
  }
}

export async function getPlaceByIdAction(placeId: string) {
  try {
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                color: true,
              },
            },
          },
        },
        reviews: {
          select: { rating: true },
          where: { status: "APPROVED" },
        },
        googleReviews: {
          select: { rating: true },
          where: { status: "APPROVED" },
        },
        _count: {
          select: {
            reviews: true,
            googleReviews: { where: { status: "APPROVED" } },
          },
        },
      },
    });

    if (!place) {
      return { success: false, error: "Lieu non trouvé" };
    }

    return { success: true, data: place };
  } catch (error) {
    console.error("Erreur lors de la récupération du lieu:", error);
    return { success: false, error: "Erreur lors de la récupération du lieu" };
  }
}
