"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// ⚠️ Adapte si tes enums Prisma sont ailleurs :
import type {
  Prisma,
} from "@/lib/generated/prisma";

import {
  EventStatus,
  RecurrenceFrequency,
  ParticipationStatus,
} from "@/lib/generated/prisma";
import { expandRecurrentEvents } from "@/lib/recurrence";
import { notifyAdminsNewEvent } from "@/lib/content-notifications";

/* =========================================
 *               Types communs
 * =======================================*/

type AdminRole = "admin" | "moderator";
const ADMIN_ROLES: readonly AdminRole[] = ["admin", "moderator"] as const;

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// On ne dépend pas d’un type externe : on borne ce qu’on utilise vraiment
type SessionUser = {
  id: string;
  role?: string | null;
  name?: string | null;
  email?: string | null;
  slug?: string | null;
};

interface EventFormData {
  title: string;
  slug?: string;
  description?: string;
  summary?: string;
  status?: EventStatus;
  isFeatured?: boolean;
  placeId?: string;
  email?: string;
  phone?: string;
  website?: string;
  ticketUrl?: string;
  startDate: string; // ISO
  endDate: string; // ISO
  isAllDay?: boolean;
  timezone?: string;
  locationName?: string;
  locationAddress?: string;
  locationStreet?: string;
  locationStreetNumber?: string;
  locationPostalCode?: string;
  locationCity?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  maxParticipants?: number;
  isFree?: boolean;
  price?: number;
  priceDetails?: string;
  currency?: string;
  coverImage?: string;
  images?: string[]; // Prisma Json
  videos?: string[]; // Prisma Json
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  tags?: string[]; // Prisma Json

  // Catégorie (relation) - on accepte id OU slug
  categoryId?: string | null;
  categorySlug?: string | null;

  // Récurrence
  isRecurring?: boolean;
  recurrence?: {
    frequency: RecurrenceFrequency;
    interval: number;
    count?: number;
    until?: string; // ISO (fin de journée appliquée)
    byWeekDay?: number[];
    byMonthDay?: number[];
    byMonth?: number[];
    exceptions?: string[];
    workdaysOnly?: boolean;
  };
}

/* =========================================
 *         Types d’occurrence (recurrence)
 * =======================================*/

// Forme minimale échangée avec expandRecurrentEvents()
type RecurrenceRuleIO = {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval?: number;
  count?: number;
  until?: string; // ISO
  byWeekDay?: number[];
  byMonthDay?: number[];
  byMonth?: number[];
  exceptions?: string[];
  workdaysOnly?: boolean;
};

type ExpandableEvent = {
  id: string;
  startDate: string; // ISO
  endDate: string; // ISO
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRuleIO;
};

type ExpandedOccurrence = {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  occurrenceId?: string;
  isRecurrenceOccurrence?: boolean;
  originalEventId?: string;
  recurrenceRule?: RecurrenceRuleIO;
};

/* =========================================
 *          Gardiens de type (JSON)
 * =======================================*/

// Tags simples si tu stockes un JSON libre (sinon adapte à ta table pivot)
type SimpleTag = {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
};

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isNumberArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every((x) => typeof x === "number");
}

function isSimpleTag(o: unknown): o is SimpleTag {
  if (!o || typeof o !== "object") return false;
  const x = o as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.name === "string" &&
    typeof x.slug === "string" &&
    (typeof x.color === "string" || x.color === null || x.color === undefined)
  );
}

/* =========================================
 *             Auth + rôles typés
 * =======================================*/

async function checkAuth(): Promise<{ user: SessionUser }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || typeof session.user.id !== "string") {
    throw new Error("Authentification requise");
  }
  
  // Récupérer le rôle depuis la base de données
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, slug: true },
  });
  
  // On borne aux champs utilisés
  const user: SessionUser = {
    id: session.user.id,
    role: dbUser?.role ?? null,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    slug: dbUser?.slug ?? null,
  };
  return { user };
}

function isAdminRole(role: string | null | undefined): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

/* =========================================
 *               Génération slug
 * =======================================*/

