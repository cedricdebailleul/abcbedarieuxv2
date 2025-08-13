"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { 
  EventStatus, 
  EventCategory,
  RecurrenceFrequency, 
  ParticipationStatus,
  type Event,
  type RecurrenceRule 
} from "@/lib/generated/prisma";

// Types pour les réponses
type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Utilitaire pour vérifier l'authentification
async function checkAuth() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new Error("Authentification requise");
  }

  return { user: session.user };
}

// Types pour les données d'événement
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
  startDate: string; // ISO string
  endDate: string; // ISO string
  isAllDay?: boolean;
  timezone?: string;
  locationName?: string;
  locationAddress?: string;
  locationCity?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  maxParticipants?: number;
  isFree?: boolean;
  price?: number;
  priceDetails?: string;
  currency?: string;
  coverImage?: string;
  images?: string[];
  videos?: string[];
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  tags?: string[];
  category?: EventCategory;
  // Récurrence
  isRecurring?: boolean;
  recurrence?: {
    frequency: RecurrenceFrequency;
    interval: number;
    count?: number;
    until?: string; // ISO string
    byWeekDay?: number[];
    byMonthDay?: number[];
    byMonth?: number[];
    exceptions?: string[];
    workdaysOnly?: boolean;
  };
}

// Générer un slug unique
async function generateUniqueSlug(title: string, eventId?: string): Promise<string> {
  let baseSlug = title
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

  while (true) {
    const existingEvent = await prisma.event.findFirst({
      where: {
        slug: slug,
        ...(eventId && { id: { not: eventId } })
      }
    });

    if (!existingEvent) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// Créer un événement
export async function createEventAction(data: EventFormData): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const { user } = await checkAuth();

    // Générer slug unique
    const slug = await generateUniqueSlug(data.title);

    // Validation des dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    if (endDate < startDate) {
      return {
        success: false,
        error: "La date de fin doit être après la date de début"
      };
    }

    // Créer l'événement
    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        summary: data.summary,
        status: data.status || EventStatus.DRAFT,
        isPublished: data.status === EventStatus.PUBLISHED,
        isFeatured: data.isFeatured || false,
        organizerId: user.id,
        placeId: data.placeId,
        email: data.email,
        phone: data.phone,
        website: data.website,
        ticketUrl: data.ticketUrl,
        startDate,
        endDate,
        isAllDay: data.isAllDay || false,
        timezone: data.timezone || "Europe/Paris",
        locationName: data.locationName,
        locationAddress: data.locationAddress,
        locationCity: data.locationCity,
        locationLatitude: data.locationLatitude,
        locationLongitude: data.locationLongitude,
        maxParticipants: data.maxParticipants,
        isFree: data.isFree ?? true,
        price: data.price,
        priceDetails: data.priceDetails,
        currency: data.currency || "EUR",
        coverImage: data.coverImage,
        images: data.images ? JSON.stringify(data.images) : null,
        videos: data.videos ? JSON.stringify(data.videos) : null,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        ogImage: data.ogImage,
        facebook: data.facebook,
        instagram: data.instagram,
        twitter: data.twitter,
        linkedin: data.linkedin,
        tiktok: data.tiktok,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        category: data.category,
        isRecurring: data.isRecurring || false
      }
    });

    // Créer la règle de récurrence si nécessaire
    if (data.isRecurring && data.recurrence) {
      const recurrenceRule = await prisma.recurrenceRule.create({
        data: {
          frequency: data.recurrence.frequency,
          interval: data.recurrence.interval,
          count: data.recurrence.count,
          until: data.recurrence.until ? new Date(data.recurrence.until) : undefined,
          byWeekDay: data.recurrence.byWeekDay ? JSON.stringify(data.recurrence.byWeekDay) : null,
          byMonthDay: data.recurrence.byMonthDay ? JSON.stringify(data.recurrence.byMonthDay) : null,
          byMonth: data.recurrence.byMonth ? JSON.stringify(data.recurrence.byMonth) : null,
          exceptions: data.recurrence.exceptions ? JSON.stringify(data.recurrence.exceptions) : null,
          workdaysOnly: data.recurrence.workdaysOnly || false,
        }
      });

      // Mettre à jour l'événement avec la règle
      await prisma.event.update({
        where: { id: event.id },
        data: { recurrenceRuleId: recurrenceRule.id }
      });
    }

    // Revalider les pages concernées
    revalidatePath("/dashboard/events");
    revalidatePath("/events");

    return {
      success: true,
      data: { id: event.id, slug: event.slug }
    };

  } catch (error) {
    console.error("Erreur lors de la création de l'événement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne"
    };
  }
}

