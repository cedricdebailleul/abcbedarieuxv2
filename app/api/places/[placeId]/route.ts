import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PLACES_ROOT } from "@/lib/path";
import { rm } from "node:fs/promises";
import type { DayOfWeek } from "@/lib/generated/prisma";
import { Prisma, PlaceType, PlaceStatus } from "@/lib/generated/prisma";
import { DatabaseOpeningHour, GroupedOpeningHours } from "@/lib/schemas/common";

/* --------------------------- helpers Zod --------------------------- */
const numOpt = z.preprocess(
  (v) => (v === null || v === "" ? undefined : v),
  z.coerce.number().finite().optional()
);

/* --------------------------- Zod schema --------------------------- */
const placeSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),

  // ✅ enums Prisma => nativeEnum
  type: z.nativeEnum(PlaceType),

  // ⚠️ on calcule le status via "published" côté API, ne pas le rendre requis
  status: z.nativeEnum(PlaceStatus).optional(),

  category: z.string().optional(),
  description: z.string().optional(),
  summary: z.string().max(280).optional(),

  // Adresse
  street: z.string().min(1, "La rue est requise"),
  streetNumber: z.string().optional(),
  postalCode: z.string().min(1, "Le code postal est requis"),
  city: z.string().min(1, "La ville est requise"),

  // ✅ tolère "", null et nombre
  latitude: numOpt,
  longitude: numOpt,

  // Images
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  photos: z.array(z.string()).optional(), // venant du form
  images: z.array(z.string()).optional(), // state local

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
  categories: z.array(z.string()).optional(),
  openingHours: z.array(z.any()).optional(),

  // 👇 pilotage publication venant du form
  published: z.boolean().optional(),
  isFeatured: z.boolean().optional(),

  // Admin: rendre la place revendiquable (ownerId = null)
  createForClaim: z.boolean().optional(),
});

type RawHour =
  | {
      dayOfWeek: string;
      isClosed?: boolean;
      openTime?: string | null;
      closeTime?: string | null;
      slots?: { openTime: string; closeTime: string }[];
    }
  | {
      dayOfWeek: string;
      isClosed?: boolean;
      openTime?: string | null;
      closeTime?: string | null;
      slots?: { openTime: string; closeTime: string }[];
    };

/* ---------------------- Horaires utilitaires ----------------------- */

// Transformer les horaires DB vers le format avec slots
function groupOpeningHoursByDay(dbHours: DatabaseOpeningHour[]) {
  if (!dbHours?.length) return [];
  
  const groupedByDay: GroupedOpeningHours = {};
  
  // Grouper par jour
  for (const hour of dbHours) {
    const day = hour.dayOfWeek;
    if (!groupedByDay[day]) {
      groupedByDay[day] = [];
    }
    groupedByDay[day].push(hour);
  }
  
  // Convertir en format avec slots
  const result = Object.entries(groupedByDay).map(([dayOfWeek, hours]) => {
    // Vérifier s'il y a des créneaux fermés
    const hasClosedHour = hours.some(h => h.isClosed);
    
    if (hasClosedHour || hours.length === 0) {
      return {
        dayOfWeek,
        isClosed: true,
        openTime: null,
        closeTime: null,
        slots: []
      };
    }
    
    // Créer les slots depuis les horaires valides
    const slots = hours
      .filter(h => !h.isClosed && h.openTime && h.closeTime)
      .map(h => ({
        openTime: h.openTime,
        closeTime: h.closeTime
      }));
    
    return {
      dayOfWeek,
      isClosed: false,
      openTime: slots[0]?.openTime || null, // Pour compatibilité
      closeTime: slots[slots.length - 1]?.closeTime || null, // Pour compatibilité
      slots
    };
  });
  
  console.log("groupOpeningHoursByDay - Input:", dbHours.length, "hours");
  console.log("groupOpeningHoursByDay - Output:", result.length, "days with slots");
  
  return result;
}

