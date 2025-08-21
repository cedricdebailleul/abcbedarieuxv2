import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, AbcMemberType, AbcMemberStatus } from "@/lib/generated/prisma";

const createMemberSchema = z.object({
  userId: z.string().min(1),
  type: z.enum([
    "ACTIF",
    "ARTISAN",
    "AUTO_ENTREPRENEUR",
    "PARTENAIRE",
    "BIENFAITEUR",
  ]),
  role: z
    .enum(["MEMBRE", "SECRETAIRE", "TRESORIER", "PRESIDENT", "VICE_PRESIDENT"])
    .optional(),
  membershipDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memberNumber: z.string().optional(),
});

// GET /api/admin/abc/members - Liste des membres
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (
      !session?.user ||
      !session.user.role ||
      !["admin", "moderator"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search: string = url.searchParams.get("search") || "";
    const type = url.searchParams.get("type") || "";
    const status = url.searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    const where: Prisma.AbcMemberWhereInput = {};

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (type) {
      if (
        [
          "ACTIF",
          "ARTISAN",
          "AUTO_ENTREPRENEUR",
          "PARTENAIRE",
          "BIENFAITEUR",
        ].includes(type)
      ) {
        where.type = type as AbcMemberType;
      }
    }

    if (status) {
      const validStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED", "EXPIRED"];
      if (validStatuses.includes(status)) {
        where.status = status as AbcMemberStatus;
      }
    }

    const [members, total] = await Promise.all([
      prisma.abcMember.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              year: true,
              quarter: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          _count: {
            select: {
              payments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.abcMember.count({ where }),
    ]);

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/admin/abc/members - Créer un membre
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, type, role, membershipDate, memberNumber } =
      createMemberSchema.parse(body);

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur n'est pas déjà membre
    const existingMember = await prisma.abcMember.findUnique({
      where: { userId },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "L'utilisateur est déjà membre de l'association" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du numéro de membre si fourni
    if (memberNumber) {
      const existingNumber = await prisma.abcMember.findUnique({
        where: { memberNumber },
      });

      if (existingNumber) {
        return NextResponse.json(
          { error: "Ce numéro de membre est déjà utilisé" },
          { status: 400 }
        );
      }
    }

    // Calculer les dates d'adhésion basées sur la date fournie
    const membershipDateParsed = new Date(membershipDate);
    const membershipYear = membershipDateParsed.getFullYear();
    const membershipEndDate = new Date(`${membershipYear}-12-31`);

    const member = await prisma.abcMember.create({
      data: {
        userId,
        type,
        role: role || "MEMBRE",
        memberNumber,
        membershipDate: membershipDateParsed,
        joinedAt: new Date(), // Date de création sur le site
        renewedAt: membershipDateParsed,
        expiresAt: membershipEndDate,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      member,
      message: "Membre créé avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
