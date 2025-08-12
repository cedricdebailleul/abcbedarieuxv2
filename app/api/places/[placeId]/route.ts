import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PlaceType, PlaceStatus, DayOfWeek } from "@/lib/generated/prisma";

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

  // Images
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  photos: z.array(z.string()).optional(),

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

type RawHour =
  | {
      dayOfWeek: string;
      isClosed?: boolean;
      openTime?: string | null;
      closeTime?: string | null;
      slots?: { openTime: string; closeTime: string }[];
    }
  | any;

function toOpeningRows(placeId: string, openingHours?: RawHour[]) {
  if (!openingHours?.length) return [];

  const rows: {
    placeId: string;
    dayOfWeek: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[] = [];

  for (const item of openingHours) {
    const day = String(item.dayOfWeek).toUpperCase();
    const closed = !!item.isClosed;

    // slots (matin/aprem…)
    if (Array.isArray(item.slots) && item.slots.length) {
      for (const s of item.slots) {
        if (!closed && s?.openTime && s?.closeTime) {
          rows.push({
            placeId,
            dayOfWeek: day as DayOfWeek, // Ensure day is cast to the DayOfWeek enum
            openTime: s.openTime,
            closeTime: s.closeTime,
            isClosed: false,
          });
        }
      }
      continue;
    }

    // format simple
    if (!closed && item.openTime && item.closeTime) {
      rows.push({
        placeId,
        dayOfWeek: day,
        openTime: item.openTime,
        closeTime: item.closeTime,
        isClosed: false,
      });
    }
  }

  // sécurité: filtre slots vides / mal formés
  return rows.filter((r) => r.openTime && r.closeTime);
}

// GET /api/places/[placeId] - Récupérer une place
export async function GET(
  request: Request,
  { params }: { params: { placeId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const { placeId } = await params;

    const place = await prisma.place.findUnique({
      where: { id: placeId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          where: session?.user?.role === "admin" ? {} : { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { reviews: true, favorites: true },
        },
      },
    });

    if (!place) {
      return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
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
    const { placeId } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Vérifier que la place existe et les permissions
    const existingPlace = await prisma.place.findUnique({
      where: { id: placeId },
    });

    if (!existingPlace) {
      return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
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

    // Normaliser les photos (comme dans l'API de création)
    const photos = (validatedData as any).photos || (validatedData as any).images || [];
    const normalizedPhotos = Array.isArray(photos) ? photos : [];

    // Préparer les données additionnelles
    const googleBusinessData =
      (validatedData.openingHours && validatedData.openingHours.length > 0) ||
      normalizedPhotos.length > 0
        ? {
            openingHours: validatedData.openingHours || [],
            images: normalizedPhotos,
          }
        : existingPlace.googleBusinessData;

    // Exclure les champs qui ne sont pas dans le modèle Prisma  
    const { openingHours, photos: _, ...placeData } = validatedData as any;

    // Préparer les données à mettre à jour
    const dataToUpdate: any = {
      ...placeData,
      status: shouldBePending ? PlaceStatus.PENDING : existingPlace.status,
      // Mettre à jour les images (même si array vide pour permettre la suppression)
      images: normalizedPhotos,
    };
    
    // Préserver logo et coverImage existants si pas fournis ou vides
    console.log('🔍 Debug logo/cover:', {
      logoFromForm: dataToUpdate.logo,
      existingLogo: existingPlace.logo,
      coverFromForm: dataToUpdate.coverImage,
      existingCover: existingPlace.coverImage
    });

    if (!dataToUpdate.logo || dataToUpdate.logo.trim() === '') {
      if (normalizedPhotos.length > 0 && normalizedPhotos[0]) {
        dataToUpdate.logo = normalizedPhotos[0];
        console.log('✅ Logo mis à jour depuis photos:', normalizedPhotos[0]);
      } else {
        // Préserver le logo existant
        dataToUpdate.logo = existingPlace.logo;
        console.log('✅ Logo préservé:', existingPlace.logo);
      }
    } else {
      console.log('✅ Logo fourni par le formulaire:', dataToUpdate.logo);
    }
    
    if (!dataToUpdate.coverImage || dataToUpdate.coverImage.trim() === '') {
      if (normalizedPhotos.length > 0 && normalizedPhotos[0]) {
        dataToUpdate.coverImage = normalizedPhotos[0];
        console.log('✅ Cover mise à jour depuis photos:', normalizedPhotos[0]);
      } else {
        // Préserver la coverImage existante
        dataToUpdate.coverImage = existingPlace.coverImage;
        console.log('✅ Cover préservée:', existingPlace.coverImage);
      }
    } else {
      console.log('✅ Cover fournie par le formulaire:', dataToUpdate.coverImage);
    }

    // Ajouter les données Google Business
    if (googleBusinessData) {
      dataToUpdate.googleBusinessData = googleBusinessData;
    }

    const place = await prisma.place.update({
      where: { id: placeId },
      data: dataToUpdate,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // TODO: Si repasse en PENDING, notifier l'admin
    // if (shouldBePending) {
    //   await sendAdminNotification("place_updated", place);
    // }

    if (Array.isArray(validatedData.openingHours)) {
      await prisma.openingHours.deleteMany({ where: { placeId } });
      const openingRows = toOpeningRows(
        placeId,
        validatedData.openingHours ??
          (existingPlace.googleBusinessData as any)?.openingHours
      );
      if (openingRows.length) {
        await prisma.openingHours.createMany({ data: openingRows.map(row => ({ ...row, dayOfWeek: row.dayOfWeek as DayOfWeek })) });
      }
    }

    return NextResponse.json({ place });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
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
    const { placeId } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const existingPlace = await prisma.place.findUnique({
      where: { id: placeId },
    });

    if (!existingPlace) {
      return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
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

    // Supprimer le dossier d'uploads de la place avant de supprimer en BDD
    try {
      const { rm } = await import("fs/promises");
      const { existsSync } = await import("fs");
      const path = await import("path");
      
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "places",
        existingPlace.slug || existingPlace.id
      );
      
      if (existsSync(uploadDir)) {
        await rm(uploadDir, { recursive: true, force: true });
        console.log(`Dossier supprimé: ${uploadDir}`);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du dossier d'uploads:", error);
      // Continuer même si la suppression du dossier échoue
    }

    await prisma.place.delete({
      where: { id: placeId },
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
