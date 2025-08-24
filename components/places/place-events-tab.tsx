"use client";

import { Calendar, Euro, Users } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="group hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      <Link href={`/events/${event.slug}`}>{event.title}</Link>
                    </CardTitle>

                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatEventDate(
                          event.startDate,
                          event.endDate,
                          event.isAllDay
                        )}
                      </span>
                    </div>
                  </div>

                  {event.category && (
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: event.category.color
                          ? `${event.category.color}15`
                          : undefined,
                        color: event.category.color || undefined,
                        borderColor: event.category.color || undefined,
                      }}
                    >
                      {event.category.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {event.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.summary}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    {event.isFree ? (
                      <span className="text-green-600 font-medium">
                        Gratuit
                      </span>
                    ) : (
                      event.price && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Euro className="h-4 w-4" />
                          <span>
                            {event.price} {event.currency || "EUR"}
                          </span>
                        </div>
                      )
                    )}

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{event._count.participants}</span>
                    </div>
                  </div>

                  {event.organizer.slug && (
                    <Link
                      href={`/profile/${event.organizer.slug}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      par {event.organizer.name}
                    </Link>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/events/${event.slug}`}>
                      Voir l&apos;événement
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