async function generateUniqueSlug(
  title: string,
  eventId?: string
): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-|-$/g, "");

  let slug = baseSlug;
  let counter = 1;

  // boucle typée

  while (true) {
    const existingEvent = await prisma.event.findFirst({
      where: {
        slug,
        ...(eventId
          ? ({ id: { not: eventId } } as Prisma.EventWhereInput)
          : {}),
      },
      select: { id: true },
    });
    if (!existingEvent) break;
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}

/* =========================================
 *         Résolution catégorie (relation)
 * =======================================*/

async function resolveCategoryId(input: {
  categoryId?: string | null;
  categorySlug?: string | null;
}): Promise<string | null | undefined> {
  if (input.categoryId === null || input.categorySlug === null) return null; // vider relation
  if (typeof input.categoryId === "string") return input.categoryId;
  if (typeof input.categorySlug === "string" && input.categorySlug.length > 0) {
    const cat = await prisma.category.findUnique({
      where: { slug: input.categorySlug },
      select: { id: true },
    });
    return cat?.id ?? undefined; // undefined => pas de changement
  }
  return undefined;
}

/* =========================================
 *                  CREATE
 * =======================================*/

export async function createEventAction(
  data: EventFormData
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const { user } = await checkAuth();

    const slug = await generateUniqueSlug(data.title);
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate < startDate) {
      return {
        success: false,
        error: "La date de fin doit être après la date de début",
      };
    }

    const categoryId = await resolveCategoryId({
      categoryId: data.categoryId,
      categorySlug: data.categorySlug,
    });

    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        summary: data.summary,
        status: data.status ?? EventStatus.DRAFT,
        isPublished:
          (data.status ?? EventStatus.DRAFT) === EventStatus.PUBLISHED,
        isFeatured: data.isFeatured ?? false,
        organizerId: user.id,
        placeId: data.placeId,
        email: data.email,
        phone: data.phone,
        website: data.website,
        ticketUrl: data.ticketUrl,
        startDate,
        endDate,
        isAllDay: data.isAllDay ?? false,
        timezone: data.timezone || "Europe/Paris",
        locationName: data.locationName,
        locationAddress: data.locationAddress,
        locationStreet: data.locationStreet,
        locationStreetNumber: data.locationStreetNumber,
        locationPostalCode: data.locationPostalCode,
        locationCity: data.locationCity,
        locationLatitude: data.locationLatitude,
        locationLongitude: data.locationLongitude,
        googlePlaceId: data.googlePlaceId,
        googleMapsUrl: data.googleMapsUrl,
        maxParticipants: data.maxParticipants,
        isFree: data.isFree ?? true,
        price: data.price,
        priceDetails: data.priceDetails,
        currency: data.currency || "EUR",
        coverImage: data.coverImage,
        images: data.images, // Json
        videos: data.videos, // Json
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        ogImage: data.ogImage,
        facebook: data.facebook,
        instagram: data.instagram,
        twitter: data.twitter,
        linkedin: data.linkedin,
        tiktok: data.tiktok,
        tags: data.tags, // Json
        isRecurring: data.isRecurring ?? false,
        ...(categoryId !== undefined && { categoryId }),
      },
      select: { id: true, slug: true, isRecurring: true },
    });

    if (data.isRecurring && data.recurrence) {
      const recurrenceRule = await prisma.recurrenceRule.create({
        data: {
          frequency: data.recurrence.frequency,
          interval: data.recurrence.interval,
          count: data.recurrence.count,
          until: data.recurrence.until
            ? new Date(data.recurrence.until + "T23:59:59")
            : undefined,
          byWeekDay: data.recurrence.byWeekDay,
          byMonthDay: data.recurrence.byMonthDay,
          byMonth: data.recurrence.byMonth,
          exceptions: data.recurrence.exceptions,
          workdaysOnly: data.recurrence.workdaysOnly ?? false,
        },
        select: { id: true },
      });

      await prisma.event.update({
        where: { id: event.id },
        data: { recurrenceRuleId: recurrenceRule.id },
        select: { id: true },
      });
    }

    revalidatePath("/dashboard/events");
    revalidatePath("/events");

    // Notification admin pour nouvel événement en attente de validation
    if ((data.status ?? EventStatus.DRAFT) === EventStatus.DRAFT && !isAdminRole(user.role)) {
      const userName = user.name || user.email || "Utilisateur inconnu";
      const userEmail = user.email || "";
      await notifyAdminsNewEvent(data.title, userName, userEmail).catch((error) => {
        console.error('Error sending admin notification:', error);
        // Ne pas faire échouer la création si la notification échoue
      });
    }

    return { success: true, data: { id: event.id, slug: event.slug } };
  } catch (e) {
    const error = e as Error;
    console.error("Erreur lors de la création de l'événement:", error);
    return { success: false, error: error.message };
  }
}

