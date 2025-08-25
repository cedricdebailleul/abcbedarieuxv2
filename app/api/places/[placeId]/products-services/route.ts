import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

// Create a direct Prisma client instance as fallback
const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await context.params;

    // Vérifier que la place existe
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true, name: true, status: true }
    });

    if (!place) {
      return NextResponse.json(
        { error: "Lieu non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer tous les produits, services et offres en parallèle
    const [products, services, offers] = await Promise.all([
      prisma.product.findMany({
        where: { 
          placeId,
          status: { not: 'ARCHIVED' },
          isActive: true
        },
        orderBy: [
          { isFeatured: 'desc' },
          { status: 'asc' }, // PUBLISHED first
          { createdAt: 'desc' }
        ],
      }),
      
      prisma.service.findMany({
        where: { 
          placeId,
          status: { not: 'ARCHIVED' },
          isActive: true
        },
        orderBy: [
          { isFeatured: 'desc' },
          { status: 'asc' }, // PUBLISHED first
          { createdAt: 'desc' }
        ],
      }),
      
      prisma.offer.findMany({
        where: { 
          placeId,
          status: { not: 'ARCHIVED' },
          isActive: true
        },
        orderBy: [
          { status: 'asc' }, // ACTIVE first
          { endDate: 'asc' }, // Expiring soon first
          { createdAt: 'desc' }
        ],
      })
    ]);

    return NextResponse.json({
      place: {
        id: place.id,
        name: place.name,
        status: place.status
      },
      products,
      services,
      offers,
      summary: {
        totalProducts: products.length,
        totalServices: services.length,
        totalOffers: offers.filter(o => 
          o.status === 'ACTIVE' && 
          (!o.endDate || new Date(o.endDate) > new Date())
        ).length,
        featuredProducts: products.filter(p => p.isFeatured).length,
        featuredServices: services.filter(s => s.isFeatured).length,
      }
    });

  } catch (error) {
    console.error("Erreur récupération produits/services/offres:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}