// Modifier un événement
export async function updateEventAction(
  eventId: string, 
  data: Partial<EventFormData>
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const { user } = await checkAuth();

    // Vérifier que l'événement existe et appartient à l'utilisateur (ou admin)
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        OR: [
          { organizerId: user.id },
          // Les admins peuvent modifier tous les événements
          ...(["admin", "moderator"].includes(user.role!) ? [{}] : [])
        ]
      }
    });

    if (!existingEvent) {
      return {
        success: false,
        error: "Événement introuvable ou accès non autorisé"
      };
    }

    // Générer nouveau slug si le titre a changé
    let slug = existingEvent.slug;
    if (data.title && data.title !== existingEvent.title) {
      slug = await generateUniqueSlug(data.title, eventId);
    }

    // Validation des dates si modifiées
    let startDate = existingEvent.startDate;
    let endDate = existingEvent.endDate;
    
    if (data.startDate) startDate = new Date(data.startDate);
    if (data.endDate) endDate = new Date(data.endDate);
    
    if (endDate < startDate) {
      return {
        success: false,
        error: "La date de fin doit être après la date de début"
      };
    }

    // Mettre à jour l'événement
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title && { title: data.title, slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.status && { 
          status: data.status,
          isPublished: data.status === EventStatus.PUBLISHED
        }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.placeId !== undefined && { placeId: data.placeId }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.ticketUrl !== undefined && { ticketUrl: data.ticketUrl }),
        ...(data.startDate && { startDate }),
        ...(data.endDate && { endDate }),
        ...(data.isAllDay !== undefined && { isAllDay: data.isAllDay }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.locationName !== undefined && { locationName: data.locationName }),
        ...(data.locationAddress !== undefined && { locationAddress: data.locationAddress }),
        ...(data.locationCity !== undefined && { locationCity: data.locationCity }),
        ...(data.locationLatitude !== undefined && { locationLatitude: data.locationLatitude }),
        ...(data.locationLongitude !== undefined && { locationLongitude: data.locationLongitude }),
        ...(data.maxParticipants !== undefined && { maxParticipants: data.maxParticipants }),
        ...(data.isFree !== undefined && { isFree: data.isFree }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.priceDetails !== undefined && { priceDetails: data.priceDetails }),
        ...(data.currency && { currency: data.currency }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.images && { images: JSON.stringify(data.images) }),
        ...(data.videos && { videos: JSON.stringify(data.videos) }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
        ...(data.ogImage !== undefined && { ogImage: data.ogImage }),
        ...(data.facebook !== undefined && { facebook: data.facebook }),
        ...(data.instagram !== undefined && { instagram: data.instagram }),
        ...(data.twitter !== undefined && { twitter: data.twitter }),
        ...(data.linkedin !== undefined && { linkedin: data.linkedin }),
        ...(data.tiktok !== undefined && { tiktok: data.tiktok }),
        ...(data.tags && { tags: JSON.stringify(data.tags) }),
        ...(data.category && { category: data.category }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring })
      }
    });

    // Revalider les pages concernées
    revalidatePath("/dashboard/events");
    revalidatePath("/events");
    revalidatePath(`/events/${updatedEvent.slug}`);

    return {
      success: true,
      data: { id: updatedEvent.id, slug: updatedEvent.slug }
    };

  } catch (error) {
    console.error("Erreur lors de la modification de l'événement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne"
    };
  }
}

// Supprimer un événement
export async function deleteEventAction(eventId: string): Promise<ActionResult> {
  try {
    const { user } = await checkAuth();

    // Vérifier que l'événement existe et appartient à l'utilisateur (ou admin)
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        OR: [
          { organizerId: user.id },
          // Les admins peuvent supprimer tous les événements
          ...(["admin", "moderator"].includes(user.role!) ? [{}] : [])
        ]
      }
    });

    if (!existingEvent) {
      return {
        success: false,
        error: "Événement introuvable ou accès non autorisé"
      };
    }

    // Supprimer l'événement (cascade supprime automatiquement les relations)
    await prisma.event.delete({
      where: { id: eventId }
    });

    // Revalider les pages concernées
    revalidatePath("/dashboard/events");
    revalidatePath("/events");

    return { success: true };

  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne"
    };
  }
}