function toOpeningRows(placeId: string, openingHours?: RawHour[]) {
  if (!openingHours?.length) return [];
  
  console.log("toOpeningRows - Input openingHours:", JSON.stringify(openingHours, null, 2));

  const rows: {
    placeId: string;
    dayOfWeek: DayOfWeek;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[] = [];

  for (const item of openingHours) {
    const day = String(item.dayOfWeek).toUpperCase() as DayOfWeek;
    const closed = !!item.isClosed;

    if (Array.isArray(item.slots) && item.slots.length) {
      console.log(`toOpeningRows - Processing ${item.slots.length} slots for ${day}:`, item.slots);
      for (const s of item.slots) {
        if (!closed && s?.openTime && s?.closeTime) {
          console.log(`toOpeningRows - Adding slot for ${day}:`, s);
          rows.push({
            placeId,
            dayOfWeek: day,
            openTime: s.openTime,
            closeTime: s.closeTime,
            isClosed: false,
          });
        }
      }
      continue;
    }

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

  console.log("toOpeningRows - Final rows:", rows.length, "rows created");
  return rows.filter((r) => r.openTime && r.closeTime);
}

/* ================================ GET ================================ */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await ctx.params;

  try {
    const session = await auth.api.getSession({ headers: request.headers });

    const place = await prisma.place.findUnique({
      where: { id: placeId },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        openingHours: { orderBy: { dayOfWeek: "asc" } },
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true, color: true, parentId: true }
            }
          }
        },
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          where: session?.user?.role === "admin" ? {} : { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { reviews: true, favorites: true } },
      },
    });

    if (!place) {
      return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
    }

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

    // Transformer les horaires pour regrouper les créneaux multiples par jour
    const transformedPlace = {
      ...place,
      openingHours: groupOpeningHoursByDay(place.openingHours)
    };

    return NextResponse.json({ place: transformedPlace });
  } catch (error) {
    console.error("Erreur lors de la récupération de la place:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/* ================================ PUT ================================ */
export async function PUT(
  request: Request,
  ctx: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await ctx.params;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
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

    const canEdit =
      safeUserCast(session.user).role === "admin" ||
      existingPlace.ownerId === session.user.id;
    if (!canEdit) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = placeSchema.parse(body);

    // photos/images -> normalizedPhotos
    const photosFromForm = (validatedData as { photos?: string[] }).photos;
    const imagesFromState = (validatedData as { images?: string[] }).images;
    const rawPhotos =
      Array.isArray(imagesFromState) && imagesFromState.length > 0
        ? imagesFromState
        : Array.isArray(photosFromForm) && photosFromForm.length > 0
          ? photosFromForm
          : [];
    const normalizedPhotos = Array.isArray(rawPhotos) ? rawPhotos : [];

    // extraire openingHours et nettoyer l'objet principal (exclure photos/images directement)
    const {
      openingHours: newOpeningHours,
      photos: _photos,
      images: _images,
      status: _statusFromForm, // on n'utilise pas directement
      published: _published,
      categories: newCategories,
      isFeatured,
      createForClaim,
      ...placeData
    } = validatedData;

    void _photos;
    void _images;
    void _statusFromForm;
    void _published;

    // map "published" -> status
    const hasPublishedFlag = Object.prototype.hasOwnProperty.call(
      body,
      "published"
    );
    const wantsPublished = hasPublishedFlag
      ? Boolean(body.published)
      : undefined;

    let nextStatus: PlaceStatus = existingPlace.status;
    const shouldBePending =
      safeUserCast(session.user).role !== "admin" &&
      existingPlace.status === PlaceStatus.ACTIVE;

    if (wantsPublished === undefined) {
      if (shouldBePending) nextStatus = PlaceStatus.PENDING;
    } else if (wantsPublished === true) {
      nextStatus =
        safeUserCast(session.user).role === "admin"
          ? PlaceStatus.ACTIVE
          : PlaceStatus.PENDING;
    } else {
      nextStatus = PlaceStatus.PENDING;
    }

    // googleBusinessData JSON
    const googleBusinessDataValue =
      (Array.isArray(newOpeningHours) && newOpeningHours.length > 0) ||
      normalizedPhotos.length > 0
        ? ({
            openingHours: newOpeningHours || [],
            images: normalizedPhotos,
          } as Prisma.InputJsonValue)
        : ((existingPlace.googleBusinessData as Prisma.InputJsonValue | null) ??
          undefined);

    // Préserver logo/cover si vides, sinon fallback 1ère photo
    const finalLogo =
      typeof placeData.logo === "string" && placeData.logo.trim() !== ""
        ? placeData.logo
        : (normalizedPhotos[0] ?? existingPlace.logo ?? undefined);

    const finalCover =
      typeof placeData.coverImage === "string" &&
      placeData.coverImage.trim() !== ""
        ? placeData.coverImage
        : (normalizedPhotos[0] ?? existingPlace.coverImage ?? undefined);

    // Détecter et supprimer les anciennes images (local + R2)
    const { cleanupUnusedImages } = await import("@/lib/cleanup-images");
    await cleanupUnusedImages(existingPlace, {
      logo: finalLogo ?? null,
      coverImage: finalCover ?? null,
      images: normalizedPhotos,
    });

    // Gérer la revendication (admin seulement)
    const shouldRemoveOwner =
      safeUserCast(session.user).role === "admin" &&
      createForClaim === true;

    // Construire update
    const updateData: Prisma.PlaceUpdateInput = {
      ...placeData,
      status: nextStatus,
      isFeatured: typeof isFeatured === "boolean" ? isFeatured : existingPlace.isFeatured,
      images: normalizedPhotos as unknown as Prisma.InputJsonValue,
      googleBusinessData: googleBusinessDataValue,
      logo: finalLogo ?? null,
      coverImage: finalCover ?? null,
      googlePlaceId:
        typeof body.googlePlaceId === "string" && body.googlePlaceId.trim()
          ? body.googlePlaceId
          : existingPlace.googlePlaceId,
      // Si admin coche "peut être revendiquée", retirer le propriétaire
      ...(shouldRemoveOwner && {
        ownerId: null,
        claimedAt: null,
        isVerified: false,
      }),
    };

    const place = await prisma.place.update({
      where: { id: placeId },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    // Catégories: deleteMany + createMany (seulement si des catégories sont fournies)
    if (Array.isArray(newCategories)) {
      await prisma.placeToCategory.deleteMany({ where: { placeId } });
      if (newCategories.length > 0) {
        await prisma.placeToCategory.createMany({
          data: newCategories.map((categoryId) => ({
            placeId: placeId,
            categoryId: categoryId,
          })),
        });
      }
    }

    // Horaires: deleteMany + createMany (seulement si des horaires sont fournies)
    if (Array.isArray(newOpeningHours) && newOpeningHours.length > 0) {
      await prisma.openingHours.deleteMany({ where: { placeId } });
      const openingRows = toOpeningRows(placeId, newOpeningHours);
      if (openingRows.length) {
        await prisma.openingHours.createMany({
          data: openingRows.map((row) => ({
            ...row,
            dayOfWeek: String(row.dayOfWeek).toUpperCase() as DayOfWeek,
          })),
        });
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

/* ============================== DELETE ============================== */
export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await ctx.params;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
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
      safeUserCast(session.user).role === "admin" ||
      existingPlace.ownerId === session.user.id;
    if (!canDelete) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Supprimer tous les fichiers (local + R2)
    const { deleteAllImages } = await import("@/lib/cleanup-images");
    await deleteAllImages(existingPlace);

    // Supprimer le dossier uploads local
    try {
      const uploadDir = PLACES_ROOT(existingPlace.slug || existingPlace.id);
      await rm(uploadDir, { recursive: true, force: true }).catch(() => {});
      console.log(`✅ Dossier supprimé: ${uploadDir}`);
    } catch (err) {
      console.error("❌ Erreur suppression dossier:", err);
    }

    await prisma.place.delete({ where: { id: placeId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur DELETE place:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
