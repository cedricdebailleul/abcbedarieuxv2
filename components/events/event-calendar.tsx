"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  Euro,
  MapPin} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Event {
  id: string;
  title: string;
  slug: string;
  startDate: string | Date;
  endDate: string | Date;
  isAllDay: boolean;
  category?: string | null | { id: string; name: string; slug: string; color?: string | null };
  isFeatured: boolean;
  isFree: boolean;
  price?: number | null;
  currency?: string | null;
  locationName?: string | null;
  locationCity?: string | null;
  maxParticipants?: number | null;
  participantCount: number;
  place?: {
    name: string;
    city: string;
  };
  _count: {
    participants: number;
  };
  occurrenceId?: string; // Added property
}

interface EventCalendarProps {
  events: Event[];
}

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// Fonction utilitaire pour obtenir les jours du mois avec padding
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Commencer le lundi (1) au lieu de dimanche (0)
  const startWeekday = (firstDay.getDay() + 6) % 7;

  const days = [];

  // Jours du mois précédent pour remplir
  const prevMonth = new Date(year, month - 1, 0);
  for (let i = startWeekday - 1; i >= 0; i--) {
    days.push({
      date: prevMonth.getDate() - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Jours du mois actuel
  for (let date = 1; date <= daysInMonth; date++) {
    days.push({
      date,
      month,
      year,
      isCurrentMonth: true,
    });
  }

  // Jours du mois suivant pour compléter la grille
  const totalCells = Math.ceil(days.length / 7) * 7;
  let nextMonthDate = 1;
  while (days.length < totalCells) {
    days.push({
      date: nextMonthDate++,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  return days;
}

// Composant pour afficher un événement dans une cellule du calendrier
function EventThumbnail({
  event,
  isCompact = false,
}: {
  event: Event;
  isCompact?: boolean;
}) {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isMultiDay = startDate.toDateString() !== endDate.toDateString();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={`
            text-xs p-1 mb-1 rounded cursor-pointer transition-colors
            ${
              event.isFeatured
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }
            ${isCompact ? "truncate" : ""}
          `}
          title={event.title}
        >
          <div className="flex items-center gap-1">
            {!event.isAllDay && <Clock className="w-3 h-3 shrink-0" />}
            <span className="truncate font-medium">{event.title}</span>
            {isMultiDay && (
              <span className="shrink-0 text-xs opacity-75">...</span>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-lg">{event.title}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {event.isFeatured && (
                <Badge variant="secondary" className="text-xs">
                  À la une
                </Badge>
              )}
              {event.category && (
                <Badge variant="outline" className="text-xs">
                  {typeof event.category === "string" ? event.category : event.category.name}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {event.isAllDay
                  ? isMultiDay
                    ? `${startDate.toLocaleDateString(
                        "fr-FR"
                      )} - ${endDate.toLocaleDateString("fr-FR")}`
                    : `${startDate.toLocaleDateString(
                        "fr-FR"
                      )} (toute la journée)`
                  : isMultiDay
                  ? `${startDate.toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })} ${startDate.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} - ${endDate.toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })} ${endDate.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : `${startDate.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} - ${endDate.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
              </span>
            </div>

            {(event.locationName || event.place) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>
                  {event.locationName || event.place?.name}
                  {(event.locationCity || event.place?.city) && (
                    <span className="text-muted-foreground ml-1">
                      • {event.locationCity || event.place?.city}
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>
                  {event._count.participants} participant
                  {event._count.participants > 1 ? "s" : ""}
                  {event.maxParticipants && (
                    <span className="text-muted-foreground">
                      /{event.maxParticipants}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {event.isFree ? (
                  <Badge variant="outline" className="text-xs">
                    Gratuit
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <Euro className="w-3 h-3" />
                    <span className="text-xs">
                      {event.price}
                      {event.currency === "EUR" ? "€" : event.currency}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button asChild className="w-full" size="sm">
            <Link href={`/events/${event.slug}`}>Voir l&apos;événement</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EventCalendar({ events }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = getCalendarDays(year, month);

  // Grouper les événements par date
  const eventsByDate = events.reduce((acc, event) => {
    // Skip events that don't have the required date fields
    if (!event.startDate || !event.endDate) return acc;

    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    // Pour les événements multi-jours, les ajouter à chaque jour
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event as Event);
      current.setDate(current.getDate() + 1);
    }

    return acc;
  }, {} as Record<string, Event[]>);

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <Card>
      <CardContent className="p-6">
        {/* En-tête du calendrier */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd&apos;hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {/* En-têtes des jours */}
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="p-3 text-sm font-medium text-center text-muted-foreground border-b"
            >
              {day}
            </div>
          ))}

          {/* Cellules des jours */}
          {days.map((day, index) => {
            const dateKey = `${day.year}-${day.month}-${day.date}`;
            const dayEvents = eventsByDate[dateKey] || [];
            const isToday =
              day.isCurrentMonth &&
              day.date === new Date().getDate() &&
              day.month === new Date().getMonth() &&
              day.year === new Date().getFullYear();

            return (
              <div
                key={index}
                className={`
                  min-h-[120px] p-2 border-r border-b
                  ${day.isCurrentMonth ? "bg-background" : "bg-muted/30"}
                  ${isToday ? "bg-primary/5 border-primary/20" : ""}
                `}
              >
                <div
                  className={`
                    text-sm font-medium mb-2
                    ${
                      day.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                    ${isToday ? "text-primary font-bold" : ""}
                  `}
                >
                  {day.date}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <EventThumbnail
                      key={
                        event.occurrenceId ||
                        `${event.id}-${dateKey}-${eventIndex}`
                      }
                      event={event}
                      isCompact={dayEvents.length > 2}
                    />
                  ))}

                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{dayEvents.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Événement à la une</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-secondary rounded"></div>
            <span>Événement standard</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Heure précise</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
