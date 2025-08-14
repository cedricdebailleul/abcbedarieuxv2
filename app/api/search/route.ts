import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerms = query.toLowerCase().trim();

    // Rechercher dans les places
    const places = await prisma.place.findMany({
      where: {
        AND: [
          { status: "ACTIVE" },
          {
            OR: [
              { name: { contains: searchTerms, mode: "insensitive" } },
              { description: { contains: searchTerms, mode: "insensitive" } },
              { street: { contains: searchTerms, mode: "insensitive" } },
              { city: { contains: searchTerms, mode: "insensitive" } },
            ],
          },
        ],
      },
      take: Math.floor(limit * 0.6), // 60% pour les places
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        street: true,
        city: true,
        type: true,
      },
    });

    // Rechercher dans les événements
    const events = await prisma.event.findMany({
      where: {
        AND: [
          { status: "PUBLISHED" },
          { startDate: { gte: new Date() } }, // Événements futurs seulement
          {
            OR: [
              { title: { contains: searchTerms, mode: "insensitive" } },
              { description: { contains: searchTerms, mode: "insensitive" } },
              { summary: { contains: searchTerms, mode: "insensitive" } },
              { locationName: { contains: searchTerms, mode: "insensitive" } },
              { locationAddress: { contains: searchTerms, mode: "insensitive" } },
              { locationCity: { contains: searchTerms, mode: "insensitive" } },
            ],
          },
        ],
      },
      take: Math.floor(limit * 0.3), // 30% pour les événements
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        startDate: true,
        locationName: true,
        locationAddress: true,
        locationCity: true,
        category: true,
      },
    });

    // Rechercher dans les catégories
    const categories = await prisma.placeCategory.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: searchTerms, mode: "insensitive" } },
              { description: { contains: searchTerms, mode: "insensitive" } },
            ],
          },
        ],
      },
      take: Math.floor(limit * 0.1), // 10% pour les catégories
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        placeCount: true,
      },
    });

    // Formater les résultats
    const results = [
      // Places
      ...places.map((place) => ({
        id: place.id,
        name: place.name,
        description: place.description?.substring(0, 150) + (place.description && place.description.length > 150 ? "..." : ""),
        type: "place" as const,
        slug: place.slug,
        location: `${place.street}, ${place.city}`,
      })),
      // Événements
      ...events.map((event) => ({
        id: event.id,
        name: event.title,
        description: event.description?.substring(0, 150) + (event.description && event.description.length > 150 ? "..." : ""),
        type: "event" as const,
        slug: event.slug,
        location: event.locationName || 
                  (event.locationAddress && event.locationCity ? `${event.locationAddress}, ${event.locationCity}` : 
                   event.locationCity || undefined),
        date: event.startDate.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        category: event.category,
      })),
      // Catégories
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description?.substring(0, 150) + (category.description && category.description.length > 150 ? "..." : ""),
        type: "category" as const,
        slug: category.slug,
        location: `${category.placeCount} établissement${category.placeCount > 1 ? "s" : ""}`,
      })),
    ];

    return NextResponse.json({ 
      results: results.slice(0, limit),
      total: results.length 
    });

  } catch (error) {
    console.error("Erreur API search:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}