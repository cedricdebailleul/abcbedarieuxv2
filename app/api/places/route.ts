import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PlaceType, PlaceStatus } from "@/lib/generated/prisma";
import { notifyAdminsNewPlace } from "@/lib/place-notifications";

// Schema de validation pour création/modification
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
  
  // Données supplémentaires du formulaire
  openingHours: z.array(z.any()).optional(),
  images: z.array(z.string()).optional(),
});

// GET /api/places - Liste des places
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const offset = (page - 1) * limit;
    
    // Construction de la requête
    const where: any = {};
    
    // Filtres publics
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Gestion des permissions
    if (!session?.user) {
      // Public : seulement les places actives et vérifiées
      where.status = PlaceStatus.ACTIVE;
      where.isActive = true;
    } else if (session.user.role === "admin") {
      // Admin : peut voir toutes les places avec filtre status
      if (status) where.status = status;
    } else {
      // Utilisateur connecté : ses places + places publiques
      if (status) {
        where.status = status;
        where.ownerId = session.user.id;
      } else {
        where.OR = [
          { status: PlaceStatus.ACTIVE, isActive: true },
          { ownerId: session.user.id }
        ];
      }
    }
    
    const [places, total] = await Promise.all([
      prisma.place.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { reviews: true, favorites: true }
          }
        },
        orderBy: [
          { isFeatured: "desc" },
          { updatedAt: "desc" }
        ]
      }),
      prisma.place.count({ where })
    ]);
    
    return NextResponse.json({
      places,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des places:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/places - Création d'une place
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validatedData = placeSchema.parse(body);
    
    // Générer un slug unique
    const baseSlug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
      
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.place.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Préparer les données additionnelles
    const googleBusinessData = (validatedData.openingHours && validatedData.openingHours.length > 0) || 
                               (validatedData.images && validatedData.images.length > 0) 
      ? {
          openingHours: validatedData.openingHours || [],
          images: validatedData.images || []
        }
      : null;

    // Exclure les champs qui ne sont pas dans le modèle Prisma
    const { openingHours, images, ...placeData } = validatedData;

    // Créer la place
    const place = await prisma.place.create({
      data: {
        ...placeData,
        slug,
        ownerId: session.user.id,
        status: PlaceStatus.PENDING, // Validation admin requise
        googleBusinessData,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // Envoyer notification à l'admin (en arrière-plan)
    if (place.owner) {
      notifyAdminsNewPlace(
        place.name,
        place.owner.name,
        place.owner.email,
        place.id
      ).catch(error => {
        console.error("Erreur notification admin:", error);
      });
    }
    
    return NextResponse.json({ place }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Erreur lors de la création de la place:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}