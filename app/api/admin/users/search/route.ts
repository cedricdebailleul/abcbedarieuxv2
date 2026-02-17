import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (
      !session?.user ||
      !safeUserCast(session.user).role ||
      !["admin", "moderator"].includes(safeUserCast(session.user).role)
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    const includeMembers = url.searchParams.get("includeMembers") === "true";
    const onlyNonMembers = url.searchParams.get("onlyNonMembers") === "true";

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Construire les conditions de filtre

    const whereConditions: Prisma.UserFindManyArgs["where"] = {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    };

    // Filtrer selon les paramètres
    if (onlyNonMembers) {
      whereConditions.abcMember = null;
    }

    const users = await prisma.user.findMany({
      where: whereConditions,
      include: {
        abcMember: includeMembers
          ? {
              select: {
                id: true,
                memberNumber: true,
                type: true,
                status: true,
                membershipDate: true,
              },
            }
          : false,
      },
      take: 20,
      orderBy: { name: "asc" },
    });

    // Formater les résultats
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      ...(includeMembers && {
        abcMember: user.abcMember,
        isAbcMember: !!user.abcMember,
      }),
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("Erreur lors de la recherche d'utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
