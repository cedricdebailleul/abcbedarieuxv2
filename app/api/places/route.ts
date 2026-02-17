import { PLACES_ROOT } from "@/lib/path";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { promises as fsp } from "node:fs";
import { join, resolve, dirname, sep, parse } from "node:path";
import { PlaceType } from "@/lib/generated/prisma";
import type { PlaceStatus, Prisma, DayOfWeek } from "@/lib/generated/prisma";
import { triggerPlaceCreationBadges } from "@/lib/services/badge-trigger-service";
import { notifyAdminsNewPlace } from "@/lib/place-notifications";

/* ====================== Utils types ====================== */
type Primitive = string | number | boolean | undefined;
interface DataToCreate {
  logo?: string;
  coverImage?: string;
  images?: string[];
  [key: string]: Primitive | string[];
}

type PlaceIncoming = Partial<{
  name: string;
  title: string;
  placeName: string;
  slug: string;
  urlSlug: string;
  handle: string;
  type: PlaceType | string;
  placeType: PlaceType | string;

  street: string;
  streetNumber?: string;
  address: string;
  addressLine1: string;
  postalCode: string;
  zip: string;
  zipCode: string;
  city: string;
  town: string;
  locality: string;
  latitude?: number | string;
  longitude?: number | string;

  images: string[] | string;
  logo: string;
  coverImage: string;

  isFeatured: boolean | string;
  isVerified: boolean | string;
  status?: PlaceStatus | string; // ignoré si non-admin
  ownerId: string; // ignoré si non-admin

  description?: string;
  summary?: string;
  email?: string;
  phone?: string;
  website?: string;
  googlePlaceId?: string;
  googleMapsUrl?: string;

  // Réseaux sociaux
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;

  categories?: string[];
  openingHours?: Array<{
    dayOfWeek: string;
    isClosed?: boolean;
    openTime?: string | null;
    closeTime?: string | null;
    slots?: { openTime: string; closeTime: string }[];
  }>;
}>;

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asBoolLike(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return undefined;
}