/* =========================================
 *                  UPDATE
 * =======================================*/

export async function updateEventAction(
  eventId: string,
  data: Partial<EventFormData>
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const { user } = await checkAuth();

    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        OR: isAdminRole(user.role)
          ? [{} as Prisma.EventWhereInput, { organizerId: user.id }]
          : [{ organizerId: user.id }],
      },
      include: { recurrenceRule: true },
    });

    if (!existingEvent) {
      return {
        success: false,
        error: "Événement introuvable ou accès non autorisé",
      };
    }

    let slug = existingEvent.slug;
    if (data.title && data.title !== existingEvent.title) {
      slug = await generateUniqueSlug(data.title, eventId);
    }

    let startDate = existingEvent.startDate;
    let endDate = existingEvent.endDate;
    if (data.startDate !== undefined) startDate = new Date(data.startDate);
    if (data.endDate !== undefined) endDate = new Date(data.endDate);
    if (endDate < startDate) {
      return {
        success: false,
        error: "La date de fin doit être après la date de début",
      };
    }

    const categoryId = await resolveCategoryId({
      categoryId: data.categoryId,
      categorySlug: data.categorySlug,
    });

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title !== undefined && { title: data.title, slug }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.status !== undefined && {
          status: data.status,
          isPublished: data.status === EventStatus.PUBLISHED,
        }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.placeId !== undefined && { placeId: data.placeId }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.ticketUrl !== undefined && { ticketUrl: data.ticketUrl }),
        ...(data.startDate !== undefined && { startDate }),
        ...(data.endDate !== undefined && { endDate }),
        ...(data.isAllDay !== undefined && { isAllDay: data.isAllDay }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.locationName !== undefined && {
          locationName: data.locationName,
        }),
        ...(data.locationAddress !== undefined && {
          locationAddress: data.locationAddress,
        }),
        ...(data.locationStreet !== undefined && {
          locationStreet: data.locationStreet,
        }),
        ...(data.locationStreetNumber !== undefined && {
          locationStreetNumber: data.locationStreetNumber,
        }),
        ...(data.locationPostalCode !== undefined && {
          locationPostalCode: data.locationPostalCode,
        }),
        ...(data.locationCity !== undefined && {
          locationCity: data.locationCity,
        }),
        ...(data.locationLatitude !== undefined && {
          locationLatitude: data.locationLatitude,
        }),
        ...(data.locationLongitude !== undefined && {
          locationLongitude: data.locationLongitude,
        }),
        ...(data.googlePlaceId !== undefined && {
          googlePlaceId: data.googlePlaceId,
        }),
        ...(data.googleMapsUrl !== undefined && {
          googleMapsUrl: data.googleMapsUrl,
        }),
        ...(data.maxParticipants !== undefined && {
          maxParticipants: data.maxParticipants,
        }),
        ...(data.isFree !== undefined && { isFree: data.isFree }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.priceDetails !== undefined && {
          priceDetails: data.priceDetails,
        }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.images !== undefined && { images: data.images }),
        ...(data.videos !== undefined && { videos: data.videos }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && {
          metaDescription: data.metaDescription,
        }),
        ...(data.ogImage !== undefined && { ogImage: data.ogImage }),
        ...(data.facebook !== undefined && { facebook: data.facebook }),
        ...(data.instagram !== undefined && { instagram: data.instagram }),
        ...(data.twitter !== undefined && { twitter: data.twitter }),
        ...(data.linkedin !== undefined && { linkedin: data.linkedin }),
        ...(data.tiktok !== undefined && { tiktok: data.tiktok }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(categoryId !== undefined && { categoryId }),
        ...(data.isRecurring !== undefined && {
          isRecurring: data.isRecurring,
        }),
      },
      select: { id: true, slug: true, recurrenceRuleId: true },
    });

    if (data.isRecurring !== undefined) {
      if (data.isRecurring && data.recurrence) {
        if (existingEvent.recurrenceRuleId) {
          await prisma.recurrenceRule.update({
            where: { id: existingEvent.recurrenceRuleId },
            data: {
              frequency: data.recurrence.frequency,
              interval: data.recurrence.interval,
              count: data.recurrence.count,
              until: data.recurrence.until
                ? new Date(data.recurrence.until + "T23:59:59")
                : undefined,
              byWeekDay: data.recurrence.byWeekDay,
              byMonthDay: data.recurrence.byMonthDay,
              byMonth: data.recurrence.byMonth,
              exceptions: data.recurrence.exceptions,
              workdaysOnly: data.recurrence.workdaysOnly ?? false,
            },
            select: { id: true },
          });
        } else {
          const created = await prisma.recurrenceRule.create({
            data: {
              frequency: data.recurrence.frequency,
              interval: data.recurrence.interval,
              count: data.recurrence.count,
              until: data.recurrence.until
                ? new Date(data.recurrence.until + "T23:59:59")
                : undefined,
              byWeekDay: data.recurrence.byWeekDay,
              byMonthDay: data.recurrence.byMonthDay,
              byMonth: data.recurrence.byMonth,
              exceptions: data.recurrence.exceptions,
              workdaysOnly: data.recurrence.workdaysOnly ?? false,
            },
            select: { id: true },
          });
          await prisma.event.update({
            where: { id: eventId },
            data: { recurrenceRuleId: created.id },
            select: { id: true },
          });
        }
      } else if (!data.isRecurring && existingEvent.recurrenceRuleId) {
        await prisma.recurrenceRule.delete({
          where: { id: existingEvent.recurrenceRuleId },
        });
        await prisma.event.update({
          where: { id: eventId },
          data: { recurrenceRuleId: null },
          select: { id: true },
        });
      }
    }

    revalidatePath("/dashboard/events");
    revalidatePath("/events");
    revalidatePath(`/events/${updated.slug}`);

    return { success: true, data: { id: updated.id, slug: updated.slug } };
  } catch (e) {
    const error = e as Error;
    console.error("Erreur lors de la modification de l'événement:", error);
    return { success: false, error: error.message };
  }
}

