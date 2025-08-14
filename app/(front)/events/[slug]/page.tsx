import {
  Calendar,
  Clock,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Star,
  Twitter,
  User,
  Users,
  Euro,
  Share2,
  Heart,
  Ticket,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { GalleryLightbox } from "@/components/gallery-lightbox";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EventParticipationButton } from "@/components/events/event-participation-button";
import { SocialShare } from "@/components/shared/social-share";
import { EventSchema } from "@/components/structured-data/event-schema";
import { OpenGraphDebug } from "@/components/debug/og-debug";
import { PrintHeader } from "@/components/print/print-header";

import { EventCategory, EventStatus } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { EVENT_CATEGORIES_LABELS } from "@/lib/validations/event";
import { getEventBySlugAction } from "@/actions/event";
import { generateEventShareData } from "@/lib/share-utils";
import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
} from "react";

// Types d'aide
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

function isExternal(url?: string | null) {
  return !!url && /^https?:\/\//i.test(url);
}

function normalizeImagePath(path?: string | null): string | null {
  if (!path) return null;
  if (isExternal(path)) return path;
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

function formatEventDateTime(
  startDate: Date,
  endDate: Date,
  isAllDay: boolean,
  timezone: string
) {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  };

  const isMultiDay = startDate.toDateString() !== endDate.toDateString();

  if (isAllDay) {
    if (isMultiDay) {
      return {
        primary: `Du ${startDate.toLocaleDateString(
          "fr-FR",
          options
        )} au ${endDate.toLocaleDateString("fr-FR", options)}`,
        secondary: "Toute la journée",
      };
    } else {
      return {
        primary: startDate.toLocaleDateString("fr-FR", options),
        secondary: "Toute la journée",
      };
    }
  } else {
    if (isMultiDay) {
      return {
        primary: `Du ${startDate.toLocaleDateString(
          "fr-FR",
          options
        )} au ${endDate.toLocaleDateString("fr-FR", options)}`,
        secondary: `De ${startDate.toLocaleTimeString(
          "fr-FR",
          timeOptions
        )} à ${endDate.toLocaleTimeString("fr-FR", timeOptions)}`,
      };
    } else {
      return {
        primary: startDate.toLocaleDateString("fr-FR", options),
        secondary: `De ${startDate.toLocaleTimeString(
          "fr-FR",
          timeOptions
        )} à ${endDate.toLocaleTimeString("fr-FR", timeOptions)}`,
      };
    }
  }
}

// Types de props
type PageProps = { params: Promise<{ slug: string }> };

// SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findFirst({
    where: { slug, status: EventStatus.PUBLISHED, isActive: true },
    select: {
      title: true,
      summary: true,
      metaTitle: true,
      metaDescription: true,
      coverImage: true,
      ogImage: true,
      images: true,
      slug: true,
      startDate: true,
      endDate: true,
      locationCity: true,
    },
  });

  if (!event) {
    return {
      title: "Événement introuvable",
      robots: { index: false, follow: false },
    };
  }

  const gallery = toArray(event.images);
  const ogImg = event.ogImage || event.coverImage || gallery[0];
  const eventDate = event.startDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const eventLocation = event.locationCity || "Bédarieux";

  // URL absolue pour l'image
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const absoluteImageUrl = ogImg
    ? ogImg.startsWith("http")
      ? ogImg
      : `${baseUrl}${ogImg}`
    : `${baseUrl}/images/og-event-default.jpg`;

  return {
    title: event.metaTitle || `${event.title} — Événement ${eventDate}`,
    description:
      event.metaDescription ||
      event.summary ||
      `Découvrez ${event.title}, événement à ${eventLocation} le ${eventDate}.`,
    openGraph: {
      title: event.title,
      description:
        event.summary ||
        event.metaDescription ||
        `Événement à ${eventLocation} le ${eventDate}`,
      url: `${baseUrl}/events/${event.slug}`,
      siteName: "ABC Bédarieux",
      locale: "fr_FR",
      type: "article",
      publishedTime: event.startDate.toISOString(),
      authors: ["ABC Bédarieux"],
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: `${event.title} - ${eventDate}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description:
        event.summary || `Événement à ${eventLocation} le ${eventDate}`,
      images: [absoluteImageUrl],
      creator: "@abc_bedarieux",
    },
  };
}

// Page principale
export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;

  // Utiliser l'action qui gère les événements récurrents
  const eventResult = await getEventBySlugAction(slug);

  if (!eventResult.success || !eventResult.data) {
    notFound();
  }

  const event = eventResult.data as {
    category: EventCategory;
  } & typeof eventResult.data;

  const gallery = toArray(event.images);
  const videos = toArray(event.videos);
  const tags = toArray(event.tags);
  const cover = normalizeImagePath(event.coverImage || gallery[0]);
  const logo = normalizeImagePath(event.logo);

  const dateInfo = formatEventDateTime(
    new Date(event.startDate),
    new Date(event.endDate),
    event.isAllDay,
    event.timezone
  );

  const isUpcoming = new Date(event.startDate) > new Date();
  const isPast = new Date(event.endDate) < new Date();
  const isOngoing =
    new Date() >= new Date(event.startDate) &&
    new Date() <= new Date(event.endDate);
  const isFull =
    event.maxParticipants && event._count.participants >= event.maxParticipants;

  // Construire l'adresse complète
  const fullAddress = event.locationAddress
    ? `${event.locationAddress}, ${event.locationCity}`
    : event.place
    ? `${event.place.street}, ${event.place.postalCode} ${event.place.city}`
    : event.locationCity;

  // URLs de carte et itinéraire
  const mapSrc =
    (event.locationLatitude && event.locationLongitude) ||
    (event.place?.latitude && event.place?.longitude)
      ? `https://www.google.com/maps?q=${
          event.locationLatitude || event.place?.latitude
        },${
          event.locationLongitude || event.place?.longitude
        }&z=16&output=embed`
      : fullAddress
      ? `https://www.google.com/maps?q=${encodeURIComponent(
          fullAddress
        )}&z=16&output=embed`
      : null;

  const directionsHref =
    (event.locationLatitude && event.locationLongitude) ||
    (event.place?.latitude && event.place?.longitude)
      ? `https://www.google.com/maps?daddr=${
          event.locationLatitude || event.place?.latitude
        },${event.locationLongitude || event.place?.longitude}`
      : fullAddress
      ? `https://www.google.com/maps?daddr=${encodeURIComponent(fullAddress)}`
      : null;

  return (
    <div className="relative">
      {/* Données structurées pour SEO et réseaux sociaux */}
      <EventSchema event={event} />

      {/* En-tête d'impression */}
      <PrintHeader
        title={event.title}
        subtitle="Événement"
        date={event.startDate.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      />

      {/* Cover full-bleed sous le header */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="relative h-[80vh] bg-muted">
          {cover ? (
            <SafeImage
              src={cover}
              alt={`Couverture — ${event.title}`}
              fill
              className="object-cover"
              sizes="80vw"
              fallbackClassName="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Bouton de partage en haut à droite */}
          <div className="absolute top-8 right-8">
            <SocialShare
              data={generateEventShareData(event)}
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              showLabel={false}
            />
          </div>

          {/* Informations overlay sur l'image */}
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 mb-4">
                {event.isFeatured && (
                  <Badge variant="secondary">À la une</Badge>
                )}
                {event.category && (
                  <Badge
                    variant="outline"
                    className="border-white/30 text-white"
                  >
                    {EVENT_CATEGORIES_LABELS[event.category as EventCategory]}
                  </Badge>
                )}
                {isOngoing && (
                  <Badge className="bg-green-600 text-white">En cours</Badge>
                )}
                {isPast && (
                  <Badge className="bg-gray-600 text-white">Terminé</Badge>
                )}
                {isFull && isUpcoming && (
                  <Badge className="bg-red-600 text-white">Complet</Badge>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {event.title}
              </h1>
              {event.summary && (
                <p className="text-xl text-white/90 max-w-2xl">
                  {event.summary}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {event.description && (
              <Card>
                <CardHeader>
                  <CardTitle>À propos de l'événement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: event.description.replace(/\n/g, "<br>"),
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Galerie */}
            {gallery.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Galerie</CardTitle>
                </CardHeader>
                <CardContent>
                  <GalleryLightbox images={gallery} placeName={event.title} />
                </CardContent>
              </Card>
            )}

            {/* Vidéos */}
            {videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Vidéos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videos.map((videoUrl, index) => (
                      <div key={index} className="aspect-video">
                        <iframe
                          src={videoUrl}
                          title={`Vidéo ${index + 1} - ${event.title}`}
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Occurrences récurrentes */}
            {event.isRecurring &&
              event.occurrences &&
              event.occurrences.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Prochaines dates ({event.occurrences.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {event.occurrences
                        .slice(0, 8)
                        .map(
                          (
                            occurrence: {
                              startDate: string | number | Date;
                              endDate: string | number | Date;
                              isOriginal: any;
                            },
                            index: Key | null | undefined
                          ) => {
                            const startDate = new Date(occurrence.startDate);
                            const endDate = new Date(occurrence.endDate);
                            const isToday =
                              startDate.toDateString() ===
                              new Date().toDateString();
                            const isPast = endDate < new Date();

                            return (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  isToday
                                    ? "bg-primary/5 border-primary/20"
                                    : isPast
                                    ? "bg-muted/50 border-muted"
                                    : "bg-background border-border"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p
                                      className={`font-medium ${
                                        isPast
                                          ? "text-muted-foreground line-through"
                                          : ""
                                      }`}
                                    >
                                      {startDate.toLocaleDateString("fr-FR", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        year:
                                          startDate.getFullYear() !==
                                          new Date().getFullYear()
                                            ? "numeric"
                                            : undefined,
                                      })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {event.isAllDay
                                        ? "Toute la journée"
                                        : `${startDate.toLocaleTimeString(
                                            "fr-FR",
                                            {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            }
                                          )} - ${endDate.toLocaleTimeString(
                                            "fr-FR",
                                            {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            }
                                          )}`}
                                    </p>
                                  </div>
                                </div>
                                {isToday && (
                                  <Badge variant="default" className="text-xs">
                                    Aujourd'hui
                                  </Badge>
                                )}
                                {occurrence.isOriginal && (
                                  <Badge variant="outline" className="text-xs">
                                    Original
                                  </Badge>
                                )}
                              </div>
                            );
                          }
                        )}

                      {event.occurrences.length > 8 && (
                        <p className="text-sm text-muted-foreground text-center pt-2 border-t">
                          Et {event.occurrences.length - 8} autres dates...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Participants */}
            {event.participants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Participants ({event._count.participants})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {event.participants
                      .slice(0, 10)
                      .map(
                        (participant: {
                          id: Key | null | undefined;
                          user: {
                            slug: any;
                            name:
                              | string
                              | number
                              | bigint
                              | boolean
                              | ReactElement<
                                  unknown,
                                  string | JSXElementConstructor<any>
                                >
                              | Iterable<ReactNode>
                              | ReactPortal
                              | Promise<
                                  | string
                                  | number
                                  | bigint
                                  | boolean
                                  | ReactPortal
                                  | ReactElement<
                                      unknown,
                                      string | JSXElementConstructor<any>
                                    >
                                  | Iterable<ReactNode>
                                  | null
                                  | undefined
                                >
                              | null
                              | undefined;
                          };
                          registeredAt: {
                            toLocaleDateString: (
                              arg0: string
                            ) =>
                              | string
                              | number
                              | bigint
                              | boolean
                              | ReactElement<
                                  unknown,
                                  string | JSXElementConstructor<any>
                                >
                              | Iterable<ReactNode>
                              | ReactPortal
                              | Promise<
                                  | string
                                  | number
                                  | bigint
                                  | boolean
                                  | ReactPortal
                                  | ReactElement<
                                      unknown,
                                      string | JSXElementConstructor<any>
                                    >
                                  | Iterable<ReactNode>
                                  | null
                                  | undefined
                                >
                              | null
                              | undefined;
                          };
                        }) => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between"
                          >
                            <Link
                              href={`/profil/${participant.user.slug}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {participant.user.name}
                            </Link>
                            <span className="text-sm text-muted-foreground">
                              {participant.registeredAt.toLocaleDateString(
                                "fr-FR"
                              )}
                            </span>
                          </div>
                        )
                      )}
                    {event._count.participants > 10 && (
                      <p className="text-sm text-muted-foreground pt-2 border-t">
                        Et {event._count.participants - 10} autres
                        participants...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations essentielles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date et heure */}
                <div>
                  <h4 className="font-medium mb-2">Date et heure</h4>
                  <div className="text-sm">
                    <p className="font-medium">{dateInfo.primary}</p>
                    <p className="text-muted-foreground">
                      {dateInfo.secondary}
                    </p>
                  </div>
                </div>

                {/* Prix */}
                <div>
                  <h4 className="font-medium mb-2">Tarif</h4>
                  {event.isFree ? (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-200"
                    >
                      Gratuit
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Euro className="w-4 h-4 text-primary" />
                      <span className="font-medium">
                        {event.price}
                        {event.currency === "EUR" ? "€" : event.currency}
                      </span>
                      {event.priceDetails && (
                        <span className="text-sm text-muted-foreground ml-2">
                          {event.priceDetails}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Capacité */}
                {event.maxParticipants && (
                  <div>
                    <h4 className="font-medium mb-2">Places disponibles</h4>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {event._count.participants} / {event.maxParticipants}{" "}
                        participants
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 mt-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (event._count.participants /
                              event.maxParticipants) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Participation */}
                {isUpcoming && (
                  <EventParticipationButton
                    eventId={event.id}
                    eventTitle={event.title}
                    isFull={isFull || false}
                    waitingListEnabled={event.waitingList}
                  />
                )}

                {/* Billetterie */}
                {event.ticketUrl && isUpcoming && (
                  <Button asChild className="w-full">
                    <a
                      href={event.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Ticket className="w-4 h-4" />
                      Réserver des billets
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Contact organisateur */}
            {(event.email || event.phone || event.website) && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                      <a
                        href={`tel:${event.phone}`}
                        className="text-primary hover:underline"
                      >
                        {event.phone}
                      </a>
                    </div>
                  )}
                  {event.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
                      <a
                        href={`mailto:${event.email}`}
                        className="text-primary hover:underline"
                      >
                        {event.email}
                      </a>
                    </div>
                  )}
                  {event.website && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-3 text-muted-foreground" />
                      <a
                        href={event.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center"
                      >
                        Site web <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Localisation */}
            {(event.locationName || event.place || fullAddress) && (
              <Card>
                <CardHeader>
                  <CardTitle>Lieu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium">
                      {event.locationName || event.place?.name}
                    </h4>
                    {fullAddress && (
                      <p className="text-sm text-muted-foreground">
                        {fullAddress}
                      </p>
                    )}
                  </div>

                  {event.place && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/places/${event.place.slug}`}>
                        Voir la fiche du lieu
                      </Link>
                    </Button>
                  )}

                  {mapSrc && (
                    <>
                      <div className="overflow-hidden rounded-xl border">
                        <iframe
                          title={`Carte — ${event.title}`}
                          src={mapSrc}
                          className="w-full h-56"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                      {directionsHref && (
                        <Button asChild className="w-full" size="sm">
                          <a
                            href={directionsHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Itinéraire
                          </a>
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Organisateur */}
            {event.organizer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Organisateur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium">
                      {event.organizer.profile?.firstname &&
                      event.organizer.profile?.lastname
                        ? `${event.organizer.profile.firstname} ${event.organizer.profile.lastname}`
                        : event.organizer.name}
                    </h4>
                    {event.organizer.profile?.bio && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.organizer.profile.bio}
                      </p>
                    )}
                  </div>

                  {event.organizer.profile?.isPublic &&
                    event.organizer.slug && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Link href={`/profil/${event.organizer.slug}`}>
                          <User className="w-4 h-4 mr-2" />
                          Voir le profil
                        </Link>
                      </Button>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Réseaux sociaux */}
            {(event.facebook ||
              event.instagram ||
              event.twitter ||
              event.linkedin) && (
              <Card>
                <CardHeader>
                  <CardTitle>Suivez l'événement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {event.facebook && (
                    <a
                      href={event.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <Facebook className="w-4 h-4 mr-2" /> Facebook
                    </a>
                  )}
                  {event.instagram && (
                    <a
                      href={event.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <Instagram className="w-4 h-4 mr-2" /> Instagram
                    </a>
                  )}
                  {event.twitter && (
                    <a
                      href={event.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <Twitter className="w-4 h-4 mr-2" /> Twitter
                    </a>
                  )}
                  {event.linkedin && (
                    <a
                      href={event.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Debug Open Graph (dev seulement) */}
        <div className="mt-8">
          <OpenGraphDebug
            url={`${
              process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
            }/events/${event.slug}`}
          />
        </div>
      </div>
    </div>
  );
}
