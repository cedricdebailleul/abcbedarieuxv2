"use client";

import { Calendar, Euro, Users } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getPlaceEventsAction } from "@/actions/place-events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceEventsTabProps {
  placeId: string;
}

interface EventData {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  isFree: boolean;
  price?: number | null;
  currency?: string | null;
  coverImage?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  locationCity?: string | null;
  organizer: { id: string; name: string; slug: string | null };
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
  } | null;
  _count: { participants: number };
}

const getGradientForId = (id: string): string => {
  const gradients = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-green-400 to-green-600',
    'from-orange-400 to-orange-600',
    'from-red-400 to-red-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
    'from-cyan-400 to-cyan-600',
    'from-yellow-400 to-yellow-600',
    'from-emerald-400 to-emerald-600',
    'from-violet-400 to-violet-600'
  ];
  const index = id.charCodeAt(0) % gradients.length;
  return gradients[index];
};

function formatEventDate(
  startDate: Date,
  endDate: Date,
  isAllDay: boolean
): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const sameDay = start.toDateString() === end.toDateString();

  if (isAllDay) {
    if (sameDay) {
      return start.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      return `${start.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })} - ${end.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })}`;
    }
  }

  if (sameDay) {
    return `${start.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })} • ${start.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${end.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return `${start.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })} - ${end.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function PlaceEventsTab({ placeId }: PlaceEventsTabProps) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const result = await getPlaceEventsAction(placeId, 6);
        if (result.success && result.data) {
          setEvents(result.data);
        } else {
          setError(result.error || "Erreur lors du chargement des événements");
        }
      } catch (err) {
        console.error("Erreur lors du chargement des événements:", err);
        setError("Erreur lors du chargement des événements");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [placeId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Événements
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              Chargement des événements...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Événements
        </h2>
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-destructive font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Événements
          {events.length > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-primary bg-primary/10 rounded-full">
              {events.length}
            </span>
          )}
        </h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/events">Voir tous les événements</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Aucun événement à venir
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Aucun événement n&apos;est programmé pour cet établissement.
                Revenez plus tard pour découvrir les prochains événements !
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.slug}`}>
              <Card className="group transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden h-full flex flex-col">
                {/* Image de couverture ou dégradé */}
                <div className="relative h-48 w-full overflow-hidden">
                  {event.coverImage ? (
                    <Image
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${getGradientForId(event.id)} flex items-center justify-center`}>
                      <div className="text-white/80 text-center p-4">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-60" />
                        <p className="text-sm font-medium opacity-80">{event.title.substring(0, 30)}...</p>
                      </div>
                    </div>
                  )}
                  {event.category && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/90 text-black border-0 text-xs">
                        <div
                          className="w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: event.category.color || "#6B7280" }}
                        />
                        {event.category.name}
                      </Badge>
                    </div>
                  )}
                  {event.isFree && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-500 text-white border-0 text-xs">
                        Gratuit
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                        <Calendar className="h-5 w-5 text-primary" />
                        {event.title}
                      </CardTitle>
                      {event.summary && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {event.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 mt-auto">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatEventDate(event.startDate, event.endDate, event.isAllDay)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {!event.isFree && event.price && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Euro className="h-4 w-4" />
                            <span>{event.price} {event.currency || "EUR"}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{event._count.participants}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
