import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

const getInvitationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["pending", "expired", "used"]).optional(),
  sortBy: z.enum(["createdAt", "expiresAt", "identifier"]).default("createdAt"),
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

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user?.role || !["admin", "moderator", "editor"].includes(user.role)) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Parser les paramètres de requête
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const { page, limit, search, status, sortBy, sortOrder } =
      getInvitationsSchema.parse(params);

    // Construire les filtres
    const where: Prisma.VerificationWhereInput = {
      type: "EMAIL",
    };

    if (search) {
      where.identifier = {
        contains: search,
        mode: "insensitive",
      };
    }

    const now = new Date();
    if (status === "pending") {
      where.used = false;
      where.expiresAt = { gt: now };
    } else if (status === "expired") {
      where.used = false;
      where.expiresAt = { lte: now };
    } else if (status === "used") {
      where.used = true;
    }

    // Calculer la pagination
    const offset = (page - 1) * limit;

    // Récupérer les invitations
    const [invitations, totalCount] = await Promise.all([
      prisma.verification.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.verification.count({ where }),
    ]);

    // Enrichir les invitations avec le statut et les informations utilisateur
    const enrichedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        const isExpired = invitation.expiresAt < now;
        const isUsed = invitation.used;

        let invitationStatus: "pending" | "expired" | "used";
        if (isUsed) {
          invitationStatus = "used";
        } else if (isExpired) {
          invitationStatus = "expired";
        } else {
          invitationStatus = "pending";
        }

        // Vérifier si un utilisateur avec cet email existe
        const existingUser = await prisma.user.findUnique({
          where: { email: invitation.identifier },
          select: {
            id: true,
            name: true,
            role: true,
            status: true,
            createdAt: true,
          },
        });

        return {
          id: invitation.id,
          email: invitation.identifier,
          token: invitation.value,
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt,
          used: invitation.used,
          attempts: invitation.attempts,
          status: invitationStatus,
          user: existingUser,
          canResend: invitationStatus === "expired" && !existingUser,
        };
      })
    );

    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Statistiques
    const stats = {
      total: totalCount,
      pending: await prisma.verification.count({
        where: {
          type: "EMAIL",
          used: false,
          expiresAt: { gt: now },
        },
      }),
      expired: await prisma.verification.count({
        where: {
          type: "EMAIL",
          used: false,
          expiresAt: { lte: now },
        },
      }),
      used: await prisma.verification.count({
        where: {
          type: "EMAIL",
          used: true,
        },
      }),
    };

    return NextResponse.json({
      invitations: enrichedInvitations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      stats,
      filters: {
        search,
        status,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des invitations:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