/* =========================================
 *                  DELETE
 * =======================================*/

export async function deleteEventAction(
  eventId: string
): Promise<ActionResult> {
  try {
    const { user } = await checkAuth();

    const existing = await prisma.event.findFirst({
      where: {
        id: eventId,
        OR: isAdminRole(user.role)
          ? [{} as Prisma.EventWhereInput, { organizerId: user.id }]
          : [{ organizerId: user.id }],
      },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        error: "Événement introuvable ou accès non autorisé",
      };
    }

    await prisma.event.delete({ where: { id: eventId } });

    revalidatePath("/dashboard/events");
    revalidatePath("/events");

    return { success: true };
  } catch (e) {
    const error = e as Error;
    console.error("Erreur lors de la suppression de l'événement:", error);
    return { success: false, error: error.message };
  }
}

/* =========================================
 *             ÉVÉNEMENTS (USER)
 * =======================================*/

export async function getUserEventsAction(options?: {
  page?: number;
  limit?: number;
  status?: EventStatus;
}): Promise<
  ActionResult<{
    events: {
      id: string;
      title: string;
      slug: string;
      startDate: Date;
      endDate: Date;
      place?: { id: string; name: string; slug: string; city: string };
      participantCount: number;
    }[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>
> {
  try {
    const { user } = await checkAuth();
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 12;
    const offset = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      organizerId: user.id,
      ...(options?.status ? { status: options.status } : {}),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          place: { select: { id: true, name: true, slug: true, city: true } },
          _count: { select: { participants: true } },
        },
        orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return {
      success: true,
      data: {
        events: events.map((e) => ({
          id: e.id,
          title: e.title,
          slug: e.slug,
          startDate: e.startDate,
          endDate: e.endDate,
          place: e.place || undefined,
          participantCount: e._count.participants,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (e) {
    const error = e as Error;
    console.error("Erreur lors de la récupération des événements:", error);
    return { success: false, error: error.message };
  }
}

/* =========================================
 *      PROCHAINS ÉVÉNEMENTS (Slider)
 * =======================================*/

export async function getUpcomingEventsAction(limit: number = 5): Promise<
  ActionResult<
    {
      id: string;
      title: string;
      startDate: Date;
      endDate: Date;
      place?: {
        name: string;
        street: string;
        city: string;
        latitude: number;
        longitude: number;
      };
    }[]
  >
> {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        isActive: true,
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
      take: limit,
      include: {
        place: {
          select: {
            name: true,
            street: true,
            city: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    return {
      success: true,
      data: events.map((e) => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        place: e.place
          ? {
              name: e.place.name,
              street: e.place.street,
              city: e.place.city,
              latitude: e.place.latitude ?? 0,
              longitude: e.place.longitude ?? 0,
            }
          : undefined,
      })),
    };
  } catch (e) {
    const error = e as Error;
    console.error("Erreur lors des événements à venir:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des événements",
      data: [],
    };
  }
}

/* =========================================
 *        LISTE PUBLIQUE (+ récurrences)
 * =======================================*/

export async function getPublicEventsAction(options?: {
  startDate?: string;
  endDate?: string;
  city?: string;
  placeId?: string;
  categorySlug?: string;
  limit?: number;
}): Promise<
  ActionResult<
    {
      id: string;
      title: string;
      startDate: Date;
      endDate: Date;
      isAllDay: boolean;
      isFeatured: boolean;
      isFree: boolean;
      place?: { id: string; name: string; slug: string; city: string };
      organizer?: { id: string; name: string; slug: string };
      recurrenceRule?: {
        frequency: RecurrenceFrequency;
        interval: number;
        count?: number;
        until?: Date;
        byWeekDay?: number[];
        byMonthDay?: number[];
        byMonth?: number[];
        exceptions?: string[];
        workdaysOnly?: boolean;
      };
      participantCount: number;
      _count: { participants: number };
      occurrenceId?: string;
      isRecurrenceOccurrence?: boolean;
      originalEventId?: string;
      category: {
        id: string;
        name: string;
        slug: string;
        color?: string | null;
      } | null;
    }[]
  >
> {
  try {
    const limit = options?.limit ?? 100;
    const start = options?.startDate ? new Date(options.startDate) : undefined;
    const end = options?.endDate ? new Date(options.endDate) : undefined;

    const categoryId =
      options?.categorySlug !== undefined
        ? await resolveCategoryId({ categorySlug: options.categorySlug })
        : undefined;

    const where: Prisma.EventWhereInput = {
      status: EventStatus.PUBLISHED,
      isActive: true,
      ...(start && end
        ? { AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }] }
        : start
        ? { endDate: { gte: start } }
        : end
        ? { startDate: { lte: end } }
        : {}),
      ...(options?.city ? { locationCity: options.city } : {}),
      ...(options?.placeId ? { placeId: options.placeId } : {}),
      ...(categoryId ? { categoryId } : {}),
    };

    const events = await prisma.event.findMany({
      where,
      include: {
        place: { select: { id: true, name: true, slug: true, city: true } },
        organizer: { select: { id: true, name: true, slug: true } },
        recurrenceRule: true,
        _count: { select: { participants: true } },
        // removed 'category' include because EventInclude<DefaultArgs> doesn't define it
      },
      orderBy: [
        { isFeatured: "desc" },
        { startDate: "asc" },
        { createdAt: "desc" },
      ],
      take: 1000,
    });

    // load categories separately and map them by id
    const categoryIds = Array.from(
      new Set(
        events
          .map((e) => (e as unknown as { categoryId?: string }).categoryId)
          .filter((id): id is string => typeof id === "string")
      )
    );
    const categories =
      categoryIds.length > 0
        ? await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, slug: true, color: true },
          })
        : [];
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const rangeStart = start ?? new Date();
    const rangeEnd = end ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const eventsForExpansion: ExpandableEvent[] = events.map((e) => ({
      id: e.id,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
      isRecurring: e.isRecurring,
      recurrenceRule: e.recurrenceRule
        ? {
            frequency: e.recurrenceRule
              .frequency as RecurrenceRuleIO["frequency"],
            interval: e.recurrenceRule.interval,
            count: e.recurrenceRule.count ?? undefined,
            until: e.recurrenceRule.until?.toISOString(),
            byWeekDay: isNumberArray(e.recurrenceRule.byWeekDay)
              ? e.recurrenceRule.byWeekDay
              : undefined,
            byMonthDay: isNumberArray(e.recurrenceRule.byMonthDay)
              ? e.recurrenceRule.byMonthDay
              : undefined,
            byMonth: isNumberArray(e.recurrenceRule.byMonth)
              ? e.recurrenceRule.byMonth
              : undefined,
            exceptions: isStringArray(e.recurrenceRule.exceptions)
              ? e.recurrenceRule.exceptions
              : undefined,
            workdaysOnly: e.recurrenceRule.workdaysOnly,
          }
        : undefined,
    }));

    // expand occurrences in the requested range
    const expanded: ExpandedOccurrence[] = expandRecurrentEvents(
      eventsForExpansion,
      rangeStart,
      rangeEnd
    );

    // keep chronological order and limit results
    expanded.sort(
      (a, b) =>
        new Date(
          typeof a.startDate === "string" ? a.startDate : a.startDate
        ).getTime() -
        new Date(
          typeof b.startDate === "string" ? b.startDate : b.startDate
        ).getTime()
    );

    const finalEvents = expanded.slice(0, limit).map((occ) => {
      const original = events.find((ev) => ev.id === occ.id)!;

      const recurrenceRule = occ.recurrenceRule && {
        frequency: occ.recurrenceRule.frequency as RecurrenceFrequency,
        interval: (occ.recurrenceRule.interval ?? 1) as number,
        count: occ.recurrenceRule.count,
        until: occ.recurrenceRule.until
          ? new Date(occ.recurrenceRule.until)
          : undefined,
        byWeekDay: occ.recurrenceRule.byWeekDay,
        byMonthDay: occ.recurrenceRule.byMonthDay,
        byMonth: occ.recurrenceRule.byMonth,
        exceptions: occ.recurrenceRule.exceptions,
        workdaysOnly: occ.recurrenceRule.workdaysOnly,
      };

      const originalCategoryId = (
        original as unknown as { categoryId?: string }
      ).categoryId;

      return {
        id: occ.id,
        title: original.title,
        slug: original.slug,
        startDate:
          typeof occ.startDate === "string"
            ? new Date(occ.startDate)
            : new Date(occ.startDate),
        endDate:
          typeof occ.endDate === "string"
            ? new Date(occ.endDate)
            : new Date(occ.endDate),
        isAllDay: original.isAllDay ?? false,
        isFeatured: original.isFeatured ?? false,
        isFree: original.isFree ?? true,
        place: original.place ?? undefined,
        organizer: original.organizer?.slug
          ? {
              id: original.organizer.id,
              name: original.organizer.name,
              slug: original.organizer.slug,
            }
          : undefined,
        recurrenceRule,
        participantCount: original._count.participants,
        _count: { participants: original._count.participants },
        ...(occ.occurrenceId ? { occurrenceId: occ.occurrenceId } : {}),
        ...(occ.isRecurrenceOccurrence !== undefined
          ? { isRecurrenceOccurrence: occ.isRecurrenceOccurrence }
          : {}),
        ...(occ.originalEventId
          ? { originalEventId: occ.originalEventId }
          : {}),
        category: originalCategoryId
          ? categoryMap.get(originalCategoryId) ?? null
          : null,
      };
    });

    return { success: true, data: finalEvents };
  } catch (e) {
    const error = e as Error;
    console.error(
      "Erreur lors de la récupération des événements publics:",
      error
    );
    return { success: false, error: error.message };
  }
}

/* =========================================
 *     DÉTAIL PAR SLUG (+ occurrences 6 mois)
 * =======================================*/

export async function getEventBySlugAction(slug: string): Promise<
  ActionResult<{
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    content?: string | null;
    summary?: string | null;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    timezone: string;
    maxParticipants?: number | null;
    isFree: boolean;
    price?: number | null;
    currency?: string | null;
    priceDetails?: string | null;
    isFeatured?: boolean;
    coverImage?: string | null;
    logo?: string | null;
    images?: string[] | null;
    videos?: string[] | null;
    locationName?: string | null;
    locationAddress?: string | null;
    locationStreet?: string | null;
    locationStreetNumber?: string | null;
    locationPostalCode?: string | null;
    locationCity?: string | null;
    locationLatitude?: number | null;
    locationLongitude?: number | null;
    googlePlaceId?: string | null;
    googleMapsUrl?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    ticketUrl?: string | null;
    waitingList?: boolean;
    facebook?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
    isRecurring: boolean;
    recurrenceRule?: {
      frequency: RecurrenceFrequency;
      interval: number;
      count?: number;
      until?: Date;
      byWeekDay?: number[];
      byMonthDay?: number[];
      byMonth?: number[];
      exceptions?: string[];
      workdaysOnly?: boolean;
    };
    category: {
      id: string;
      name: string;
      slug: string;
      color?: string | null;
    } | null;
    organizer?: {
      name: string;
      email: string;
      slug: string | null;
      profile?: {
        firstname: string | null;
        lastname: string | null;
        bio: string | null;
        phone: string | null;
        socials: string | null;
        isPublic: boolean;
        showEmail: boolean;
        showPhone: boolean;
      } | null;
    } | null;
    place?: {
      id: string;
      name: string;
      slug: string;
      city: string;
      street: string;
      postalCode: string;
      latitude: number;
      longitude: number;
    };
    participants: { user: { name: string; slug: string } }[];
    tags?: Array<{ tag: SimpleTag }>;
    _count: { participants: number };
    occurrences?: { startDate: Date; endDate: Date; isOriginal: boolean }[];
  }>
> {
  try {
    const event = await prisma.event.findFirst({
      where: { slug, status: EventStatus.PUBLISHED, isActive: true },
      include: {
        organizer: {
          select: {
            name: true,
            email: true,
            slug: true,
            profile: {
              select: {
                firstname: true,
                lastname: true,
                bio: true,
                phone: true,
                socials: true,
                isPublic: true,
                showEmail: true,
                showPhone: true,
              },
            },
          },
        },
        place: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            street: true,
            postalCode: true,
            latitude: true,
            longitude: true,
          },
        },
        recurrenceRule: true,
        participants: {
          include: { user: { select: { name: true, slug: true } } },
          orderBy: { registeredAt: "desc" },
          take: 10,
        },
        _count: { select: { participants: true } },
      },
    });

    if (!event) return { success: false, error: "Événement introuvable" };

    let occurrences:
      | { startDate: Date; endDate: Date; isOriginal: boolean }[]
      | undefined;

    if (event.isRecurring && event.recurrenceRule) {
      const now = new Date();
      const sixMonthsLater = new Date();
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

      const expanded: ExpandedOccurrence[] = expandRecurrentEvents(
        [
          {
            id: event.id,
            startDate: event.startDate.toISOString(),
            endDate: event.endDate.toISOString(),
            isRecurring: event.isRecurring,
            recurrenceRule: {
              frequency: event.recurrenceRule
                .frequency as RecurrenceRuleIO["frequency"],
              interval: event.recurrenceRule.interval,
              count: event.recurrenceRule.count ?? undefined,
              until: event.recurrenceRule.until?.toISOString(),
              byWeekDay: isNumberArray(event.recurrenceRule.byWeekDay)
                ? event.recurrenceRule.byWeekDay
                : undefined,
              byMonthDay: isNumberArray(event.recurrenceRule.byMonthDay)
                ? event.recurrenceRule.byMonthDay
                : undefined,
              byMonth: isNumberArray(event.recurrenceRule.byMonth)
                ? event.recurrenceRule.byMonth
                : undefined,
              exceptions: isStringArray(event.recurrenceRule.exceptions)
                ? event.recurrenceRule.exceptions
                : undefined,
              workdaysOnly: event.recurrenceRule.workdaysOnly,
            },
          },
        ],
        now,
        sixMonthsLater
      );

      occurrences = expanded.map((e) => ({
        startDate: new Date(e.startDate),
        endDate: new Date(e.endDate),
        isOriginal: !e.isRecurrenceOccurrence,
      }));
    }

    const category = (event as unknown as { categoryId?: string }).categoryId
      ? await prisma.category.findUnique({
          where: {
            id: (event as unknown as { categoryId: string }).categoryId,
          },
          select: { id: true, name: true, slug: true, color: true },
        })
      : null;

    // Normalisation JSON strictement typée
    const images =
      event.images && isStringArray(event.images) ? event.images : null;
    const videos =
      event.videos && isStringArray(event.videos) ? event.videos : null;

    const tagsArray =
      Array.isArray(event.tags) && event.tags.every(isSimpleTag)
        ? (event.tags as SimpleTag[]).map((t) => ({ tag: t }))
        : undefined;

    const organizer = event.organizer
      ? {
          ...event.organizer,
          profile: event.organizer.profile
            ? {
                ...event.organizer.profile,
                socials:
                  typeof event.organizer.profile.socials === "string"
                    ? event.organizer.profile.socials
                    : event.organizer.profile.socials
                    ? JSON.stringify(event.organizer.profile.socials)
                    : null,
              }
            : null,
        }
      : null;

    const place = event.place
      ? {
          id: event.place.id,
          name: event.place.name,
          slug: event.place.slug,
          city: event.place.city,
          street: event.place.street,
          postalCode: event.place.postalCode,
          latitude: event.place.latitude ?? 0,
          longitude: event.place.longitude ?? 0,
        }
      : undefined;

    const recurrenceRule =
      event.recurrenceRule &&
      ({
        frequency: event.recurrenceRule.frequency,
        interval: event.recurrenceRule.interval,
        count: event.recurrenceRule.count ?? undefined,
        until: event.recurrenceRule.until ?? undefined,
        byWeekDay: isNumberArray(event.recurrenceRule.byWeekDay)
          ? event.recurrenceRule.byWeekDay
          : undefined,
        byMonthDay: isNumberArray(event.recurrenceRule.byMonthDay)
          ? event.recurrenceRule.byMonthDay
          : undefined,
        byMonth: isNumberArray(event.recurrenceRule.byMonth)
          ? event.recurrenceRule.byMonth
          : undefined,
        exceptions: isStringArray(event.recurrenceRule.exceptions)
          ? event.recurrenceRule.exceptions
          : undefined,
        workdaysOnly: event.recurrenceRule.workdaysOnly,
      } as const);

    return {
      success: true,
      data: {
        ...event,
        images,
        videos,
        place,
        organizer,
        category: category ?? null,
        tags: tagsArray,
        occurrences,
        participants: event.participants
          .filter((p) => p.user.slug !== null)
          .map((p) => ({ user: { name: p.user.name, slug: p.user.slug! } })),
        recurrenceRule: recurrenceRule ?? undefined,
      },
    };
  } catch (e) {
    const error = e as Error;
    console.error("Erreur lors de la récupération de l'événement:", error);
    return { success: false, error: error.message };
  }
}

