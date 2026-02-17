import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PlaceStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// POST /api/places/[placeId]/claim - Revendiquer directement une place
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;

    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que la place existe et peut être revendiquée
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        status: true,
      },
    });

    if (!place) {
      return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
    }

    // Vérifier que la place n'a pas déjà un propriétaire
    if (place.ownerId) {
      return NextResponse.json({ error: "Cette place a déjà un propriétaire" }, { status: 400 });
    }

    // Vérifier que la place est active (seules les places actives peuvent être revendiquées)
    if (place.status !== PlaceStatus.ACTIVE) {
      return NextResponse.json(
        { error: "Seules les places actives peuvent être revendiquées" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur ne possède pas déjà trop de places (limite optionnelle)
    const userPlacesCount = await prisma.place.count({
      where: { ownerId: session.user.id },
    });

    const maxPlacesPerUser = 10; // Limite configurable
    if (userPlacesCount >= maxPlacesPerUser) {
      return NextResponse.json(
        { error: `Vous ne pouvez pas posséder plus de ${maxPlacesPerUser} places` },
        { status: 400 }
      );
    }

    // Attribuer la place à l'utilisateur
    const updatedPlace = await prisma.place.update({
      where: { id: placeId },
      data: {
        ownerId: session.user.id,
        // La place reste active, pas besoin de repasser en PENDING
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Vous êtes maintenant propriétaire de "${place.name}"`,
      place: updatedPlace,
    });
  } catch (error) {
    console.error("Erreur lors de la revendication de la place:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
