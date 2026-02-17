import { Metadata } from "next";
import Link from "next/link";
import { Calendar, Users, Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EventCalendar } from "@/components/events/event-calendar";
import { EventCard } from "@/components/events/event-card";

import { getPublicEventsAction } from "@/actions/event";
import type { Event } from "@/lib/generated/prisma/client";
import { EVENT_CATEGORIES_LABELS } from "@/lib/validations/event";
import { EventCategory } from "@/lib/generated/prisma/client";

/** =========================
 * Types locaux utiles
 * ========================= */

type PublicEventsResult = Awaited<ReturnType<typeof getPublicEventsAction>>;
type PublicEvent = NonNullable<PublicEventsResult["data"]>[number];

// Event enrichi pour les composants UI (card/calendrier)
type EventWithCount = Event & {
  _count: { participants: number };
  occurrenceId?: string;
};

type SearchParams = {
  view?: string | string[];
  category?: string | string[];
  city?: string | string[];
  search?: string | string[];
  date?: string | string[]; // YYYY-MM-DD
};

interface EventsPageProps {
  // Next 15: en Server Component, searchParams est une Promise
  searchParams: Promise<SearchParams | undefined>;
}

/** =========================
 * Metadata
 * ========================= */

export const metadata: Metadata = {
  title: "Événements à Bédarieux - Agenda local",
  description:
    "Découvrez tous les événements, concerts, festivals et activités à Bédarieux et ses environs. Agenda complet avec dates et détails.",
  openGraph: {
    title: "Événements à Bédarieux - Agenda local",
    description:
      "Découvrez tous les événements, concerts, festivals et activités à Bédarieux et ses environs. Agenda complet avec dates et détails.",
    type: "website",
  },
};

/** =========================
 * Helpers
 * ========================= */

function firstOf(v?: string | string[] | null): string | undefined {
  return Array.isArray(v) ? v[0] : (v ?? undefined);
}

function buildQueryString(
  base: SearchParams | undefined,
  patch: Record<string, string | undefined>
) {
  const obj: Record<string, string> = {};
  const keys: (keyof SearchParams)[] = [
    "view",
    "category",
    "city",
    "search",
    "date",
  ];
  for (const k of keys) {
    const val = firstOf(base?.[k]);
    if (val) obj[k] = val;
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") delete obj[k];
    else obj[k] = v;
  }
  return new URLSearchParams(obj).toString();
}

/** =========================
 * Page
 * ========================= */

