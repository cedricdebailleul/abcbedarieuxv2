"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Palette,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";

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

import {
  getPlaceCategoriesAction,
  deletePlaceCategoryAction,
} from "@/actions/place-category";
import { type PlaceCategoryFilters } from "@/lib/validations/place-category";
import { cn } from "@/lib/utils";

interface PlaceCategoriesTableProps {
  filters: PlaceCategoryFilters;
}

export function PlaceCategoriesTable({ filters }: PlaceCategoriesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{
    categories: {
      id: string;
      name: string;
      slug: string;
      description?: string; // Optional description property
      sortOrder: number;
      icon: string | null;
      color: string | null;
      parent?: { id: string; name: string; slug: string } | null;
      _count: { children: number };
      isActive: boolean;
    }[];
    total: number;
    pages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Charger les données
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        // Convertir parentId "null" en null pour l'API
        const apiFilters = {
          ...filters,
          parentId:
            filters.parentId === "null"
              ? null
              : filters.parentId === "all"
              ? undefined
              : filters.parentId,
        };

        const result = await getPlaceCategoriesAction(apiFilters);
        if (result.success) {
          setData({
            ...result.data!,
            categories: result.data!.categories.map((category) => ({
              ...category,
              description: category.description || "",
              sortOrder: category.sortOrder || 0,
              icon: category.icon || null,
              color: category.color || null,
              parent: category.parent
                ? {
                    id: category.parent.id,
                    name: category.parent.name,
                    slug: category.parent.slug || "",
                  }
                : null,
            })),
          });
        } else {
          toast.error(result.error || "Erreur lors du chargement");
        }
      } catch {
        toast.error("Erreur lors du chargement des catégories");
      }
      setLoading(false);
    };

    loadCategories();
  }, [filters]);

  // Supprimer une catégorie
  const handleDelete = async (categoryId: string) => {
    startTransition(async () => {
      try {
        const result = await deletePlaceCategoryAction(categoryId);
        if (result.success) {
          toast.success("Catégorie supprimée avec succès");
          // Recharger les données
          const refreshResult = await getPlaceCategoriesAction(filters);
          if (refreshResult.success) {
            setData({
              ...refreshResult.data!,
              categories: refreshResult.data!.categories.map((category) => ({
                ...category,
                description: category.description || "",
                sortOrder: category.sortOrder || 0,
                icon: category.icon || null,
                color: category.color || null,
                parent: category.parent
                  ? {
                      id: category.parent.id,
                      name: category.parent.name,
                      slug: category.parent.slug || "",
                    }
                  : null,
              })),
            });
          }
        } else {
          toast.error(result.error || "Erreur lors de la suppression");
        }
      } catch {
        toast.error("Erreur lors de la suppression de la catégorie");
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

  // Rendu de l'icône de catégorie
  const renderCategoryIcon = (icon: string | null, color: string | null) => {
    if (!icon) return <Hash className="w-5 h-5 text-muted-foreground" />;

    // Vérifier si c'est un emoji
    if (
      icon.length <= 4 &&
      /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
        icon
      )
    ) {
      return <span className="text-lg">{icon}</span>;
    }

    // Vérifier si c'est une icône Lucide
    const IconComponent = (
      LucideIcons as unknown as Record<string, React.FC<{ className?: string }>>
    )[icon];
    if (IconComponent) {
      return (
        <span style={{ color: color || undefined }}>
          <IconComponent className="w-5 h-5" />
        </span>
      );
    }

    // Fallback
    return <Hash className="w-5 h-5 text-muted-foreground" />;
  };

  // Rendu du badge de couleur
  const renderColorBadge = (category: {
    bgColor?: string;
    textColor?: string;
    borderColor?: string;
    color?: string;
  }) => {
    const style = {
      backgroundColor: category.bgColor ? undefined : `${category.color}20`,
      color: category.textColor ? undefined : category.color,
      borderColor: category.borderColor ? undefined : category.color,
    };

    const className = cn(
      "inline-flex items-center gap-1",
      category.bgColor,
      category.textColor,
      category.borderColor ? `border ${category.borderColor}` : "border"
    );

    return (
      <div className={className} style={style}>
        <Palette className="w-3 h-3" />
        <span className="text-xs px-1 rounded">
          {category.color || "#6B7280"}
        </span>
      </div>
    );
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

  if (!data || data.categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucune catégorie trouvée</p>
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
              <TableHead>Catégorie</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Apparence</TableHead>
              <TableHead>Sous-catégories</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {renderCategoryIcon(category.icon, category.color)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {category.name}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {category.description || "Aucune description"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ordre: {category.sortOrder}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {category.parent ? (
                    <Badge variant="outline">{category.parent.name}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Racine
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {renderColorBadge({
                    ...category,
                    color: category.color || undefined,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {category._count.children}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? (
                      <>
                        <Eye className="mr-1 h-3 w-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-1 h-3 w-3" />
                        Inactive
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
                        onClick={() =>
                          router.push(
                            `/dashboard/admin/place-categories/${category.id}`
                          )
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(
                            `/dashboard/admin/place-categories/${category.id}/edit`
                          )
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteId(category.id)}
                        className="text-destructive"
                        disabled={category._count.children > 0}
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
            {(filters.page - 1) * filters.limit + 1} à{" "}
            {Math.min(filters.page * filters.limit, data.total)} sur{" "}
            {data.total} catégories
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
            <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action
              est irréversible. Les catégories avec des sous-catégories ne
              peuvent pas être supprimées.
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
