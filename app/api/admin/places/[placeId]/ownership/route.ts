import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ownershipSchema = z.object({
  action: z.enum(["assign", "remove"]),
  userId: z.string().optional(), // Requis pour "assign"
});

export async function POST(
  request: Request,
  ctx: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await ctx.params;
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, userId } = ownershipSchema.parse(body);

    // Vérifier que la place existe
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      include: { owner: { select: { name: true, email: true } } },
    });

    if (!place) {
      return NextResponse.json(
        { error: "Place non trouvée" },
        { status: 404 }
      );
    }

    let message = "";
    let updatedPlace;

    switch (action) {
      case "assign":
        if (!userId) {
          return NextResponse.json(
            { error: "ID utilisateur requis pour l'assignation" },
            { status: 400 }
          );
        }

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

        updatedPlace = await prisma.place.update({
          where: { id: placeId },
          data: { ownerId: userId },
          include: { owner: { select: { id: true, name: true, email: true } } },
        });

        message = `Place assignée à ${user.name} (${user.email})`;
        break;

      case "remove":
        updatedPlace = await prisma.place.update({
          where: { id: placeId },
          data: { ownerId: null },
          include: { owner: { select: { id: true, name: true, email: true } } },
        });

        message = `Propriétaire retiré de la place "${place.name}"`;
        break;

      default:
        return NextResponse.json(
          { error: "Action non valide" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message,
      place: updatedPlace,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la gestion de la propriété:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}