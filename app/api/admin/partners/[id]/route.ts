import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Partner, Prisma } from "@/lib/generated/prisma";
import {
  PartnerUpdateSchema,
  preparePartnerForDatabase,
} from "@/lib/types/partners";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<Partner | { error: string }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (
      !session?.user ||
      (safeUserCast(session.user).role !== "admin" && safeUserCast(session.user).role !== "moderator")
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
    });

    if (!partner) {
      return NextResponse.json(
        { error: "Partenaire non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Erreur lors de la récupération du partenaire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un partenaire
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = PartnerUpdateSchema.parse(body);

    // Vérifier l'existence du partenaire
    const existingPartner = await prisma.partner.findUnique({
      where: { id: params.id },
    });

    if (!existingPartner) {
      return NextResponse.json(
        { error: "Partenaire non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier l'unicité du slug si modifié
    if (validatedData.slug && validatedData.slug !== existingPartner.slug) {
      const slugExists = await prisma.partner.findUnique({
        where: { slug: validatedData.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "Un partenaire avec ce slug existe déjà" },
          { status: 400 }
        );
      }
    }
    // Préparer les données pour la mise à jour
    const updateData = {
      ...preparePartnerForDatabase(validatedData),
      updatedBy: session.user.id,
    };
    const updatedPartner = await prisma.partner.update({
      where: { id: params.id },
      data: updateData as Prisma.PartnerUpdateInput, // Cast nécessaire pour la compatibilité Prisma
    });

    return NextResponse.json(updatedPartner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la mise à jour du partenaire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un partenaire
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier l'existence du partenaire
    const existingPartner = await prisma.partner.findUnique({
      where: { id: params.id },
    });

    if (!existingPartner) {
      return NextResponse.json(
        { error: "Partenaire non trouvé" },
        { status: 404 }
      );
    }

    await prisma.partner.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Partenaire supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du partenaire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
