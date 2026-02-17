"use server";

import { prisma } from "@/lib/prisma";
import { EventStatus } from "@/lib/generated/prisma/client";

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

interface EventData {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  isFree: boolean;
  price?: number | null;
  currency?: string | null;
  coverImage?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  locationCity?: string | null;
  organizer: { id: string; name: string; slug: string | null };
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
  } | null;
  _count: { participants: number };
}

export async function getPlaceEventsAction(
  placeId: string,
  limit: number = 6
): Promise<ActionResult<EventData[]>> {
  try {
    const events = await prisma.event.findMany({
      where: {
        placeId: placeId,
        status: EventStatus.PUBLISHED,
        isActive: true,
        organizerId: {
          not: null,
        },
        endDate: {
          gte: new Date(), // Only future or ongoing events
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
      take: limit,
    });

    // Load categories separately to avoid Prisma type issues
    const categoryIds = Array.from(
      new Set(
        events
          .map((e) => (e as unknown as { categoryId?: string }).categoryId)
          .filter((id): id is string => typeof id === "string")
      )
    );

    const categories =
      categoryIds.length > 0
        ? await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, slug: true, color: true },
          })
        : [];

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const eventsData: EventData[] = events.map((event) => {
      const originalCategoryId = (event as unknown as { categoryId?: string })
        .categoryId;
      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        summary: event.summary,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        isAllDay: event.isAllDay ?? false,
        isFree: event.isFree ?? true,
        price: event.price,
        currency: event.currency,
        coverImage: event.coverImage,
        locationName: event.locationName,
        locationAddress: event.locationAddress,
        locationCity: event.locationCity,
        organizer: {
          id: event.organizer!.id,
          name: event.organizer!.name,
          slug: event.organizer!.slug,
        },
        category: originalCategoryId
          ? (categoryMap.get(originalCategoryId) ?? null)
          : null,
        _count: {
          participants: event._count.participants,
        },
      };
    });

    return {
      success: true,
      data: eventsData,
    };
  } catch (error) {
    console.error("Error fetching place events:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des événements",
    };
  }
}
