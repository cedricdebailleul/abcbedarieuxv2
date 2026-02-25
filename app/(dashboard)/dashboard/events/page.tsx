"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Users,
  MoreHorizontal,
  Plus,
  Filter,
  MapPin} from "lucide-react";
import { useSession } from "@/hooks/use-session";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SafeImage } from "@/components/safe-image";

import { getUserEventsAction, deleteEventAction } from "@/actions/event";
import { EventStatus, EventCategory } from "@/lib/generated/prisma/browser";
import { EVENT_CATEGORIES_LABELS } from "@/lib/validations/event";

interface Event {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  category?: EventCategory;
  isFeatured: boolean;
  coverImage?: string;
  locationName?: string;
  locationCity?: string;
  participantCount: number;
  maxParticipants?: number;
  isFree: boolean;
  price?: number;
  currency?: string;
  createdAt: string;
  place?: {
    id: string;
    name: string;
    city: string;
  };
  _count: {
    participants: number;
  };
}

interface EventsData {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Fonction utilitaire pour normaliser les chemins d'images
function normalizeImagePath(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith("/") ? path : `/${path}`;
}

// Labels pour les statuts
const STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.DRAFT]: "Brouillon",
  [EventStatus.PENDING_REVIEW]: "En attente",
  [EventStatus.PUBLISHED]: "Publié",
  [EventStatus.CANCELLED]: "Annulé",
  [EventStatus.POSTPONED]: "Reporté",
  [EventStatus.COMPLETED]: "Terminé",
  [EventStatus.ARCHIVED]: "Archivé",
};

const STATUS_COLORS: Record<EventStatus, string> = {
  [EventStatus.DRAFT]: "bg-gray-100 text-gray-800",
  [EventStatus.PENDING_REVIEW]: "bg-yellow-100 text-yellow-800",
  [EventStatus.PUBLISHED]: "bg-green-100 text-green-800",
  [EventStatus.CANCELLED]: "bg-red-100 text-red-800",
  [EventStatus.POSTPONED]: "bg-orange-100 text-orange-800",
  [EventStatus.COMPLETED]: "bg-blue-100 text-blue-800",
  [EventStatus.ARCHIVED]: "bg-gray-100 text-gray-800",
};

