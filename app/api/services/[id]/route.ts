import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

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

    // Récupérer le service avec vérification de propriété
    const service = await prisma.service.findFirst({
      where: {
        id,
        status: { not: 'ARCHIVED' },
        place: {
          OR: [
            { ownerId: session.user.id },
            ...((['admin', 'moderator'].includes(safeUserCast(session.user).role || '')) ? [{}] : [])
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

    if (!service) {
      return NextResponse.json(
        { error: "Service non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      service,
      userRole: safeUserCast(session.user).role,
    });

  } catch (error) {
    console.error("Erreur récupération service:", error);
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

    // Vérifier que le service existe et que l'utilisateur en est propriétaire
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        status: { not: 'ARCHIVED' },
        place: {
          OR: [
            { ownerId: session.user.id },
            ...((['admin', 'moderator'].includes(safeUserCast(session.user).role || '')) ? [{}] : [])
          ]
        }
      }
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Mettre à jour le service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...body,
        // Assurer les valeurs par défaut
        isActive: body.isActive ?? true,
        status: body.status ?? 'PUBLISHED',
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
      message: "Service mis à jour avec succès",
      service: updatedService
    });

  } catch (error) {
    console.error("Erreur mise à jour service:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}