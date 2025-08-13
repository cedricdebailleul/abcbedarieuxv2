import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const getUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["user", "admin", "moderator", "dpo", "editor"]).optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "SUSPENDED", "BANNED", "PENDING_VERIFICATION", "DELETED"])
    .optional(),
  sortBy: z.enum(["createdAt", "name", "email", "lastLoginAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur a les permissions d'administration
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user?.role || !["admin", "moderator", "editor"].includes(user.role)) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    // Parser les paramètres de requête
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const { page, limit, search, role, status, sortBy, sortOrder } = getUsersSchema.parse(params);

    // Construire les filtres
    const where: any = {
      // Exclure les utilisateurs supprimés par défaut
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { profile: { firstname: { contains: search, mode: "insensitive" } } },
        { profile: { lastname: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    // Calculer la pagination
    const offset = (page - 1) * limit;

    // Récupérer les utilisateurs avec leurs relations
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          profile: true,
          badges: {
            include: {
              badge: true,
            },
          },
          _count: {
            select: {
              sessions: true,
              posts: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        status: user.status,
        slug: user.slug,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        lastLoginIp: user.lastLoginIp,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        profile: user.profile
          ? {
              firstname: user.profile.firstname,
              lastname: user.profile.lastname,
              bio: user.profile.bio,
              phone: user.profile.phone,
              isPublic: user.profile.isPublic,
            }
          : null,
        badgeCount: user.badges.length,
        sessionCount: user._count.sessions,
        postCount: user._count.posts,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        search,
        role,
        status,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
