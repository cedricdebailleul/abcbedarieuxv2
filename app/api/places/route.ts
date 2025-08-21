import { existsSync, mkdirSync, rename } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { BadgeSystem } from "@/lib/badge-system";
import { DayOfWeek, PlaceStatus, PlaceType } from "@/lib/generated/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import { notifyAdminsNewPlace } from "@/lib/place-notifications";
import { prisma } from "@/lib/prisma";

const renameAsync = promisify(rename);

// Fonction pour déplacer les fichiers temporaires vers le dossier final
interface DataToCreate {
  logo?: string;
  coverImage?: string;
  images?: string[];
  [key: string]: string | number | boolean | string[] | undefined; // Add additional fields as necessary
}

async function moveTemporaryFiles(
  dataToCreate: DataToCreate,
  finalSlug: string
) {
  const baseUploadPath = join(process.cwd(), "public", "uploads", "places");

  // Chercher tous les dossiers temporaires qui pourraient correspondre
  const { readdir } = await import("node:fs/promises");
  try {
    const placesDir = await readdir(baseUploadPath);
    const tempDirs = placesDir.filter((dir) => dir.startsWith("temp-"));

    for (const tempDir of tempDirs) {
      const tempPath = join(baseUploadPath, tempDir);
      const finalPath = join(baseUploadPath, finalSlug);

      // Vérifier si le dossier temporaire contient des fichiers
      try {
        const tempFiles = await readdir(tempPath);
        if (tempFiles.length > 0) {
          // Créer le dossier de destination s'il n'existe pas
          if (!existsSync(finalPath)) {
            mkdirSync(finalPath, { recursive: true });
          }

          // Déplacer tous les fichiers du dossier temporaire vers le dossier final
          for (const file of tempFiles) {
            const tempFilePath = join(tempPath, file);
            const finalFilePath = join(finalPath, file);

            try {
              await renameAsync(tempFilePath, finalFilePath);
              console.log(
                `Fichier déplacé: ${tempFilePath} -> ${finalFilePath}`
              );
            } catch (error) {
              console.error(`Erreur déplacement fichier ${file}:`, error);
            }
          }

          // Supprimer le dossier temporaire vide
          try {
            const { rmdir } = await import("node:fs/promises");
            await rmdir(tempPath);
            console.log(`Dossier temporaire supprimé: ${tempPath}`);
          } catch (error) {
            console.error(
              `Erreur suppression dossier temporaire ${tempPath}:`,
              error
            );
          }

          // Mettre à jour les URLs dans les données si elles pointent vers le dossier temporaire
          updateFileUrls(dataToCreate, tempDir, finalSlug);
        }
      } catch (error) {
        console.error(`Erreur lecture dossier temporaire ${tempPath}:`, error);
      }
    }
  } catch (error) {
    console.error("Erreur lecture dossier places:", error);
  }
}

// Fonction pour mettre à jour les URLs des fichiers
function updateFileUrls(
  dataToCreate: DataToCreate,
  tempSlug: string,
  finalSlug: string
) {
  const updateUrl = (url: string) => {
    if (url?.includes(`/uploads/places/${tempSlug}/`)) {
      return url.replace(
        `/uploads/places/${tempSlug}/`,
        `/uploads/places/${finalSlug}/`
      );
    }
    return url;
  };

  if (dataToCreate.logo) {
    dataToCreate.logo = updateUrl(dataToCreate.logo);
  }
  if (dataToCreate.coverImage) {
    dataToCreate.coverImage = updateUrl(dataToCreate.coverImage);
  }
  if (Array.isArray(dataToCreate.images)) {
    dataToCreate.images = dataToCreate.images.map(updateUrl);
  }
}

// Schema de validation pour création/modification
const placeSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.nativeEnum(PlaceType),
  category: z.string().optional(), // Legacy field
  categories: z.array(z.string()).optional(), // New multiple categories
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
  images: z.array(z.string()).optional(),

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

  // Option admin : créer pour revendication
  createForClaim: z.boolean().optional(),
});

