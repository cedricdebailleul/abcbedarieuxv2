import { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, MapPin, Users, Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { EventCalendar } from "@/components/events/event-calendar";
import { EventCard } from "@/components/events/event-card";
import { SafeImage } from "@/components/safe-image";

import { getPublicEventsAction } from "@/actions/event";
import { EVENT_CATEGORIES_LABELS } from "@/lib/validations/event";
import { EventCategory } from "@/lib/generated/prisma";

interface EventsPageProps {
  searchParams: Promise<{
    view?: string;
    category?: string;
    city?: string;
    search?: string;
    date?: string; // YYYY-MM-DD
  }>;
}

export const metadata: Metadata = {
  title: "Événements à Bédarieux - Agenda local",
  description: "Découvrez tous les événements, concerts, festivals et activités à Bédarieux et ses environs. Agenda complet avec dates et détails.",
  openGraph: {
    title: "Événements à Bédarieux - Agenda local",
    description: "Découvrez tous les événements, concerts, festivals et activités à Bédarieux et ses environs. Agenda complet avec dates et détails.",
    type: "website"
  }
};

// Fonction utilitaire pour normaliser les chemins d'images
function normalizeImagePath(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith("/") ? path : `/${path}`;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const view = params.view || "calendar";
  const selectedCategory = params.category;
  const selectedCity = params.city;
  const searchQuery = params.search;
  const selectedDate = params.date;

  console.log("Search params received:", params); // Debug log

  // Calculer la plage de dates pour les événements récurrents (3 mois par défaut)
  const today = new Date();
  const startOfPeriod = new Date(today.getFullYear(), today.getMonth() - 1, 1); // Mois précédent
  const endOfPeriod = new Date(today.getFullYear(), today.getMonth() + 3, 0); // 3 mois suivants

  // Si une date spécifique est sélectionnée, charger les événements pour cette journée
  let startDate = startOfPeriod.toISOString().split('T')[0];
  let endDate = endOfPeriod.toISOString().split('T')[0];
  
  if (selectedDate) {
    startDate = selectedDate;
    endDate = selectedDate;
  }

  // Charger les événements
  const eventsResult = await getPublicEventsAction({
    startDate,
    endDate,
    category: selectedCategory && selectedCategory !== "all" && Object.values(EventCategory).includes(selectedCategory as EventCategory) 
      ? selectedCategory as EventCategory 
      : undefined,
    city: selectedCity && selectedCity !== "all" ? selectedCity : undefined,
    limit: view === "calendar" ? 200 : 24
  });

  const events = eventsResult.success ? eventsResult.data! : [];

  // Filtrer par recherche textuelle côté client (simple pour le MVP)
  const filteredEvents = searchQuery
    ? events.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.locationCity?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

  // Obtenir les villes uniques pour le filtre
  const cities = [...new Set(events.map(e => e.locationCity || e.place?.city).filter(Boolean))];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Agenda des événements</h1>
        </div>
        <p className="text-muted-foreground">
          Découvrez tous les événements, concerts, festivals et activités à Bédarieux et ses environs
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                {Object.entries(EVENT_CATEGORIES_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
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
                  <SelectItem key={city} value={city!}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sélecteur de vue */}
            <div className="flex rounded-lg border p-1">
              <Link
                href={`?${new URLSearchParams(
                  Object.fromEntries(
                    Object.entries({ ...params, view: "calendar" }).filter(([, v]) => v != null)
                  )
                ).toString()}`}
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
                href={`?${new URLSearchParams(
                  Object.fromEntries(
                    Object.entries({ ...params, view: "list" }).filter(([, v]) => v != null)
                  )
                ).toString()}`}
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
              {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4">
              <span>• Gratuit</span>
              <span>• Payant</span>
              <span>• Complet</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      {view === "calendar" ? (
        <EventCalendar events={filteredEvents} />
      ) : (
        <div className="space-y-6">
          {/* Events à la une */}
          {filteredEvents.some(e => e.isFeatured) && (
            <Card>
              <CardHeader>
                <CardTitle>Événements à la une</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents
                    .filter(event => event.isFeatured)
                    .slice(0, 3)
                    .map((event, index) => (
                      <EventCard key={event.occurrenceId || `${event.id}-featured-${index}`} event={event} />
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
              {filteredEvents.length === 0 ? (
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
                      Organiser un événement
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents
                    .filter(event => !event.isFeatured)
                    .map((event, index) => (
                      <EventCard key={event.occurrenceId || `${event.id}-regular-${index}`} event={event} />
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