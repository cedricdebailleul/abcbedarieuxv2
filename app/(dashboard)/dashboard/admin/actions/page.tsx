"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface Action {
  id: string;
  title: string;
  slug: string;
  description?: string;
  summary?: string;
  coverImage?: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  isActive: boolean;
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  sortOrder: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  ARCHIVED: "bg-red-100 text-red-800",
};

const statusLabels = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  SCHEDULED: "Programmé",
  ARCHIVED: "Archivé",
};

export default function ActionsAdminPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    action: Action | null;
  }>({ open: false, action: null });

  const fetchActions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (featuredFilter !== "all") params.append("featured", featuredFilter);

      const response = await fetch(`/api/admin/actions?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setActions(data.actions);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des actions");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, featuredFilter]);

  const handleDelete = async (action: Action) => {
    try {
      const response = await fetch(`/api/admin/actions/${action.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      toast.success("Action supprimée avec succès");
      fetchActions();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialog({ open: false, action: null });
    }
  };

  useEffect(() => {
    fetchActions();
  }, [pagination.page, search, statusFilter, featuredFilter, fetchActions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Actions</h1>
          <p className="text-muted-foreground">
            Gérez les actions de l&apos;association ABC Bédarieux
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/actions/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Action
          </Link>
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="PUBLISHED">Publié</SelectItem>
                <SelectItem value="SCHEDULED">Programmé</SelectItem>
                <SelectItem value="ARCHIVED">Archivé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Mise en avant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="true">En avant</SelectItem>
                <SelectItem value="false">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des actions */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Chargement...</div>
          ) : actions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Aucune action trouvée
            </div>
          ) : (
            <div className="divide-y">
              {actions.map((action) => (
                <div key={action.id} className="p-6 hover:bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {action.title}
                        </h3>
                        <Badge className={statusColors[action.status]}>
                          {statusLabels[action.status]}
                        </Badge>
                        {action.isFeatured && (
                          <Badge
                            variant="outline"
                            className="border-yellow-500 text-yellow-700"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            En avant
                          </Badge>
                        )}
                      </div>

                      {action.summary && (
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {action.summary}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>Créé par {action.createdBy.name}</span>
                        <span>Le {formatDate(action.createdAt)}</span>
                        {action.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Début: {formatDate(action.startDate)}
                          </span>
                        )}
                        <span>Ordre: {action.sortOrder}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/admin/actions/${action.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/admin/actions/${action.id}/edit`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              setDeleteDialog({ open: true, action })
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
          >
            Précédent
          </Button>
          <span className="px-4 py-2">
            Page {pagination.page} sur {pagination.pages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.pages}
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Dialog de suppression */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, action: deleteDialog.action })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;action</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;action &quot;
              {deleteDialog.action?.title}&quot; ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.action && handleDelete(deleteDialog.action)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
