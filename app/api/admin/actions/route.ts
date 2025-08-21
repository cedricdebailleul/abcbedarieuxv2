import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ActionStatus, Prisma } from "@/lib/generated/prisma";

const createActionSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  content: z.string().optional(),
  summary: z
    .string()
    .max(280, "Le résumé ne peut pas dépasser 280 caractères")
    .optional(),
  coverImage: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  status: z
    .enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"])
    .default("DRAFT"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  startDate: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  endDate: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  sortOrder: z.number().default(0),
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// GET - Lister toutes les actions
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (
      !session?.user ||
      (session.user.role !== "admin" && session.user.role !== "moderator")
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") as
      | "DRAFT"
      | "PUBLISHED"
      | "SCHEDULED"
      | "ARCHIVED"
      | null;
    const featured = searchParams.get("featured");

    const where: Prisma.ActionWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status as ActionStatus;
    }

    if (featured !== null) {
      where.isFeatured = featured === "true";
    }

    const [actions, total] = await Promise.all([
      prisma.action.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.action.count({ where }),
    ]);

    return NextResponse.json({
      actions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des actions:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle action
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (
      !session?.user ||
      (session.user.role !== "admin" && session.user.role !== "moderator")
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createActionSchema.parse(body);

    const slug = generateSlug(validatedData.title);

    // Vérifier l'unicité du slug
    let counter = 1;
    let finalSlug = slug;
    while (await prisma.action.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const actionData: {
      title: string;
      description?: string;
      content?: string;
      summary?: string;
      coverImage?: string;
      gallery: string[];
      status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
      isActive: boolean;
      isFeatured: boolean;
      startDate?: Date;
      endDate?: Date;
      metaTitle?: string;
      metaDescription?: string;
      sortOrder: number;
      slug: string;
      createdById: string;
      publishedAt?: Date;
    } = {
      ...validatedData,
      slug: finalSlug,
      createdById: session.user.id,
      gallery: validatedData.gallery || [],
      startDate: validatedData.startDate
        ? new Date(validatedData.startDate)
        : undefined,
      endDate: validatedData.endDate
        ? new Date(validatedData.endDate)
        : undefined,
    };

    // Définir publishedAt si le statut est PUBLISHED
    if (validatedData.status === "PUBLISHED") {
      actionData.publishedAt = new Date();
    }

    const action = await prisma.action.create({
      data: actionData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'action:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
