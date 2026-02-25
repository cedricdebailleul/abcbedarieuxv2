import Link from "next/link";
import { Calendar, Users, ExternalLink, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SafeImage } from "@/components/safe-image";
import { SocialShare } from "@/components/shared/social-share";
import { generateEventShareData } from "@/lib/share-utils";

interface Event {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  startDate: string | Date;
  endDate: string | Date | null;
  isAllDay: boolean;
  category?: string | null | undefined | { id: string; name: string; slug: string; color?: string | null };
  isFeatured: boolean;
  isFree: boolean;
  price?: number | null;
  currency?: string | null;
  coverImage?: string | null;
  locationName?: string | null;
  locationCity?: string | null;
  maxParticipants?: number | null;
  participantCount: number;
  ticketUrl?: string | null;
  place?: {
    id: string;
    name: string;
    slug: string;
    city: string;
  } | null;
  organizer?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count: {
    participants: number;
  };
}

interface EventCardProps {
  event: Event;
  size?: "default" | "compact";
}

/** Normalise un chemin d’image :
 * - trim
 * - gère les URLs absolues (http/https)
 * - ajoute un "/" devant les chemins relatifs
 * - retourne `undefined` si vide → évite `src=""`
 */
function normalizeImagePath(path?: string | null): string | undefined {
  if (!path) return undefined;
  const p = path.trim();
  if (!p) return undefined;
  if (/^https?:\/\//i.test(p)) return p; // URL absolue
  return p.startsWith("/") ? p : `/${p}`;
}

// Formatage dates (inchangé)
function formatEventDate(
  startDate: string | Date,
  endDate: string | Date | null,
  isAllDay: boolean
) {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : null;
  const isMultiDay = end ? start.toDateString() !== end.toDateString() : false;

  if (isAllDay) {
    if (isMultiDay && end) {
      return {
        primary: `${start.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })} - ${end.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })}`,
        secondary: "Toute la journée",
      };
    }
    return {
      primary: start.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      secondary: "Toute la journée",
    };
  }

  if (isMultiDay && end) {
    return {
      primary: `${start.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })} - ${end.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })}`,
      secondary: `${start.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${end.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    };
  }

  return {
    primary: start.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    secondary: end
      ? `${start.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${end.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function EventCard({ event, size = "default" }: EventCardProps) {
  const dateInfo = formatEventDate(
    event.startDate,
    event.endDate,
    event.isAllDay
  );

  // Évite les new Date() multiples (lisible + léger + moins d'erreurs)
  const now = new Date();
  const start = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
  const end = event.endDate ? (event.endDate instanceof Date ? event.endDate : new Date(event.endDate)) : null;

  const isUpcoming = start > now;
  const isPast = end ? end < now : false;
  const isOngoing = end ? now >= start && now <= end : now >= start;

  // Laisse passer 0 si jamais (rare, mais sûr)
  const max = event.maxParticipants;
  const isFull = max != null && event._count.participants >= max;

  // Etiquette prix robuste
  const priceLabel = event.isFree
    ? "Gratuit"
    : event.price != null
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: event.currency ?? "EUR",
        maximumFractionDigits: 0,
      }).format(event.price)
    : "Tarif à venir";

  const cardHeight = size === "compact" ? "h-64" : "h-80";

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${
        isPast ? "opacity-75" : ""
      }`}
    >
      <CardContent className="p-0">
        {/* Image de couverture */}
        <div className={`relative ${cardHeight} w-full`}>
          <SafeImage
            src={normalizeImagePath(event.coverImage) || ""}
            alt={`Image de ${event.title}`}
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            fallbackClassName="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg flex items-center justify-center"
          />

          {/* Overlays et badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {event.isFeatured && (
              <Badge
                variant="secondary"
                className="bg-white/90 text-foreground"
              >
                À la une
              </Badge>
            )}
            {isOngoing && (
              <Badge className="bg-green-600 text-white">En cours</Badge>
            )}
            {isPast && (
              <Badge variant="outline" className="bg-white/90">
                Terminé
              </Badge>
            )}
            {isFull && isUpcoming && (
              <Badge variant="destructive" className="bg-red-600 text-white">
                Complet
              </Badge>
            )}
          </div>

          {/* Prix et partage */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
            <SocialShare
              data={generateEventShareData({
                title: event.title,
                slug: event.slug,
                summary: event.summary,
                description: undefined,
                startDate: start,
                endDate: end,
                isAllDay: event.isAllDay,
                locationName: event.locationName,
                locationCity: event.locationCity,
                category: typeof event.category === "string" ? event.category : event.category?.name || null,
                tags: undefined,
                coverImage: event.coverImage,
                place: event.place ? {
                  name: event.place.name,
                  city: event.place.city
                } : null,
              })}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm"
              showLabel={false}
            />
            <Badge
              variant={event.isFree ? "outline" : "default"}
              className={
                event.isFree
                  ? "bg-white/90"
                  : "bg-primary text-primary-foreground"
              }
            >
              {priceLabel}
            </Badge>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-t-lg" />

          {/* Titre en overlay sur l'image */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-bold text-lg line-clamp-2 mb-1">
              {event.title}
            </h3>
            {event.summary && size !== "compact" && (
              <p className="text-white/90 text-sm line-clamp-2">
                {event.summary}
              </p>
            )}
          </div>
        </div>

        {/* Contenu de la carte */}
        <div className="p-4">
          <div className="space-y-3">
            {/* Date et heure */}
            <div className="flex items-start gap-2">
              <Calendar
                aria-hidden
                className="w-4 h-4 text-primary mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {dateInfo.primary}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dateInfo.secondary}
                </p>
              </div>
            </div>

            {/* Lieu */}
            {(event.locationName || event.place) && (
              <div className="flex items-center gap-2">
                <MapPin
                  aria-hidden
                  className="w-4 h-4 text-muted-foreground shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {event.locationName || event.place?.name}
                  </p>
                  {(event.locationCity || event.place?.city) && (
                    <p className="text-xs text-muted-foreground">
                      {event.locationCity || event.place?.city}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Organisateur */}
            {event.organizer && (
              <div className="flex items-center gap-2">
                <Users
                  aria-hidden
                  className="w-4 h-4 text-muted-foreground shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    Par{" "}
                    <Link
                      href={`/profil/${event.organizer.slug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {event.organizer.name}
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* Statistiques et catégorie */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users aria-hidden className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {event._count.participants} participant
                  {event._count.participants > 1 ? "s" : ""}
                  {max != null && (
                    <span className="text-muted-foreground">/{max}</span>
                  )}
                </span>
              </div>

              {event.category && (
                <Badge variant="outline" className="text-xs">
                  {typeof event.category === "string" ? event.category : event.category.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button asChild className="flex-1" size="sm">
              <Link href={`/events/${event.slug}`}>Voir l&apos;événement</Link>
            </Button>

            {event.ticketUrl && isUpcoming && !isFull && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink aria-hidden className="w-3 h-3" />
                  Billets
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
