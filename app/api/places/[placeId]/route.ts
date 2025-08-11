import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PlaceType, PlaceStatus } from "@/lib/generated/prisma";

const placeSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.nativeEnum(PlaceType),
  category: z.string().optional(),
  description: z.string().optional(),
  summary: z.string().max(280).optional(),
  
  // Adresse
  street: z.string().min(1, "La rue est requise"),
  streetNumber: z.string().optional(),
  postalCode: z.string().min(1, "Le code postal est requis"),
  city: z.string().min(1, "La ville est requise"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  
  // Contact
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  
  // Réseaux sociaux
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  tiktok: z.string().optional(),
  
  // Google
  googlePlaceId: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  
  // SEO
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  
  // Données supplémentaires
  openingHours: z.array(z.any()).optional(),
  images: z.array(z.string()).optional(),
});

// GET /api/places/[placeId] - Récupérer une place
export async function GET(
  request: Request,
  { params }: { params: { placeId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { placeId } = params;
    
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true }
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, image: true }
            }
          },
          where: session?.user?.role === "admin" ? {} : { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 10
        },
        _count: {
          select: { reviews: true, favorites: true }
        }
      }
    });
    
    if (!place) {
      return NextResponse.json(
        { error: "Place non trouvée" },
        { status: 404 }
      );
    }
    
    // Vérifier les permissions
    const canView = 
      place.status === PlaceStatus.ACTIVE ||
      session?.user?.role === "admin" ||
      place.ownerId === session?.user?.id;
    
    if (!canView) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
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

// PUT /api/places/[placeId] - Modifier une place
export async function PUT(
  request: Request,
  { params }: { params: { placeId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { placeId } = params;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    
    // Vérifier que la place existe et les permissions
    const existingPlace = await prisma.place.findUnique({
      where: { id: placeId }
    });
    
    if (!existingPlace) {
      return NextResponse.json(
        { error: "Place non trouvée" },
        { status: 404 }
      );
    }
    
    const canEdit = 
      session.user.role === "admin" ||
      existingPlace.ownerId === session.user.id;
    
    if (!canEdit) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = placeSchema.parse(body);
    
    // Si l'utilisateur modifie et n'est pas admin, repasser en PENDING
    const shouldBePending = 
      session.user.role !== "admin" && 
      existingPlace.status === PlaceStatus.ACTIVE;
    
    // Préparer les données additionnelles
    const googleBusinessData = (validatedData.openingHours && validatedData.openingHours.length > 0) || 
                               (validatedData.images && validatedData.images.length > 0) 
      ? {
          openingHours: validatedData.openingHours || [],
          images: validatedData.images || []
        }
      : existingPlace.googleBusinessData;

    // Exclure les champs qui ne sont pas dans le modèle Prisma
    const { openingHours, images, ...placeData } = validatedData;
    
    const place = await prisma.place.update({
      where: { id: placeId },
      data: {
        ...placeData,
        status: shouldBePending ? PlaceStatus.PENDING : existingPlace.status,
        googleBusinessData,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // TODO: Si repasse en PENDING, notifier l'admin
    // if (shouldBePending) {
    //   await sendAdminNotification("place_updated", place);
    // }
    
    return NextResponse.json({ place });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Erreur lors de la modification de la place:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/places/[placeId] - Supprimer une place
export async function DELETE(
  request: Request,
  { params }: { params: { placeId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { placeId } = params;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    
    const existingPlace = await prisma.place.findUnique({
      where: { id: placeId }
    });
    
    if (!existingPlace) {
      return NextResponse.json(
        { error: "Place non trouvée" },
        { status: 404 }
      );
    }
    
    const canDelete = 
      session.user.role === "admin" ||
      existingPlace.ownerId === session.user.id;
    
    if (!canDelete) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }
    
    await prisma.place.delete({
      where: { id: placeId }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Erreur lors de la suppression de la place:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}