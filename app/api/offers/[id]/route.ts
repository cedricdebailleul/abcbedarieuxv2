import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma";

// Create a direct Prisma client instance as fallback
const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'offre avec vérification de propriété
    const offer = await prisma.offer.findFirst({
      where: {
        id,
        status: { not: 'ARCHIVED' },
        place: {
          OR: [
            { ownerId: session.user.id },
            ...((['admin', 'moderator'].includes(session.user.role || '')) ? [{}] : [])
          ]
        }
      },
      include: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            type: true,
          }
        }
      }
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Offre non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      offer,
      userRole: session.user.role,
    });

  } catch (error) {
    console.error("Erreur récupération offre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'offre existe et que l'utilisateur en est propriétaire
    const existingOffer = await prisma.offer.findFirst({
      where: {
        id,
        status: { not: 'ARCHIVED' },
        place: {
          OR: [
            { ownerId: session.user.id },
            ...((['admin', 'moderator'].includes(session.user.role || '')) ? [{}] : [])
          ]
        }
      }
    });

    if (!existingOffer) {
      return NextResponse.json(
        { error: "Offre non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Mettre à jour l'offre
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        // Assurer les valeurs par défaut
        isActive: body.isActive ?? true,
        status: body.status ?? 'ACTIVE',
      },
      include: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Offre mise à jour avec succès",
      offer: updatedOffer
    });

  } catch (error) {
    console.error("Erreur mise à jour offre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}