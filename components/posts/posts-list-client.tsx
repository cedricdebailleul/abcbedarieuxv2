"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

import { 
  getPostsAction, 
  deletePostAction, 
  bulkPublishPostsAction, 
  bulkDeletePostsAction 
} from "@/actions/post";
import { PostStatus } from "@/lib/generated/prisma";

import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Tag as TagIcon,
  Folder,
  Globe,
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  Loader2,
} from "lucide-react";

interface PostsListClientProps {
  initialData: {
    posts: any[];
    total: number;
    pages: number;
  };
  searchParams: {
    search?: string;
    status?: string;
    categoryId?: string;
    tagId?: string;
    authorId?: string;
    published?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  userId?: string; // Pour filtrer par utilisateur si nécessaire
}

export function PostsListClient({ initialData, searchParams, userId }: PostsListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [posts, setPosts] = useState<any[]>(initialData.posts);
  const [total, setTotal] = useState(initialData.total);
  const [pages, setPages] = useState(initialData.pages);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // Charger les posts
  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      try {
        const filters = {
          ...searchParams,
          authorId: userId, // Filtrer par utilisateur si spécifié
        };

        const result = await getPostsAction(filters);
        
        if (result.success && result.data) {
          setPosts(result.data.posts);
          setTotal(result.data.total);
          setPages(result.data.pages);
        } else {
          toast.error("Erreur lors du chargement des articles");
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    }

    loadPosts();
  }, [searchParams, userId]);

  // Fonctions utilitaires
  const getStatusColor = (status: string, published: boolean) => {
    if (published && status === "PUBLISHED") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (status === "PENDING_REVIEW") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (status === "REJECTED") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (status === "ARCHIVED") return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  };

  const getStatusIcon = (status: string, published: boolean) => {
    if (published && status === "PUBLISHED") return <Globe className="h-3 w-3" />;
    if (status === "PENDING_REVIEW") return <Clock className="h-3 w-3" />;
    if (status === "REJECTED") return <XCircle className="h-3 w-3" />;
    if (status === "ARCHIVED") return <Archive className="h-3 w-3" />;
    return <Edit className="h-3 w-3" />;
  };

  const getStatusText = (status: string, published: boolean) => {
    if (published && status === "PUBLISHED") return "Publié";
    if (status === "PENDING_REVIEW") return "En attente";
    if (status === "REJECTED") return "Rejeté";
    if (status === "ARCHIVED") return "Archivé";
    return "Brouillon";
  };

  // Gestion de la sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPosts(posts.map(post => post.id));
    } else {
      setSelectedPosts([]);
    }
  };

  const handleSelectPost = (postId: string, checked: boolean) => {
    if (checked) {
      setSelectedPosts(prev => [...prev, postId]);
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId));
    }
  };

  // Actions sur les posts
  const handleDelete = async (postId: string) => {
    startTransition(async () => {
      const result = await deletePostAction(postId);
      
      if (result.success) {
        toast.success("Article supprimé avec succès");
        setPosts(prev => prev.filter(post => post.id !== postId));
        setTotal(prev => prev - 1);
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    });
  };

  const handleBulkPublish = async (published: boolean) => {
    if (selectedPosts.length === 0) return;

    startTransition(async () => {
      const result = await bulkPublishPostsAction({
        postIds: selectedPosts,
        published,
      });

      if (result.success) {
        toast.success(`Articles ${published ? "publiés" : "dépubliés"} avec succès`);
        // Recharger la liste
        router.refresh();
        setSelectedPosts([]);
      } else {
        toast.error(result.error || "Erreur lors de l'opération");
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return;

    startTransition(async () => {
      const result = await bulkDeletePostsAction({
        postIds: selectedPosts,
      });

      if (result.success) {
        toast.success("Articles supprimés avec succès");
        setPosts(prev => prev.filter(post => !selectedPosts.includes(post.id)));
        setTotal(prev => prev - selectedPosts.length);
        setSelectedPosts([]);
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="flex space-x-4">
                      <div className="h-3 bg-muted rounded w-16"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-muted rounded w-16"></div>
                    <div className="h-8 bg-muted rounded w-8"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Edit className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun article trouvé</h3>
          <p className="text-muted-foreground text-center mb-4">
            {Object.keys(searchParams).length > 0 
              ? "Aucun article ne correspond à vos critères de recherche."
              : "Vous n'avez pas encore créé d'article."
            }
          </p>
          <Button asChild>
            <Link href="/dashboard/posts/new">
              Créer votre premier article
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions en lot */}
      {selectedPosts.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedPosts.length} article{selectedPosts.length > 1 ? "s" : ""} sélectionné{selectedPosts.length > 1 ? "s" : ""}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPosts([])}
                >
                  Désélectionner
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkPublish(true)}
                  disabled={isPending}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Publier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkPublish(false)}
                  disabled={isPending}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Dépublier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* En-tête avec sélection */}
      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={selectedPosts.length === posts.length && posts.length > 0}
            onCheckedChange={handleSelectAll}
            indeterminate={selectedPosts.length > 0 && selectedPosts.length < posts.length}
          />
          <span>Tout sélectionner</span>
        </div>
        <span>•</span>
        <span>{total} article{total > 1 ? "s" : ""} au total</span>
      </div>

      {/* Liste des posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                {/* Sélection */}
                <Checkbox
                  checked={selectedPosts.includes(post.id)}
                  onCheckedChange={(checked) => handleSelectPost(post.id, checked as boolean)}
                />

                {/* Contenu principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Titre et statut */}
                      <div className="flex items-center space-x-3 mb-2">
                        <Link 
                          href={`/dashboard/posts/${post.id}/edit`}
                          className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
                        >
                          {post.title}
                        </Link>
                        <Badge className={getStatusColor(post.status, post.published)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(post.status, post.published)}
                            <span>{getStatusText(post.status, post.published)}</span>
                          </div>
                        </Badge>
                      </div>

                      {/* Extrait */}
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Métadonnées */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{post.author.name}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(post.createdAt).toLocaleDateString("fr-FR")}</span>
                        </div>

                        {post.category && (
                          <div className="flex items-center space-x-1">
                            <Folder className="h-3 w-3" />
                            <div className="flex items-center space-x-1">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: post.category.color }}
                              />
                              <span>{post.category.name}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{post.viewCount} vues</span>
                        </div>

                        {post.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <TagIcon className="h-3 w-3" />
                            <span>{post.tags.length} tag{post.tags.length > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.tags.slice(0, 3).map((postTag: any) => (
                            <Badge 
                              key={postTag.tag.id} 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                borderColor: postTag.tag.color || "#6B7280",
                                color: postTag.tag.color || "#6B7280"
                              }}
                            >
                              {postTag.tag.name}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/posts/${post.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild>
                          <Link href={`/posts/${post.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setPostToDelete(post.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          {/* Ici vous pouvez ajouter un composant de pagination */}
          <p className="text-sm text-muted-foreground">
            Page {searchParams.page || 1} sur {pages}
          </p>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les articles sélectionnés</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedPosts.length} article{selectedPosts.length > 1 ? "s" : ""} ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation de suppression individuelle */}
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet article</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (postToDelete) {
                  handleDelete(postToDelete);
                  setPostToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}