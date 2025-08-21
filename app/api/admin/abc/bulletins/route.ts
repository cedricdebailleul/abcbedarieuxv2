import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createBulletinSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire"),
  content: z.string().min(1, "Le contenu est obligatoire"),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().datetime().nullable().optional(),
  meetingId: z.string().nullable().optional(),
});

// GET /api/admin/abc/bulletins - Liste des bulletins
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: {
      title?: { contains: string; mode: "insensitive" };
      isPublished?: boolean;
    } = {};

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (status) {
      where.isPublished = status === "PUBLISHED" ? true : false;
    }

    const [bulletins, total] = await Promise.all([
      prisma.abcBulletin.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.abcBulletin.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      bulletins,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des bulletins:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/admin/abc/bulletins - Créer un bulletin
export async function POST(request: Request) {
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

    const body = await request.json();
    const data = createBulletinSchema.parse(body);

    // Vérifier la date si le bulletin est publié
    if (data.isPublished && data.publishedAt) {
      const publishedDate = new Date(data.publishedAt);
      if (publishedDate > new Date()) {
        return NextResponse.json(
          { error: "La date de publication ne peut pas être dans le futur" },
          { status: 400 }
        );
      }
    }

    // Vérifier que le meeting existe si fourni
    if (data.meetingId) {
      const meeting = await prisma.abcMeeting.findUnique({
        where: { id: data.meetingId },
      });
      if (!meeting) {
        return NextResponse.json(
          { error: "Réunion non trouvée" },
          { status: 404 }
        );
      }
    }

    const bulletin = await prisma.abcBulletin.create({
      data: {
        title: data.title,
        content: data.content,
        isPublished: data.isPublished,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        meetingId: data.meetingId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      bulletin,
      message: "Bulletin créé avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création du bulletin:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
