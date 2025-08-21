import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const categoriesParam = searchParams.get("categories");
    const limitParam = searchParams.get("limit");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const searchQuery = query.trim();
    const categories = categoriesParam
      ? categoriesParam.split(",").filter(Boolean)
      : [];
    const limit = parseInt(limitParam || "50");

    const results = [];

    // Search in Places if no categories specified or 'places' is included
    if (categories.length === 0 || categories.includes("places")) {
      const places = await prisma.place.findMany({
        where: {
          name: { contains: searchQuery, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 20,
        orderBy: { updatedAt: "desc" },
      });

      results.push(
        ...places.map((place) => ({
          ...place,
          title: place.name,
          type: "place" as const,
        }))
      );
    }

    // Search in Events if no categories specified or 'events' is included
    if (categories.length === 0 || categories.includes("events")) {
      const events = await prisma.event.findMany({
        where: {
          title: { contains: searchQuery, mode: "insensitive" },
        },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 20,
        orderBy: { updatedAt: "desc" },
      });

      results.push(
        ...events.map((event) => ({
          ...event,
          type: "event" as const,
        }))
      );
    }

    // Search in Actions if no categories specified or 'actions' is included
    if (categories.length === 0 || categories.includes("actions")) {
      const actions = await prisma.action.findMany({
        where: {
          title: { contains: searchQuery, mode: "insensitive" },
        },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 20,
        orderBy: { updatedAt: "desc" },
      });

      results.push(
        ...actions.map((action) => ({
          ...action,
          type: "action" as const,
        }))
      );
    }

    // Search in Posts if no categories specified or 'posts' is included
    if (categories.length === 0 || categories.includes("posts")) {
      const posts = await prisma.post.findMany({
        where: {
          title: { contains: searchQuery, mode: "insensitive" },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 20,
        orderBy: { updatedAt: "desc" },
      });

      results.push(
        ...posts.map((post) => ({
          ...post,
          type: "post" as const,
        }))
      );
    }

    // Sort all results by updatedAt desc
    results.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // Limit results
    const limitedResults = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      results: limitedResults,
      total: limitedResults.length,
      query: searchQuery,
      categories: categories,
    });
  } catch (error) {
    console.error("Search error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
