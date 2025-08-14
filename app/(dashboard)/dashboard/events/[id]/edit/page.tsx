import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/forms/event-form";
import { prisma } from "@/lib/prisma";
import { PlaceStatus } from "@/lib/generated/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface EditEventPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: "Modifier un événement - Dashboard",
  description: "Modifiez votre événement",
};

function toArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  try {
    const parsed = JSON.parse(String(val));
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;

  // Vérifier l'authentification
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    notFound();
  }

  // Charger l'événement à modifier
  const event = await prisma.event.findFirst({
    where: {
      id,
      OR: [
        { organizerId: session.user.id },
        // Les admins peuvent modifier tous les événements
        ...(["admin", "moderator"].includes(session.user.role!) ? [{}] : []),
      ],
    },
    include: {
      recurrenceRule: true,
    },
  });

  if (!event) {
    notFound();
  }

  // Charger les places disponibles
  const places = await prisma.place.findMany({
    where: {
      status: PlaceStatus.ACTIVE,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      city: true,
    },
    orderBy: [{ name: "asc" }],
  });

  // Préparer les données pour le formulaire
  const initialData = {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description ?? undefined,
    summary: event.summary ?? undefined,
    status: event.status,
    isFeatured: event.isFeatured,
    placeId: event.placeId || "",
    email: event.email || "",
    phone: event.phone || "",
    website: event.website || "",
    ticketUrl: event.ticketUrl || "",
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    isAllDay: event.isAllDay,
    timezone: event.timezone,
    locationName: event.locationName ?? undefined,
    locationAddress: event.locationAddress ?? undefined,
    locationCity: event.locationCity ?? undefined,
    locationLatitude: event.locationLatitude || undefined,
    locationLongitude: event.locationLongitude || undefined,
    maxParticipants: event.maxParticipants || undefined,
    isFree: event.isFree,
    price: event.price || undefined,
    priceDetails: event.priceDetails || "",
    currency: event.currency,
    coverImage: event.coverImage || "",
    images: toArray(event.images),
    videos: toArray(event.videos),
    metaTitle: event.metaTitle || "",
    metaDescription: event.metaDescription || "",
    ogImage: event.ogImage || "",
    facebook: event.facebook || "",
    instagram: event.instagram || "",
    twitter: event.twitter || "",
    linkedin: event.linkedin || "",
    tiktok: event.tiktok || "",
    tags: toArray(event.tags),
    category: event.category || undefined,
    isRecurring: event.isRecurring,
    recurrence: event.recurrenceRule
      ? {
          frequency: event.recurrenceRule.frequency,
          interval: event.recurrenceRule.interval,
          count: event.recurrenceRule.count || undefined,
          until:
            event.recurrenceRule.until?.toISOString().split("T")[0] ||
            undefined,
          byWeekDay: event.recurrenceRule.byWeekDay
            ? toArray(event.recurrenceRule.byWeekDay).map(Number)
            : undefined,
          byMonthDay: event.recurrenceRule.byMonthDay
            ? toArray(event.recurrenceRule.byMonthDay).map(Number)
            : undefined,
          byMonth: event.recurrenceRule.byMonth
            ? toArray(event.recurrenceRule.byMonth).map(Number)
            : undefined,
          exceptions: event.recurrenceRule.exceptions
            ? toArray(event.recurrenceRule.exceptions)
            : undefined,
          workdaysOnly: event.recurrenceRule.workdaysOnly,
        }
      : undefined,
  };

  return (
    <div className="container mx-auto py-8">
      <EventForm initialData={initialData} places={places} />
    </div>
  );
}