export default async function EventsPage({ searchParams }: EventsPageProps) {
  // ⚠️ Next 15 : il faut await AVANT d’accéder aux propriétés
  const sp = (await searchParams) ?? {};

  const view = firstOf(sp.view) || "calendar";
  const selectedCategory = firstOf(sp.category);
  const selectedCity = firstOf(sp.city);
  const searchQuery = firstOf(sp.search);
  const selectedDate = firstOf(sp.date);

  // Période par défaut : du 1er du mois précédent à la fin du 3e mois suivant
  const today = new Date();
  const startOfPeriod = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfPeriod = new Date(today.getFullYear(), today.getMonth() + 3, 0);

  let startDate = startOfPeriod.toISOString().split("T")[0];
  let endDate = endOfPeriod.toISOString().split("T")[0];
  if (selectedDate) {
    startDate = selectedDate;
    endDate = selectedDate;
  }

  // Catégorie -> on tolère la valeur enum comme "slug" si c’est ton design
  const categorySlug =
    selectedCategory &&
    selectedCategory !== "all" &&
    (Object.values(EventCategory) as string[]).includes(selectedCategory)
      ? selectedCategory
      : undefined;

  // Chargement des événements
  const eventsResult = await getPublicEventsAction({
    startDate,
    endDate,
    categorySlug,
    city: selectedCity && selectedCity !== "all" ? selectedCity : undefined,
    limit: view === "calendar" ? 200 : 24,
  });

  const events: PublicEvent[] = eventsResult.success ? eventsResult.data! : [];

  // Adaptation pour l'UI : dates en Date, slug fallback, _count présent
  const uiEvents: EventWithCount[] = events.map((e) => {
    const start =
      typeof e.startDate === "string"
        ? new Date(e.startDate)
        : new Date(e.startDate);
    const end =
      typeof e.endDate === "string" ? new Date(e.endDate) : new Date(e.endDate);

    const place = (
      e as {
        place?: { id: string; name: string; slug: string; city: string } | null;
      }
    ).place;
    const slug = (e as { slug?: string }).slug || place?.slug || e.id;

    const count =
      (e as { _count?: { participants?: number } })._count?.participants ??
      (e as { participantCount?: number }).participantCount ??
      0;

    const base = {
      ...e,
      startDate: start,
      endDate: end,
      slug,
      _count: { participants: count },
      place,
    };

    return base as unknown as EventWithCount;
  });

  // Filtrage texte côté client (MVP)
  const filteredEvents: EventWithCount[] = searchQuery
    ? uiEvents.filter((ev) => {
        const q = searchQuery.toLowerCase();
        const title = ev.title?.toLowerCase() ?? "";
        const place = (
          ev as unknown as { place?: { name?: string; city?: string } }
        ).place;
        const placeName = place?.name?.toLowerCase() ?? "";
        const placeCity = place?.city?.toLowerCase() ?? "";
        return (
          title.includes(q) || placeName.includes(q) || placeCity.includes(q)
        );
      })
    : uiEvents;

  // Villes uniques
  const cities = Array.from(
    new Set(
      events
        .map((e) => (e as { place?: { city?: string } }).place?.city)
        .filter(Boolean)
    )
  ) as string[];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Agenda des événements
          </h1>
        </div>
        <p className="text-muted-foreground">
          Découvrez tous les événements, concerts, festivals et activités à
          Bédarieux et ses environs
        </p>
      </div>

      {/* Filtres et recherche */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Recherche textuelle */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher un événement..."
                defaultValue={searchQuery}
                className="pl-10"
                name="search"
              />
            </div>

            {/* Filtre par catégorie */}
            <Select defaultValue={selectedCategory || "all"}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {Object.entries(EVENT_CATEGORIES_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            {/* Filtre par ville */}
            <Select defaultValue={selectedCity || "all"}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les villes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sélecteur de vue */}
            <div className="flex rounded-lg border p-1">
              <Link
                href={`?${buildQueryString(sp, { view: "calendar" })}`}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === "calendar"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Calendrier
              </Link>
              <Link
                href={`?${buildQueryString(sp, { view: "list" })}`}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="w-4 h-4" />
                Liste
              </Link>
            </div>
          </div>

          {/* Statistiques */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
            <span>
              {filteredEvents.length} événement
              {filteredEvents.length > 1 ? "s" : ""} trouvé
              {filteredEvents.length > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-4">
              <span>• Gratuit</span>
              <span>• Payant</span>
              <span>• Complet</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {view === "calendar" ? (
        <EventCalendar events={filteredEvents as EventWithCount[]} />
      ) : (
        <div className="space-y-6">
          {/* Events à la une */}
          {filteredEvents.some((e) => e.isFeatured) && (
            <Card>
              <CardHeader>
                <CardTitle>Événements à la une</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents
                    .filter((event) => event.isFeatured)
                    .slice(0, 3)
                    .map((event) => (
                      <EventCard
                        key={
                          event.occurrenceId ||
                          `${event.id}-${event.startDate.toISOString()}-featured`
                        }
                        event={event}
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Événements à venir */}
          <Card>
            <CardHeader>
              <CardTitle>Prochains événements</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEvents.filter((e) => !e.isFeatured).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-muted-foreground mb-2">
                    Aucun événement trouvé
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || selectedCategory || selectedCity
                      ? "Essayez de modifier vos filtres pour voir plus d'événements."
                      : "Aucun événement n'est programmé pour le moment."}
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/events/new">
                      <Calendar className="w-4 h-4 mr-2" />
                      Créer un événement
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents
                    .filter((event) => !event.isFeatured)
                    .map((event) => (
                      <EventCard
                        key={
                          event.occurrenceId ||
                          `${event.id}-${event.startDate.toISOString()}`
                        }
                        event={event}
                      />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA pour créer un événement */}
      <Card className="mt-8 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">
              Vous organisez un événement ?
            </h3>
            <p className="text-muted-foreground mb-6">
              Faites-le connaître à toute la communauté de Bédarieux
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard/events/new">
                <Calendar className="w-4 h-4 mr-2" />
                Créer un événement
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
