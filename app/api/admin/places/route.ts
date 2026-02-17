import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { PlaceStatus, Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// GET /api/admin/places - Liste des places pour admin
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    // Construction de la requête
    const where: Prisma.PlaceWhereInput = {};

    if (status && Object.values(PlaceStatus).includes(status as PlaceStatus)) {
      where.status = status as PlaceStatus;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { owner: { name: { contains: search, mode: "insensitive" } } },
        { owner: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [places, total, pendingCount] = await Promise.all([
      prisma.place.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
              claims: true,
            },
          },
        },
        orderBy: [
          { status: "asc" }, // PENDING en premier
          { updatedAt: "desc" },
        ],
      }),
      prisma.place.count({ where }),
      prisma.place.count({
        where: { status: PlaceStatus.PENDING },
      }),
    ]);

    return NextResponse.json({
      places,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        pendingCount,
      },
    });
  } catch (error) {
    console.error("Erreur admin places:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