// Récupérer les événements d'un utilisateur
export async function getUserEventsAction(options?: {
  page?: number;
  limit?: number;
  status?: EventStatus;
}): Promise<ActionResult<{
  events: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}>> {
  try {
    const { user } = await checkAuth();

    const page = options?.page || 1;
    const limit = options?.limit || 12;
    const offset = (page - 1) * limit;

    const where = {
      organizerId: user.id,
      ...(options?.status && { status: options.status })
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          place: {
            select: { id: true, name: true, slug: true, city: true }
          },
          _count: {
            select: { participants: true }
          }
        },
        orderBy: [
          { startDate: "asc" },
          { createdAt: "desc" }
        ],
        skip: offset,
        take: limit
      }),
      prisma.event.count({ where })
    ]);

    return {
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };

  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne"
    };
  }
}

// Récupérer les événements publics (pour agenda)
export async function getPublicEventsAction(options?: {
  startDate?: string;
  endDate?: string;
  category?: EventCategory;
  city?: string;
  placeId?: string;
  limit?: number;
}): Promise<ActionResult<any[]>> {
  try {
    const where: any = {
      status: EventStatus.PUBLISHED,
      isActive: true,
    };

    // Filtres par date
    if (options?.startDate || options?.endDate) {
      where.OR = [];
      
      if (options.startDate && options.endDate) {
        where.OR.push({
          startDate: {
            gte: new Date(options.startDate),
            lte: new Date(options.endDate)
          }
        });
      } else if (options.startDate) {
        where.startDate = { gte: new Date(options.startDate) };
      } else if (options.endDate) {
        where.startDate = { lte: new Date(options.endDate) };
      }
    }

    // Autres filtres
    if (options?.category) where.category = options.category;
    if (options?.city) where.locationCity = options.city;
    if (options?.placeId) where.placeId = options.placeId;

    const events = await prisma.event.findMany({
      where,
      include: {
        place: {
          select: { id: true, name: true, slug: true, city: true }
        },
        organizer: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { participants: true }
        }
      },
      orderBy: [
        { isFeatured: "desc" },
        { startDate: "asc" },
        { createdAt: "desc" }
      ],
      take: options?.limit || 100
    });

    return {
      success: true,
      data: events
    };

  } catch (error) {
    console.error("Erreur lors de la récupération des événements publics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne"
    };
  }
}

// S'inscrire à un événement
export async function participateInEventAction(
  eventId: string, 
  status: ParticipationStatus = ParticipationStatus.GOING,
  guestCount: number = 0,
  specialNeeds?: string
): Promise<ActionResult<{ participationId: string }>> {
  try {
    const { user } = await checkAuth();

    // Vérifier que l'événement existe et est publiéÒ
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        status: EventStatus.PUBLISHED,
        isActive: true
      }
    });

    if (!event) {
      return {
        success: false,
        error: "Événement introuvable ou non disponible"
      };
    }

    // Vérifier la capacité
    if (event.maxParticipants) {
      const currentParticipants = await prisma.eventParticipant.count({
        where: { 
          eventId,
          status: { in: [ParticipationStatus.GOING, ParticipationStatus.WAITLISTED] }
        }
      });

      if (currentParticipants >= event.maxParticipants && !event.waitingList) {
        return {
          success: false,
          error: "Événement complet"
        };
      }
    }

    // Créer ou mettre à jour la participation
    const participation = await prisma.eventParticipant.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id
        }
      },
      update: {
        status,
        guestCount,
        specialNeeds
      },
      create: {
        eventId,
        userId: user.id,
        status,
        guestCount,
        specialNeeds
      }
    });

    // Mettre à jour le compteur de participants de l'événement
    const totalParticipants = await prisma.eventParticipant.count({
      where: { 
        eventId,
        status: { in: [ParticipationStatus.GOING, ParticipationStatus.WAITLISTED] }
      }
    });

    await prisma.event.update({
      where: { id: eventId },
      data: { participantCount: totalParticipants }
    });

    revalidatePath(`/events/${event.slug}`);
    revalidatePath("/dashboard/events");

    return {
      success: true,
      data: { participationId: participation.id }
    };

  } catch (error) {
    console.error("Erreur lors de l'inscription à l'événement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne"
    };
  }
}