/* =========================================
 *          PARTICIPER À UN ÉVÉNEMENT
 * =======================================*/

export async function participateInEventAction(
  eventId: string,
  status: ParticipationStatus = ParticipationStatus.GOING,
  guestCount: number = 0,
  specialNeeds?: string
): Promise<ActionResult<{ participationId: string }>> {
  try {
    const { user } = await checkAuth();

    const event = await prisma.event.findFirst({
      where: { id: eventId, status: EventStatus.PUBLISHED, isActive: true },
      select: {
        id: true,
        slug: true,
        maxParticipants: true,
        waitingList: true,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Événement introuvable ou non disponible",
      };
    }

    if (event.maxParticipants) {
      const current = await prisma.eventParticipant.count({
        where: {
          eventId,
          status: {
            in: [ParticipationStatus.GOING, ParticipationStatus.WAITLISTED],
          },
        },
      });

      if (current >= event.maxParticipants && !event.waitingList) {
        return { success: false, error: "Événement complet" };
      }
    }

    const participation = await prisma.eventParticipant.upsert({
      where: { eventId_userId: { eventId, userId: user.id } },
      update: { status, guestCount, specialNeeds },
      create: { eventId, userId: user.id, status, guestCount, specialNeeds },
      select: { id: true },
    });

    const total = await prisma.eventParticipant.count({
      where: {
        eventId,
        status: {
          in: [ParticipationStatus.GOING, ParticipationStatus.WAITLISTED],
        },
      },
    });

    await prisma.event.update({
      where: { id: eventId },
      data: { participantCount: total },
      select: { id: true },
    });

    revalidatePath(`/events/${event.slug}`);
    revalidatePath("/dashboard/events");

    return { success: true, data: { participationId: participation.id } };
  } catch (e) {
    const error = e as Error;
    console.error("Erreur lors de l'inscription à l'événement:", error);
    return { success: false, error: error.message };
  }
}
