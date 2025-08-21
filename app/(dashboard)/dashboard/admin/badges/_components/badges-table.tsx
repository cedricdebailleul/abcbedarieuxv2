"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal 
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";

import { getBadgesAction, deleteBadgeAction } from "@/actions/badge";
import { 
  CATEGORY_LABELS, 
  RARITY_LABELS, 
  RARITY_COLORS,
  type BadgeFilters 
} from "@/lib/validations/badge";
import { BadgeListItem } from "@/lib/types/badge";
import Image from "next/image";


interface BadgesTableProps {
  filters: BadgeFilters;
}

export function BadgesTable({ filters }: BadgesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{
    badges: BadgeListItem[];
    total: number;
    pages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Charger les données
  useEffect(() => {
    const loadBadges = async () => {
      setLoading(true);
      try {
        const result = await getBadgesAction(filters);
        if (result.success) {
          setData(result.data!);
        } else {
          toast.error(result.error || "Erreur lors du chargement");
        }
      } catch {
        toast.error("Erreur lors du chargement des badges");
      }
      setLoading(false);
    };

    loadBadges();
  }, [filters]);

  // Supprimer un badge
  const handleDelete = async (badgeId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteBadgeAction(badgeId);
        if (result.success) {
          toast.success("Badge supprimé avec succès");
          // Recharger les données
          const refreshResult = await getBadgesAction(filters);
          if (refreshResult.success) {
            setData(refreshResult.data!);
          }
        } else {
          toast.error(result.error || "Erreur lors de la suppression");
        }
      } catch  {
        toast.error("Erreur lors de la suppression du badge");
      }
      setDeleteId(null);
    });
  };

  // Navigation pagination
  const goToPage = (page: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("page", page.toString());
    router.push(`?${searchParams.toString()}`);
  };

  // Obtenir la couleur du badge selon la rareté
  const getRarityBadgeColor = (rarity: string) => {
    const rarityKey = rarity as keyof typeof RARITY_COLORS;
    return RARITY_COLORS[rarityKey] || RARITY_COLORS.COMMON;
  };

  // Afficher l'icône du badge
  const renderBadgeIcon = (iconUrl: string | null) => {
    if (!iconUrl) return null;
    
    const isUrl = iconUrl.startsWith('http://') || iconUrl.startsWith('https://') || iconUrl.startsWith('/');
    
    if (isUrl) {
      return <Image src={iconUrl} alt="" className="w-6 h-6 object-contain" />;
    } else {
      return <span className="text-lg">{iconUrl}</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.badges.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucun badge trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Badge</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Rareté</TableHead>
              <TableHead>Utilisateurs</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.badges.map((badge) => (
              <TableRow key={badge.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {renderBadgeIcon(badge.iconUrl)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{badge.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {badge.description}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {CATEGORY_LABELS[badge.category as keyof typeof CATEGORY_LABELS]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: getRarityBadgeColor(badge.rarity),
                      color: getRarityBadgeColor(badge.rarity)
                    }}
                  >
                    {RARITY_LABELS[badge.rarity as keyof typeof RARITY_LABELS]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{badge._count.users}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={badge.isActive ? "default" : "secondary"}>
                    {badge.isActive ? (
                      <>
                        <Eye className="mr-1 h-3 w-3" />
                        Actif
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-1 h-3 w-3" />
                        Inactif
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => router.push(`/dashboard/admin/badges/${badge.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => router.push(`/dashboard/admin/badges/${badge.id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(badge.id)}
                        className="text-destructive"
                        disabled={badge._count.users > 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {((filters.page - 1) * filters.limit) + 1} à{" "}
            {Math.min(filters.page * filters.limit, data.total)} sur {data.total} badges
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(filters.page - 1)}
              disabled={filters.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <span className="text-sm">
              Page {filters.page} sur {data.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(filters.page + 1)}
              disabled={filters.page >= data.pages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le badge</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce badge ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}