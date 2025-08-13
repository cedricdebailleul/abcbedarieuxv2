import { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCard } from "@/components/events/event-card";

import { getPublicEventsAction } from "@/actions/event";

export const metadata: Metadata = {
  title: "Événements à Bédarieux - Agenda local",
  description: "Découvrez tous les événements, concerts, festivals et activités à Bédarieux et ses environs.",
};

export default async function SimpleEventsPage() {
  // Charger les événements sans filtres pour tester
  const eventsResult = await getPublicEventsAction({
    limit: 24
  });

  const events = eventsResult.success ? eventsResult.data! : [];

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

      {/* Statistiques */}
      <div className="mb-6">
        <p className="text-muted-foreground">
          {events.length} événement{events.length > 1 ? 's' : ''} trouvé{events.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Liste des événements */}
      <Card>
        <CardHeader>
          <CardTitle>Prochains événements</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-muted-foreground mb-2">
                Aucun événement trouvé
              </h3>
              <p className="text-muted-foreground mb-6">
                Aucun événement n'est programmé pour le moment.
              </p>
              <Button asChild>
                <Link href="/dashboard/events/new">
                  Organiser un événement
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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