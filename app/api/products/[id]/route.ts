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

    // Récupérer le produit avec vérification de propriété
    const product = await prisma.product.findFirst({
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

    if (!product) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product,
      userRole: safeUserCast(session.user).role,
    });

  } catch (error) {
    console.error("Erreur récupération produit:", error);
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

    // Vérifier que le produit existe et que l'utilisateur en est propriétaire
    const existingProduct = await prisma.product.findFirst({
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
          }
        }
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Mettre à jour le produit
    const updatedProduct = await prisma.product.update({
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
      message: "Produit mis à jour avec succès",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Erreur mise à jour produit:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}