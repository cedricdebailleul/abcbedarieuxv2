import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PlaceStatus } from "@/lib/generated/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const place = await prisma.place.findFirst({
      where: { 
        slug,
        status: PlaceStatus.ACTIVE,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        street: true,
        city: true,
        ownerId: true
      }
    });

    if (!place) {
      return NextResponse.json(
        { error: "Place non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ place });

  } catch (error) {
    console.error("Erreur lors de la récupération de la place:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}