// GET /api/places - Liste des places
export async function GET(request: Request) {
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
  const where: Record<string, unknown> = {};

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
        { ownerId: session.user.id },
      ];
    }
  }

  try {
    const [places, total] = await Promise.all([
      prisma.place.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  icon: true,
                  color: true,
                },
              },
            },
          },
          _count: {
            select: { reviews: true, favorites: true },
          },
        },
        orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.place.count({ where }),
    ]);

    return NextResponse.json({
      places,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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

    const normalizedPhotos =
      validatedData.photos && validatedData.photos.length > 0
        ? validatedData.photos
        : validatedData.images && validatedData.images.length > 0
        ? validatedData.images
        : [];

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
    // Exclure les champs qui ne sont pas dans le modèle Prisma
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { openingHours, categories, photos: _photos, images: _images, ...placeData } = validatedData;

    const openingHoursCreate =
      Array.isArray(openingHours) && openingHours.length > 0
        ? openingHours.flatMap(
            (oh: {
              dayOfWeek: DayOfWeek | string;
              isClosed: boolean;
              slots?: { openTime: string | null; closeTime: string | null }[];
              openTime?: string | null;
              closeTime?: string | null;
            }) => {
              const dayOfWeek = String(oh.dayOfWeek).toUpperCase() as DayOfWeek;
              if (oh.isClosed) {
                return [
                  {
                    dayOfWeek,
                    isClosed: true,
                    openTime: null,
                    closeTime: null,
                  },
                ];
              }
              // cas multi-créneaux (pause midi)
              if (Array.isArray(oh.slots) && oh.slots.length > 0) {
                return oh.slots.map(
                  (p: {
                    openTime: string | null;
                    closeTime: string | null;
                  }) => ({
                    dayOfWeek,
                    isClosed: false,
                    openTime: p.openTime ?? null,
                    closeTime: p.closeTime ?? null,
                  })
                );
              }
              // cas simple 1 créneau
              return [
                {
                  dayOfWeek,
                  isClosed: !!oh.isClosed,
                  openTime: oh.openTime ?? null,
                  closeTime: oh.closeTime ?? null,
                },
              ];
            }
          )
        : [];

    // Détermine si c'est une création d'admin pour revendication
    const isAdminCreating = session.user.role === "admin";
    const createForClaimFlag = isAdminCreating && validatedData.createForClaim; // Nouveau paramètre optionnel

    const dataToCreate: Omit<DataToCreate, "images"> & {
      slug: string;
      status: PlaceStatus;
      name: string;
      type: PlaceType;
      street: string;
      postalCode: string;
      city: string;
      owner?: { connect: { id: string } };
      openingHours?: {
        create: Array<{
          dayOfWeek: DayOfWeek;
          isClosed: boolean;
          openTime: string | null;
          closeTime: string | null;
        }>;
      };
      googleBusinessData?: {
        openingHours?: Array<{
          dayOfWeek?: string;
          isClosed?: boolean;
          openTime?: string | null;
          closeTime?: string | null;
          slots?: Array<{
            openTime?: string | null;
            closeTime?: string | null;
          }>;
        }>;
        images?: string[];
        [key: string]: unknown;
      };
    } = {
      ...placeData,
      type: validatedData.type,
      street: validatedData.street,
      postalCode: validatedData.postalCode,
      city: validatedData.city,
      ...Object.fromEntries(
        Object.entries(placeData).filter(
          ([key]) => !["type", "street", "postalCode", "city"].includes(key)
        )
      ),
      slug,
      status: createForClaimFlag ? PlaceStatus.ACTIVE : PlaceStatus.PENDING, // Les fiches admin sont directement actives
    };

    // N'attribuer un propriétaire que si ce n'est pas pour revendication
    if (!createForClaimFlag) {
      dataToCreate.owner = {
        connect: { id: session.user.id },
      };
    }

    if (normalizedPhotos.length > 0) {
      dataToCreate.images = normalizedPhotos;
    }

    // Ne plus attribuer automatiquement la première photo comme image de couverture
    // L'utilisateur doit explicitement choisir son image de couverture
    // if (!dataToCreate.coverImage && normalizedPhotos[0]) {
    //   dataToCreate.coverImage = normalizedPhotos[0];
    // }

    if (!dataToCreate.logo && normalizedPhotos[0]) {
      dataToCreate.logo = normalizedPhotos[0];
    }

    if (openingHoursCreate) {
      dataToCreate.openingHours = { create: openingHoursCreate };
    }

    const googleBusinessData =
      (Array.isArray(openingHours) && openingHours.length > 0) ||
      normalizedPhotos.length > 0
        ? {
            openingHours: (openingHours ?? []).map((oh) => ({ ...oh })) as {
              dayOfWeek?: string;
              isClosed?: boolean;
              openTime?: string | null;
              closeTime?: string | null;
              slots?: Array<{
                openTime?: string | null;
                closeTime?: string | null;
              }>;
            }[],
            images: normalizedPhotos,
          }
        : null;

    if (googleBusinessData) {
      dataToCreate.googleBusinessData = googleBusinessData;
    }
    // Créer la place
    const place = await prisma.place.create({
      data: dataToCreate as Prisma.PlaceCreateInput,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Créer les relations avec les catégories si elles sont spécifiées
    if (categories && Array.isArray(categories) && categories.length > 0) {
      await prisma.placeToCategory.createMany({
        data: categories.map((categoryId) => ({
          placeId: place.id,
          categoryId: categoryId,
        })),
        skipDuplicates: true,
      });
    }

    // Déplacer les fichiers du dossier temporaire vers le dossier final
    try {
      await moveTemporaryFiles(dataToCreate, slug);

      // Mettre à jour la place avec les URLs corrigées si nécessaire
      await prisma.place.update({
        where: { id: place.id },
        data: {
          logo:
            typeof dataToCreate.logo === "string" ? dataToCreate.logo : null,
          coverImage:
            typeof dataToCreate.coverImage === "string"
              ? dataToCreate.coverImage
              : null,
          images: dataToCreate.images,
        },
      });
    } catch (error) {
      console.error(
        "Erreur lors du déplacement des fichiers temporaires:",
        error
      );
      // Continuer même si le déplacement échoue
    }

    // Opening hours are already created via nested create above

    // Attribution automatique des badges
    try {
      await BadgeSystem.onPlaceCreated(session.user.id);
    } catch (error) {
      console.error("Erreur attribution badges:", error);
    }

    // Envoyer notification à l'admin (en arrière-plan)
    if (place.ownerId) {
      notifyAdminsNewPlace(place.name, place.ownerId, session.user.email).catch(
        (error) => {
          console.error("Erreur notification admin:", error);
        }
      );
    }

    return NextResponse.json({ place }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
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