export default function MyEventsPage() {
  const { data: status } = useSession();
  const [eventsData, setEventsData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchEvents = useCallback(async () => {
    // Éviter les appels trop fréquents
    const now = Date.now();
    if (now - lastFetchTime < 500) {
      return;
    }

    try {
      setLoading(true);
      const result = await getUserEventsAction({
        page: currentPage,
        limit: 12,
        status:
          statusFilter !== "all" ? (statusFilter as EventStatus) : undefined,
      });

      if (result.success) {
        setEventsData({
          ...result.data!,
          events: result.data!.events.map((event) => ({
            ...event,
            status: (event as unknown as Event).status || EventStatus.DRAFT,
            isFeatured: Boolean(
              "isFeatured" in event ? event.isFeatured : false
            ),
            isFree: Boolean("isFree" in event ? event.isFree : true),
            createdAt:
              "createdAt" in event &&
              typeof event.createdAt === "string" &&
              event.createdAt
                ? event.createdAt
                : new Date().toISOString(),
            startDate: new Date(event.startDate).toISOString(),
            endDate: event.endDate
              ? new Date(event.endDate).toISOString()
              : new Date(event.startDate).toISOString(),
            _count:
              "_count" in event
                ? (event._count as { participants: number })
                : { participants: 0 },
          })),
        });
      } else {
        toast.error(result.error || "Erreur lors du chargement des événements");
      }
      setLastFetchTime(now);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des événements");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, lastFetchTime]);

  useEffect(() => {
    if (status && status.user) {
      fetchEvents();
    }
  }, [status, fetchEvents]);

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${eventTitle}" ?`)) {
      return;
    }

    try {
      const result = await deleteEventAction(eventId);

      if (result.success) {
        toast.success("Événement supprimé avec succès");
        fetchEvents(); // Recharger la liste
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatEventDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const isMultiDay = start.toDateString() !== end.toDateString();

    if (isMultiDay) {
      return `${start.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      })} - ${end.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      })}`;
    } else {
      return start.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    }
  };

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status?.state === "unauthenticated") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Connexion requise
        </h1>
        <p className="text-gray-600">
          Vous devez être connecté pour voir vos événements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Événements</h1>
          <p className="text-gray-600">
            Gérez vos événements et consultez les statistiques
          </p>
        </div>

        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus className="w-4 h-4 mr-2" />
            Créer un événement
          </Link>
        </Button>
      </div>

      {/* Statistiques rapides */}
      {eventsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">
                    {eventsData.pagination.total}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Publiés</p>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      eventsData.events.filter(
                        (e) => e.status === EventStatus.PUBLISHED
                      ).length
                    }
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Brouillons</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {
                      eventsData.events.filter(
                        (e) => e.status === EventStatus.DRAFT
                      ).length
                    }
                  </p>
                </div>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Participants</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {eventsData.events.reduce(
                      (sum, e) => sum + e._count.participants,
                      0
                    )}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Liste des événements */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !eventsData || eventsData.events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {statusFilter === "all"
              ? "Aucun événement créé"
              : `Aucun événement ${STATUS_LABELS[
                  statusFilter as EventStatus
                ].toLowerCase()}`}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter === "all"
              ? "Commencez par créer votre premier événement."
              : `Aucun événement avec le statut "${
                  STATUS_LABELS[statusFilter as EventStatus]
                }".`}
          </p>
          <Button asChild>
            <Link href="/dashboard/events/new">
              <Plus className="w-4 h-4 mr-2" />
              Créer mon premier événement
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventsData.events.map((event) => {
            const isUpcoming = new Date(event.startDate) > new Date();
            const isPast = new Date(event.endDate) < new Date();

            return (
              <Card
                key={event.id}
                className="hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 w-full">
                  <SafeImage
                    src={normalizeImagePath(event.coverImage) || ""}
                    alt={`Image de ${event.title}`}
                    fill
                    className="object-cover rounded-t-lg"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    fallbackClassName="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg flex items-center justify-center"
                  />

                  {/* Badges overlay */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <Badge
                      className={`px-2 py-1 text-xs ${
                        STATUS_COLORS[event.status]
                      }`}
                    >
                      {STATUS_LABELS[event.status]}
                    </Badge>
                    {event.isFeatured && (
                      <Badge variant="secondary">À la une</Badge>
                    )}
                  </div>

                  {/* Menu d'actions */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/90"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/events/${event.id}/edit`}>
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/events/${event.slug}`} target="_blank">
                            Voir la page publique
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(event.id, event.title)}
                          className="text-red-600"
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold line-clamp-1 mb-1">
                      {event.title}
                    </h3>

                    <div className="flex items-center text-sm text-muted-foreground gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatEventDate(event.startDate, event.endDate)}
                        </span>
                      </div>
                      {!event.isFree && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{event.price}€</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(event.locationName || event.place) && (
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="truncate">
                        {event.locationName || event.place?.name}
                        {(event.locationCity || event.place?.city) && (
                          <span>
                            {" "}
                            • {event.locationCity || event.place?.city}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {event.category && (
                    <Badge variant="outline" className="mb-3 text-xs">
                      {EVENT_CATEGORIES_LABELS[event.category]}
                    </Badge>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>
                        {event._count.participants} participant
                        {event._count.participants > 1 ? "s" : ""}
                        {event.maxParticipants && (
                          <span>/{event.maxParticipants}</span>
                        )}
                      </span>
                    </div>
                    <span
                      className={
                        isPast
                          ? "text-red-600"
                          : isUpcoming
                          ? "text-green-600"
                          : "text-blue-600"
                      }
                    >
                      {isPast ? "Terminé" : isUpcoming ? "À venir" : "En cours"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/dashboard/events/${event.id}/edit`}>
                        Modifier
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/events/${event.slug}`}>Voir</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {eventsData && eventsData.pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          {currentPage > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Précédent
            </Button>
          )}

          <div className="flex items-center space-x-1">
            {Array.from(
              { length: eventsData.pagination.pages },
              (_, i) => i + 1
            ).map((pageNumber) => {
              const isCurrentPage = pageNumber === currentPage;
              const isNearCurrentPage = Math.abs(pageNumber - currentPage) <= 2;
              const isFirstOrLast =
                pageNumber === 1 || pageNumber === eventsData.pagination.pages;

              if (!isNearCurrentPage && !isFirstOrLast) {
                return null;
              }

              return (
                <Button
                  key={pageNumber}
                  variant={isCurrentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  disabled={isCurrentPage}
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          {currentPage < eventsData.pagination.pages && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Suivant
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
