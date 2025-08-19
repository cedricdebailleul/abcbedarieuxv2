import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createMeetingSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire"),
  description: z.string().nullable().optional(),
  type: z.enum(['GENERAL', 'BUREAU', 'EXTRAORDINAIRE', 'COMMISSION']),
  scheduledAt: z.string().datetime(),
  duration: z.number().positive().nullable().optional(),
  location: z.string().nullable().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
});

// GET /api/admin/abc/meetings - Liste des réunions
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session.user.role || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [meetings, total] = await Promise.all([
      prisma.abcMeeting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          _count: {
            select: {
              attendees: true,
            },
          },
        },
      }),
      prisma.abcMeeting.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      meetings,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des réunions:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/admin/abc/meetings - Créer une réunion
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session.user.role || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createMeetingSchema.parse(body);

    // Vérifier que la date est dans le futur
    const scheduledDate = new Date(data.scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "La date de la réunion doit être dans le futur" },
        { status: 400 }
      );
    }

    const meeting = await prisma.abcMeeting.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type,
        scheduledAt: scheduledDate,
        duration: data.duration || null,
        location: data.location || null,
        status: data.status,
        createdById: session.user.id,
      },
      include: {
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    return NextResponse.json({
      meeting,
      message: "Réunion créée avec succès",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création de la réunion:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}