/* ---------------------- Horaires utilitaire ----------------------- */
function toOpeningRows(
  placeId: string,
  openingHours?: Array<{
    dayOfWeek: string;
    isClosed?: boolean;
    openTime?: string | null;
    closeTime?: string | null;
    slots?: { openTime: string; closeTime: string }[];
  }>
) {
  if (!openingHours?.length) return [];

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
      for (const s of item.slots) {
        if (!closed && s?.openTime && s?.closeTime) {
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

  return rows.filter((r) => r.openTime && r.closeTime);
}

/* ====================== Slug & files ====================== */
const SLUG_RE = /^[a-z0-9-]{3,80}$/;
const TEMP_SEGMENT_RE = /\/uploads\/places\/([^/]+)\//i;

function ensureSafeSlug(slug: string) {
  if (!SLUG_RE.test(slug)) throw new Error(`Invalid slug: "${slug}"`);
}
function resolveUnderRoot(slug: string) {
  const root = resolve(PLACES_ROOT(""));
  const abs = resolve(PLACES_ROOT(slug));
  const rootWithSep = root.endsWith(sep) ? root : root + sep;
  if (!abs.startsWith(rootWithSep))
    throw new Error("Resolved path escapes upload root.");
  return abs;
}
function collectTempSlugs(data: DataToCreate): string[] {
  const urls = [
    typeof data.logo === "string" ? data.logo : undefined,
    typeof data.coverImage === "string" ? data.coverImage : undefined,
    ...(Array.isArray(data.images) ? data.images : []),
  ].filter(Boolean) as string[];

  const temps = new Set<string>();
  for (const u of urls) {
    const m = u.match(TEMP_SEGMENT_RE);
    if (!m) continue;
    const seg = m[1];
    if (seg?.toLowerCase().startsWith("temp-")) temps.add(seg);
  }
  return [...temps];
}
function rewriteUrlFromTemp(url: string, tempSlug: string, finalSlug: string) {
  return url.replace(
    new RegExp(`/uploads/places/${tempSlug}/`, "i"),
    `/uploads/places/${finalSlug}/`
  );
}
async function pathExists(p: string) {
  try {
    await fsp.stat(p);
    return true;
  } catch {
    return false;
  }
}
async function moveFileWithCollisionRename(src: string, dest: string) {
  const destDir = dirname(dest);
  const { name, ext } = parse(dest);
  let finalDest = dest;
  let idx = 2;
  while (await pathExists(finalDest)) {
    finalDest = join(destDir, `${name}-${idx}${ext}`);
    idx++;
  }
  await fsp.rename(src, finalDest).catch(async () => {
    await fsp.cp(src, finalDest, { recursive: true, force: true });
    await fsp.rm(src, { recursive: true, force: true });
  });
}
async function moveEntry(
  src: string,
  dest: string,
  onCollision: "overwrite" | "rename" = "overwrite"
) {
  try {
    await fsp.rename(src, dest);
  } catch {
    if (onCollision === "overwrite") {
      await fsp.cp(src, dest, { recursive: true, force: true });
      await fsp.rm(src, { recursive: true, force: true });
    } else {
      try {
        const st = await fsp.stat(src);
        if (st.isDirectory()) {
          await fsp.mkdir(dest, { recursive: true });
          const entries = await fsp.readdir(src, { withFileTypes: true });
          for (const ent of entries) {
            const from = join(src, ent.name);
            const to = join(dest, ent.name);
            await moveEntry(from, to, "rename");
          }
          await fsp.rm(src, { recursive: true, force: true });
        } else {
          await moveFileWithCollisionRename(src, dest);
        }
      } catch {
        await fsp.cp(src, dest, { recursive: true, force: true });
        await fsp.rm(src, { recursive: true, force: true });
      }
    }
  }
}
async function mergeDirContents(
  srcDir: string,
  destDir: string,
  onCollision: "overwrite" | "rename" = "overwrite"
) {
  await fsp.mkdir(destDir, { recursive: true });
  const entries = await fsp.readdir(srcDir, { withFileTypes: true });
  for (const ent of entries) {
    const from = join(srcDir, ent.name);
    const to = join(destDir, ent.name);
    await moveEntry(from, to, onCollision);
  }
}
const __locks = new Map<string, Promise<void>>();
async function withLock(key: string, fn: () => Promise<void>) {
  const prev = __locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const done = new Promise<void>((r) => (release = r));
  __locks.set(
    key,
    prev.then(() => done)
  );
  await prev;
  try {
    await fn();
  } finally {
    release();
  }
}
export async function moveTemporaryFiles(
  dataToCreate: DataToCreate,
  finalSlug: string,
  options?: { onCollision?: "overwrite" | "rename" }
) {
  ensureSafeSlug(finalSlug);
  const tempSlugs = collectTempSlugs(dataToCreate);
  if (tempSlugs.length === 0) return;
  const finalPath = resolveUnderRoot(finalSlug);
  const onCollision = options?.onCollision ?? "overwrite";

  await withLock(finalSlug, async () => {
    for (const tempSlug of tempSlugs) {
      const tempPath = resolveUnderRoot(tempSlug);
      try {
        const st = await fsp.stat(tempPath);
        if (!st.isDirectory()) continue;
      } catch {
        continue;
      }
      const hasFinal = await pathExists(finalPath);
      if (!hasFinal) {
        try {
          await fsp.rename(tempPath, finalPath);
        } catch {
          await mergeDirContents(tempPath, finalPath, onCollision);
          await fsp
            .rm(tempPath, { recursive: true, force: true })
            .catch(() => {});
        }
      } else {
        await mergeDirContents(tempPath, finalPath, onCollision);
        await fsp
          .rm(tempPath, { recursive: true, force: true })
          .catch(() => {});
      }

      if (typeof dataToCreate.logo === "string") {
        dataToCreate.logo = rewriteUrlFromTemp(
          dataToCreate.logo,
          tempSlug,
          finalSlug
        );
      }
      if (typeof dataToCreate.coverImage === "string") {
        dataToCreate.coverImage = rewriteUrlFromTemp(
          dataToCreate.coverImage,
          tempSlug,
          finalSlug
        );
      }
      if (Array.isArray(dataToCreate.images)) {
        dataToCreate.images = dataToCreate.images.map((u) =>
          rewriteUrlFromTemp(u, tempSlug, finalSlug)
        );
      }
    }
  });
}

/* ============================ GET (scopes) ============================ */
/**
 * scope:
 *  - public (default): seulement les places ACTIVE
 *  - mine: places de l’utilisateur connecté (auth requise)
 *  - all: tout (réservé admin)
 *
 * status param (optionnel) est ignoré en scope=public (on force ACTIVE).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id ?? null;
    const role = session?.user?.role ?? "user";
    const isAdmin = role === "admin";

    const url = new URL(req.url);
    const sp = url.searchParams;

    const page = Math.max(1, Number(sp.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? "12")));
    const skip = (page - 1) * limit;

    const statusParam = sp.get("status"); // "ACTIVE" | "PENDING" | "DRAFT" | "INACTIVE" | "all"
    const scope = sp.get("scope") ?? "mine"; // "mine" | "claimable"

    // Base WHERE
    const where: Prisma.PlaceWhereInput = {};

    // Filtre statut (optionnel)
    if (statusParam && statusParam !== "all") {
      where.status = statusParam as PlaceStatus;
    }

    // Filtre portée (mine / claimable)
    if (scope === "claimable") {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Accès non autorisé (claimable réservé aux admins)" },
          { status: 403 }
        );
      }
      // Place à revendiquer = pas de propriétaire
      where.ownerId = null;
    } else {
      // mine (par défaut)
      if (!userId) {
        return NextResponse.json(
          { error: "Authentification requise" },
          { status: 401 }
        );
      }
      where.ownerId = userId;
    }

    const [places, total] = await Promise.all([
      prisma.place.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { id: true, name: true, email: true } },
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
          _count: { select: { reviews: true, favorites: true } },
        },
      }),
      prisma.place.count({ where }),
    ]);

    return NextResponse.json({
      places,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/places failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}

/* ============================ POST (secure) ============================ */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    const isAdmin = safeUserCast(session.user).role === "admin";

    const ct = req.headers.get("content-type") || "";
    let body: PlaceIncoming = {};

    if (ct.includes("application/json")) {
      body = (await req.json()) as PlaceIncoming;
    } else if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const formObj: Record<string, unknown> = {};
      for (const [k, v] of form.entries()) {
        if (typeof v === "string") {
          formObj[k] = v;
        }
      }
      body = formObj as PlaceIncoming;
    } else {
      return NextResponse.json(
        { error: "Content-Type non supporté" },
        { status: 415 }
      );
    }

    // Normalisation champs
    const name = asString(body.name ?? body.title ?? body.placeName);
    let slug = asString(body.slug ?? body.urlSlug ?? body.handle);
    if (!slug && name) {
      slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    const rawType = asString(
      body.type ?? body.placeType ?? "OTHER"
    ).toUpperCase();

    const street = asString(body.street ?? body.address ?? body.addressLine1);
    const postalCode = asString(body.postalCode ?? body.zip ?? body.zipCode);
    const city = asString(body.city ?? body.town ?? body.locality);

    // Géolocalisation
    const latitude = typeof body.latitude === 'number' ? body.latitude :
                     typeof body.latitude === 'string' ? parseFloat(body.latitude) :
                     null;
    const longitude = typeof body.longitude === 'number' ? body.longitude :
                      typeof body.longitude === 'string' ? parseFloat(body.longitude) :
                      null;

    // images (string | array -> array)
    let images: string[] | undefined;
    if (Array.isArray(body.images)) {
      images = body.images.filter((s): s is string => typeof s === "string");
    } else if (typeof body.images === "string") {
      try {
        const parsed = JSON.parse(body.images);
        images = Array.isArray(parsed)
          ? parsed.filter((s): s is string => typeof s === "string")
          : undefined;
      } catch {
        images = undefined;
      }
    }

    const isFeatured = asBoolLike(body.isFeatured) ?? false;
    const isVerified = asBoolLike(body.isVerified) ?? false;

    // Validation minimale
    const missing = [
      "name",
      "slug",
      "type",
      "street",
      "postalCode",
      "city",
    ].filter((k) => {
      const map: Record<string, string> = {
        name,
        slug,
        type: rawType,
        street,
        postalCode,
        city,
      };
      return !String(map[k] || "").trim();
    });
    if (missing.length) {
      return NextResponse.json(
        { error: "Champs requis manquants", missing },
        { status: 422 }
      );
    }
    if (!SLUG_RE.test(slug)) {
      return NextResponse.json(
        { error: "Slug invalide (a-z, 0-9, -, 3..80 caractères)" },
        { status: 422 }
      );
    }

    // Valider le type contre l'enum runtime
    const validTypes = (Object.values(PlaceType) as unknown as string[]).map(
      (v) => v.toUpperCase()
    );
    if (!validTypes.includes(rawType)) {
      return NextResponse.json(
        { error: `Type invalide: ${rawType}` },
        { status: 422 }
      );
    }
    const type = rawType as PlaceType;

    // Statut: l'utilisateur normal ne choisit pas; admin peut forcer
    const status: PlaceStatus = isAdmin
      ? ((body.status as PlaceStatus) ?? "PENDING")
      : "PENDING";

    // Proprio: admin peut définir ownerId, sinon owner = user courant
    // Si body.ownerId est explicitement null (place à revendiquer), on garde null
    const ownerId = isAdmin
      ? (body.ownerId === null ? null : asString(body.ownerId ?? session.user.id ?? "") || null)
      : (session.user.id ?? null);

    // Déplacer fichiers temp -> slug final
    const mutable = {
      logo: body.logo,
      coverImage: body.coverImage,
      images,
    } as DataToCreate;
    await moveTemporaryFiles(mutable, slug, { onCollision: "rename" });

    // images -> JSON pour Prisma
    const imagesJson: Prisma.InputJsonValue | undefined = Array.isArray(
      mutable.images
    )
      ? (mutable.images as unknown as Prisma.JsonArray)
      : undefined;

    try {
      const created = await prisma.place.create({
        data: {
          name,
          slug,
          type,
          street,
          streetNumber: asString(body.streetNumber ?? undefined) || null,
          postalCode,
          city,
          latitude,
          longitude,

          description: asString(body.description ?? undefined) || null,
          summary: asString(body.summary ?? undefined) || null,
          email: asString(body.email ?? undefined) || null,
          phone: asString(body.phone ?? undefined) || null,
          website: asString(body.website ?? undefined) || null,

          logo: mutable.logo ?? null,
          coverImage: mutable.coverImage ?? null,
          ...(imagesJson !== undefined && { images: imagesJson }),

          isFeatured,
          isVerified,
          status,
          ownerId,
          googlePlaceId: asString(body.googlePlaceId ?? undefined) || null,
          googleMapsUrl: asString(body.googleMapsUrl ?? undefined) || null,

          // Réseaux sociaux
          facebook: asString(body.facebook ?? undefined) || null,
          instagram: asString(body.instagram ?? undefined) || null,
          twitter: asString(body.twitter ?? undefined) || null,
          linkedin: asString(body.linkedin ?? undefined) || null,
          tiktok: asString(body.tiktok ?? undefined) || null,
        },
      });

      // Gestion des catégories
      if (Array.isArray(body.categories) && body.categories.length > 0) {
        await prisma.placeToCategory.createMany({
          data: body.categories.map((categoryId) => ({
            placeId: created.id,
            categoryId: categoryId,
          })),
        });
      }

      // Gestion des horaires d'ouverture
      if (Array.isArray(body.openingHours)) {
        const openingRows = toOpeningRows(created.id, body.openingHours);
        if (openingRows.length) {
          await prisma.openingHours.createMany({
            data: openingRows.map((row) => ({
              ...row,
              dayOfWeek: String(row.dayOfWeek).toUpperCase() as DayOfWeek,
            })),
          });
        }
      }

      // Déclencher l'évaluation des badges pour la création de place
      if (ownerId) {
        await triggerPlaceCreationBadges(ownerId, created.id).catch((error) => {
          console.error('Error triggering place creation badges:', error);
          // Ne pas faire échouer la création de place si les badges échouent
        });
      }

      // Notification admin pour nouvelle place en attente de validation
      if (status === "PENDING" && !isAdmin) {
        const userName = session.user.name || session.user.email || "Utilisateur inconnu";
        const userEmail = session.user.email || "";
        await notifyAdminsNewPlace(name, userName, userEmail).catch((error) => {
          console.error('Error sending admin notification:', error);
          // Ne pas faire échouer la création si la notification échoue
        });
      }

      return NextResponse.json(
        { success: true, place: created },
        { status: 201 }
      );
    } catch (err: unknown) {
      // slug unique ?
      if (
        err &&
        typeof err === "object" &&
        (err as Record<string, unknown>)["code"] === "P2002"
      ) {
        return NextResponse.json(
          { error: "Conflit: ce slug existe déjà" },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    console.error("POST /api/places error:", err);
    return NextResponse.json(
      { error: "Failed to create place" },
      { status: 500 }
    );
  }
}
