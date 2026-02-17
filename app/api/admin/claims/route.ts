import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { ClaimStatus, Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// GET /api/admin/claims - Liste des revendications
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

    const offset = (page - 1) * limit;

    const where: Prisma.PlaceClaimWhereInput = {};
    if (status && Object.values(ClaimStatus).includes(status as ClaimStatus)) {
      where.status = status as ClaimStatus;
    }

    const [claims, total, pendingCount] = await Promise.all([
      prisma.placeClaim.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          place: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              ownerId: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: [
          { status: "asc" }, // PENDING en premier
          { createdAt: "desc" },
        ],
      }),
      prisma.placeClaim.count({ where }),
      prisma.placeClaim.count({
        where: { status: ClaimStatus.PENDING },
      }),
    ]);

    return NextResponse.json({
      claims,
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
    console.error("Erreur admin claims:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
