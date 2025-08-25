"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  MapPin,
  Lightbulb,
  Rocket,
  Users,
  Star,
  Trophy,
  Heart,
  Award,
  Target,
  Zap,
  Gift,
  Crown,
  Shield,
  Flag,
  Home,
  Building,
  Store,
  Coffee,
  Camera,
  Music,
  Palette,
  Scissors,
  Wrench,
  Book,
  Newspaper,
  Phone,
  Mail,
  Globe,
  Map,
  Navigation,
  Compass,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Settings,
  Info,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share,
  Download,
  Upload,
  Link,
  ExternalLink,
} from "lucide-react";
import { HistoryTimelineEvent } from "@/lib/types/history";

interface TimelineEventListProps {
  events: HistoryTimelineEvent[];
  onEdit: (event: HistoryTimelineEvent) => void;
  onDelete: (id: string) => void;
}

// Map des icônes Lucide
const iconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Calendar,
  MapPin,
  Lightbulb,
  Rocket,
  Users,
  Star,
  Trophy,
  Heart,
  Award,
  Target,
  Zap,
  Gift,
  Crown,
  Shield,
  Flag,
  Home,
  Building,
  Store,
  Coffee,
  Camera,
  Music,
  Palette,
  Scissors,
  Wrench,
  Book,
  Newspaper,
  Phone,
  Mail,
  Globe,
  Map,
  Navigation,
  Compass,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Edit,
  Trash2,
  Settings,
  Info,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share,
  Download,
  Upload,
  Link,
  ExternalLink,
};

export function TimelineEventList({
  events,
  onEdit,
  onDelete,
}: TimelineEventListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Calendar;
    return IconComponent;
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">
              Aucun événement de chronologie
            </p>
            <p className="text-sm">
              Commencez par ajouter votre premier événement
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        {events.map((event, index) => {
          const IconComponent = getIcon(event.icon);

          return (
            <div key={event.id} className="relative">
              {/* Ligne de connexion */}
              {index < events.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-20 bg-gray-200" />
              )}

              <Card className="relative group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    {/* Icône avec couleur */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${event.color}`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant="outline"
                          className="text-primary font-bold"
                        >
                          {event.year}
                        </Badge>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <Badge
                          variant={event.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {event.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(event)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(event.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pl-20">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Ordre: {event.order}</span>
                    <div className="flex items-center gap-4">
                      <span>Icône: {event.icon}</span>
                      <span>
                        Couleur:{" "}
                        {event.color.split(" ")[0]?.replace("bg-", "") ||
                          "Aucune"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;événement</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet événement de la chronologie
              ? Cette action est irréversible et l&apos;événement ne sera plus
              affiché sur la page publique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
