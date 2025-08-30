"use client";

import React, { useState } from "react";
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
  Share,
  Download,
  Upload,
  Link,
  ExternalLink} from "lucide-react";
import { HistoryMilestone } from "@/lib/types/history";

interface MilestoneListProps {
  milestones: HistoryMilestone[];
  onEdit: (milestone: HistoryMilestone) => void;
  onDelete: (id: string) => void;
}

// Map des icônes Lucide
const iconMap: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
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
  Share,
  Download,
  Upload,
  Link,
  ExternalLink,
};

export function MilestoneList({
  milestones,
  onEdit,
  onDelete,
}: MilestoneListProps) {
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

  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Aucune étape clé</p>
            <p className="text-sm">
              Commencez par ajouter votre première étape clé
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {milestones.map((milestone) => {
          const IconComponent = getIcon(milestone.icon);

          return (
            <Card key={milestone.id} className="relative group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {milestone.number}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {milestone.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Badge
                      variant={milestone.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {milestone.isActive ? "Actif" : "Inactif"}
                    </Badge>

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
                        <DropdownMenuItem onClick={() => onEdit(milestone)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(milestone.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Ordre: {milestone.order}</span>
                  <span>Icône: {milestone.icon}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;étape clé</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette étape clé ? Cette action
              est irréversible et l&apos;étape ne sera plus affichée sur la page
              publique.
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
