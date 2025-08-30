import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateActionSchema = z.object({
  title: z.string().min(1, "Le titre est requis").optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  summary: z
    .string()
    .max(280, "Le résumé ne peut pas dépasser 280 caractères")
    .optional(),
  coverImage: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  startDate: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  endDate: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  sortOrder: z.number().optional(),
  slug: z.string().optional(),
  publishedAt: z.string().optional(),
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

// GET - Récupérer une action par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (
      !session?.user ||
      (safeUserCast(session.user).role !== "admin" && safeUserCast(session.user).role !== "moderator")
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const action = await prisma.action.findUnique({
      where: { id: id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Action non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(action);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'action:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une action
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (
      !session?.user ||
      (safeUserCast(session.user).role !== "admin" && safeUserCast(session.user).role !== "moderator")
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const action = await prisma.action.findUnique({
      where: { id: id },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Action non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateActionSchema.parse(body);

    const updateData: Partial<z.infer<typeof updateActionSchema>> = {
      ...validatedData,
    };

    // Régénérer le slug si le titre change
    if (validatedData.title && validatedData.title !== action.title) {
      const slug = generateSlug(validatedData.title);

      // Vérifier l'unicité du slug
      let counter = 1;
      let finalSlug = slug;
      while (
        await prisma.action.findFirst({
          where: { slug: finalSlug, id: { not: id } },
        })
      ) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      updateData.slug = finalSlug;
    }

    // Convertir les dates string en DateTime si présentes
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate
        ? new Date(validatedData.startDate).toISOString()
        : null;
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate
        ? new Date(validatedData.endDate).toISOString()
        : null;
    }

    // Définir publishedAt si le statut passe à PUBLISHED
    if (validatedData.status === "PUBLISHED" && action.status !== "PUBLISHED") {
      updateData.publishedAt = new Date().toISOString();
    }

    const updatedAction = await prisma.action.update({
      where: { id: id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(updatedAction);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'action:", error);

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

// DELETE - Supprimer une action
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const action = await prisma.action.findUnique({
      where: { id: id },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Action non trouvée" },
        { status: 404 }
      );
    }

    await prisma.action.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Action supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'action:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
