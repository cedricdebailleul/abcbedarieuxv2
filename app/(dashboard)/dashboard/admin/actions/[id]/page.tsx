"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Star,
  Globe,
  User,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from "next/image";

interface Action {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  summary?: string;
  coverImage?: string;
  gallery: string[];
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  isActive: boolean;
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  metaTitle?: string;
  metaDescription?: string;
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

export default function ActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setActionId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  const fetchAction = useCallback(async () => {
    if (!actionId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/actions/${actionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Action non trouvée");
          router.push("/dashboard/admin/actions");
          return;
        }
        throw new Error("Erreur lors du chargement");
      }

      const data = await response.json();
      setAction(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement de l'action");
    } finally {
      setLoading(false);
    }
  }, [actionId, router]);

  const handleDelete = async () => {
    if (!actionId) return;
    
    try {
      const response = await fetch(`/api/admin/actions/${actionId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      toast.success("Action supprimée avec succès");
      router.push("/dashboard/admin/actions");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    if (actionId) {
      fetchAction();
    }
  }, [fetchAction, actionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Action non trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin/actions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{action.title}</h1>
            <p className="text-muted-foreground">
              Créé par {action.createdBy.name} le {formatDate(action.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {action.status === "PUBLISHED" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/actions/${action.slug}`} target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                Voir public
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/admin/actions/${action.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer l&apos;action</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer cette action ? Cette action
                  est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image de couverture */}
          {action.coverImage && (
            <Card>
              <CardContent className="p-0">
                <Image
                  src={action.coverImage}
                  alt={action.title}
                  className="w-full h-64 object-cover rounded-t-lg"
                  width={640}
                  height={256}
                />
              </CardContent>
            </Card>
          )}

          {/* Contenu */}
          <Card>
            <CardHeader>
              <CardTitle>Contenu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {action.summary && (
                <div>
                  <h4 className="font-semibold mb-2">Résumé</h4>
                  <p className="text-muted-foreground">{action.summary}</p>
                </div>
              )}

              {action.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{action.description}</p>
                  </div>
                </div>
              )}

              {action.content && (
                <div>
                  <h4 className="font-semibold mb-2">Contenu détaillé</h4>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap">{action.content}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Galerie */}
          {action.gallery.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Galerie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {action.gallery.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`Galerie ${index + 1}`}
                      width={200}
                      height={128}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEO */}
          {(action.metaTitle || action.metaDescription) && (
            <Card>
              <CardHeader>
                <CardTitle>Référencement (SEO)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {action.metaTitle && (
                  <div>
                    <h4 className="font-semibold mb-1">Titre SEO</h4>
                    <p className="text-muted-foreground">{action.metaTitle}</p>
                  </div>
                )}
                {action.metaDescription && (
                  <div>
                    <h4 className="font-semibold mb-1">Description SEO</h4>
                    <p className="text-muted-foreground">
                      {action.metaDescription}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                <Badge className={statusColors[action.status]}>
                  {statusLabels[action.status]}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <Badge variant={action.isActive ? "default" : "secondary"}>
                  {action.isActive ? "Oui" : "Non"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En avant</span>
                <div className="flex items-center">
                  {action.isFeatured && (
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  )}
                  <Badge variant={action.isFeatured ? "default" : "secondary"}>
                    {action.isFeatured ? "Oui" : "Non"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ordre</span>
                <span className="text-sm font-medium">{action.sortOrder}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Créé par {action.createdBy.name}</span>
                </div>

                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Le {formatDate(action.createdAt)}</span>
                </div>

                {action.publishedAt && (
                  <div className="flex items-center text-sm">
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Publié le {formatDate(action.publishedAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          {(action.startDate || action.endDate) && (
            <Card>
              <CardHeader>
                <CardTitle>Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {action.startDate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Début</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateOnly(action.startDate)}
                      </div>
                    </div>
                  </div>
                )}

                {action.endDate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Fin</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateOnly(action.endDate)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Slug */}
          <Card>
            <CardHeader>
              <CardTitle>URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="font-medium mb-1">Slug</div>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  /actions/{action.slug}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
