import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { type DayOfWeek, PlaceStatus, PlaceType } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { PLACES_ROOT } from "@/lib/path";

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
  | {
      dayOfWeek: string;
      isClosed?: boolean;
      openTime?: string | null;
      closeTime?: string | null;
      slots?: { openTime: string; closeTime: string }[];
    };

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
            dayOfWeek: day as DayOfWeek,
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
    const photosFromForm = (
      validatedData as { photos?: string[]; images?: string[] }
    ).photos;
    const imagesFromState = (
      validatedData as { photos?: string[]; images?: string[] }
    ).images;

    // Prioriser images (state) si photos est vide, sinon prendre photos
    const rawPhotos =
      Array.isArray(imagesFromState) && imagesFromState.length > 0
        ? imagesFromState
        : Array.isArray(photosFromForm) && photosFromForm.length > 0
        ? photosFromForm
        : [];
    const normalizedPhotos = Array.isArray(rawPhotos) ? rawPhotos : [];

    // Préparer les données additionnelles
    const { openingHours: newOpeningHours } = validatedData as z.infer<
      typeof placeSchema
    >;
    const googleBusinessData =
      (newOpeningHours && newOpeningHours.length > 0) ||
      normalizedPhotos.length > 0
        ? {
            openingHours: newOpeningHours || [],
            images: normalizedPhotos,
          }
        : existingPlace.googleBusinessData;

    const {
      openingHours,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      photos: _photos,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      images: _images,
      ...placeData
    } = validatedData as z.infer<typeof placeSchema>;

    // Préparer les données à mettre à jour
    const dataToUpdate: Omit<
      Partial<z.infer<typeof placeSchema>>,
      "openingHours"
    > & {
      status: PlaceStatus;
      images: string[];
      openingHours?: {
        deleteMany: Record<string, unknown>;
        create: {
          dayOfWeek: DayOfWeek;
          openTime: string | null;
          closeTime: string | null;
          isClosed: boolean;
        }[];
      };
      googleBusinessData?: { openingHours?: RawHour[]; images?: string[] };
    } = {
      ...placeData,
      status: shouldBePending ? PlaceStatus.PENDING : existingPlace.status,
      images: normalizedPhotos,
      openingHours: openingHours
        ? {
            deleteMany: {},
            create: openingHours.flatMap(
              (
                row: RawHour
              ): {
                dayOfWeek: DayOfWeek;
                isClosed: boolean;
                openTime: string | null;
                closeTime: string | null;
              }[] => {
                const dayOfWeek = String(
                  row.dayOfWeek
                ).toUpperCase() as DayOfWeek;

                // Vérifier que c'est un jour valide
                const validDays = [
                  "MONDAY",
                  "TUESDAY",
                  "WEDNESDAY",
                  "THURSDAY",
                  "FRIDAY",
                  "SATURDAY",
                  "SUNDAY",
                ];
                if (!validDays.includes(dayOfWeek)) {
                  console.warn(`Jour invalide ignoré: ${row.dayOfWeek}`);
                  return [];
                }

                if (row.isClosed) {
                  return [
                    {
                      dayOfWeek,
                      isClosed: true,
                      openTime: null,
                      closeTime: null,
                    },
                  ];
                }

                // Gestion des créneaux multiples (pause midi)
                if (Array.isArray(row.slots) && row.slots.length > 0) {
                  return row.slots.map((slot) => ({
                    dayOfWeek,
                    isClosed: false,
                    openTime: slot.openTime ? String(slot.openTime) : null,
                    closeTime: slot.closeTime ? String(slot.closeTime) : null,
                  }));
                }

                // Créneau simple
                return [
                  {
                    dayOfWeek,
                    isClosed: false,
                    openTime: row.openTime ? String(row.openTime) : null,
                    closeTime: row.closeTime ? String(row.closeTime) : null,
                  },
                ];
              }
            ),
          }
        : undefined,
    };

    // Préserver logo et coverImage existants si pas fournis ou vides
    console.log("🔍 Debug logo/cover:", {
      logoFromForm: dataToUpdate.logo,
      existingLogo: existingPlace.logo,
      coverFromForm: dataToUpdate.coverImage,
      existingCover: existingPlace.coverImage,
    });

    if (!dataToUpdate.logo || dataToUpdate.logo.trim() === "") {
      if (normalizedPhotos.length > 0 && normalizedPhotos[0]) {
        dataToUpdate.logo = normalizedPhotos[0];
        console.log("✅ Logo mis à jour depuis photos:", normalizedPhotos[0]);
      } else {
        // Préserver le logo existant
        dataToUpdate.logo =
          existingPlace.logo !== null ? existingPlace.logo : undefined;
        console.log("✅ Logo préservé:", existingPlace.logo);
      }
    } else {
      console.log("✅ Logo fourni par le formulaire:", dataToUpdate.logo);
    }

    if (!dataToUpdate.coverImage || dataToUpdate.coverImage.trim() === "") {
      if (normalizedPhotos.length > 0 && normalizedPhotos[0]) {
        dataToUpdate.coverImage = normalizedPhotos[0];
        console.log("✅ Cover mise à jour depuis photos:", normalizedPhotos[0]);
      } else {
        // Préserver la coverImage existante
        dataToUpdate.coverImage = existingPlace.coverImage ?? undefined;
        console.log("✅ Cover préservée:", existingPlace.coverImage);
      }
    } else {
      console.log(
        "✅ Cover fournie par le formulaire:",
        dataToUpdate.coverImage
      );
    }

    // Ajouter les données Google Business
    if (
      googleBusinessData &&
      typeof googleBusinessData === "object" &&
      !Array.isArray(googleBusinessData) &&
      ("openingHours" in googleBusinessData || "images" in googleBusinessData)
    ) {
      dataToUpdate.googleBusinessData = googleBusinessData as {
        openingHours?: RawHour[];
        images?: string[];
      };
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

    if (Array.isArray(openingHours)) {
      await prisma.openingHours.deleteMany({ where: { placeId } });
      const openingRows = toOpeningRows(
        placeId,
        openingHours ??
          (existingPlace.googleBusinessData as { openingHours?: RawHour[] })
            ?.openingHours
      );
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

// DELETE /api/places/[placeId] - Supprimer une place
export async function DELETE(
  request: Request,
  { params }: { params: { placeId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const { placeId } = params;

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

    // Supprimer le dossier uploads de la place (dans le volume persistant)
    try {
      const { rm } = await import("node:fs/promises");
      const uploadDir = PLACES_ROOT(existingPlace.slug || existingPlace.id);

      await rm(uploadDir, { recursive: true, force: true }).catch(() => {});
      console.log(`Dossier supprimé: ${uploadDir}`);
    } catch (err) {
      console.error("Erreur suppression dossier uploads:", err);
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
