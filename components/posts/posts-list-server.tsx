import {
  Calendar,
  Clock,
  Edit,
  Eye,
  Folder,
  Globe,
  MoreHorizontal,
  Tag as TagIcon,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { getPostsAction } from "@/actions/post";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostsFilters } from "./posts-filters";

interface PostsListServerProps {
  searchParams: {
    search?: string;
    status?: string;
    categoryId?: string;
    tagId?: string;
    published?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export async function PostsListServer({ searchParams }: PostsListServerProps) {
  // Récupérer les posts avec les filtres
  const result = await getPostsAction({
    search: searchParams.search || "",
    status: searchParams.status as
      | "PUBLISHED"
      | "DRAFT"
      | "PENDING_REVIEW"
      | "ARCHIVED"
      | "REJECTED"
      | undefined,
    categoryId: searchParams.categoryId || "",
    tagId: searchParams.tagId || "",
    published:
      searchParams.published === "true"
        ? true
        : searchParams.published === "false"
        ? false
        : undefined,
    page: parseInt(searchParams.page || "1"),
    limit: parseInt(searchParams.limit || "10"),
    sortBy:
      (searchParams.sortBy as
        | "createdAt"
        | "updatedAt"
        | "publishedAt"
        | "title"
        | "viewCount"
        | undefined) || "createdAt",
    sortOrder: (searchParams.sortOrder as "asc" | "desc" | undefined) || "desc",
  });

  if (!result.success || !result.data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Erreur lors du chargement des articles
        </p>
      </div>
    );
  }

  const {
    posts,
    total,
    pages,
  }: {
    posts: {
      id: string;
      title: string;
      slug: string;
      author: { id: string; name: string };
      category?: { id: string; name: string } | undefined;
      tags: { tag: { id: string; name: string } }[];
      excerpt?: string;
      published: boolean;
      createdAt: string;
      publishedAt?: string | null;
      viewCount: number;
      status:
        | "PUBLISHED"
        | "DRAFT"
        | "PENDING_REVIEW"
        | "ARCHIVED"
        | "REJECTED";
    }[];
    total: number;
    pages: number;
  } = {
    posts: result.data.posts.map(
      (post: {
        id: string;
        title: string;
        slug: string;
        author: { id: string; name: string };
        category?: { id: string; name: string } | undefined;
        tags: { tag: { id: string; name: string } }[];
        excerpt?: string;
        published?: boolean;
        createdAt?: string;
        publishedAt?: string | null;
        viewCount?: number;
        status?:
          | "PUBLISHED"
          | "DRAFT"
          | "PENDING_REVIEW"
          | "ARCHIVED"
          | "REJECTED";
      }) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        author: post.author,
        category: post.category,
        tags: post.tags,
        excerpt: post.excerpt ?? "",
        published: post.published ?? false,
        createdAt: post.createdAt ?? "",
        publishedAt: post.publishedAt ?? null,
        viewCount: post.viewCount ?? 0,
        status: post.status ?? "DRAFT",
      })
    ),
    total: result.data.total,
    pages: result.data.pages,
  };

  if (posts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filtres */}
        <PostsFilters searchParams={searchParams} />

        <div className="text-center py-8">
          <h3 className="text-lg font-semibold mb-2">Aucun article trouvé</h3>
          <p className="text-muted-foreground mb-4">
            {Object.keys(searchParams).length > 0
              ? "Aucun article ne correspond à vos critères de recherche."
              : "Vous n'avez pas encore d'articles. Créez votre premier article !"}
          </p>
          <Button asChild>
            <Link href="/dashboard/posts/new">Créer un article</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <PostsFilters searchParams={searchParams} />

      {/* Résultats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} article{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            Page {parseInt(searchParams.page || "1")} sur {pages}
          </p>
        </div>

        {/* Liste des posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Titre et statut */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg leading-tight">
                          <Link
                            href={`/dashboard/posts/${post.slug}/edit`}
                            className="hover:text-primary transition-colors"
                          >
                            {post.title}
                          </Link>
                        </h3>
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            post.status === "PUBLISHED"
                              ? "default"
                              : post.status === "DRAFT"
                              ? "secondary"
                              : post.status === "PENDING_REVIEW"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {post.status === "PUBLISHED" && "Publié"}
                          {post.status === "DRAFT" && "Brouillon"}
                          {post.status === "PENDING_REVIEW" && "En attente"}
                          {post.status === "ARCHIVED" && "Archivé"}
                          {post.status === "REJECTED" && "Rejeté"}
                        </Badge>
                        {post.published && (
                          <Badge variant="outline" className="text-green-600">
                            <Globe className="h-3 w-3 mr-1" />
                            En ligne
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Métadonnées */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {/* Auteur */}
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {post.author?.name || "Auteur inconnu"}
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Créé le{" "}
                        {new Date(post.createdAt).toLocaleDateString("fr-FR")}
                      </div>

                      {post.publishedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Publié le{" "}
                          {new Date(post.publishedAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </div>
                      )}

                      {/* Statistiques */}
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.viewCount || 0} vue
                        {(post.viewCount || 0) > 1 ? "s" : ""}
                      </div>
                    </div>

                    {/* Catégorie et Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {post.category && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Folder className="h-3 w-3" />
                          {post.category.name}
                        </Badge>
                      )}

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <TagIcon className="h-3 w-3 text-muted-foreground" />
                          <div className="flex flex-wrap gap-1">
                            {post.tags
                              .slice(0, 3)
                              .map(
                                (postTag: {
                                  tag: { id: string; name: string };
                                }) => (
                                  <Badge
                                    key={postTag.tag.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {postTag.tag.name}
                                  </Badge>
                                )
                              )}
                            {post.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
                        <Link href={`/dashboard/posts/${post.slug}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      {post.published && (
                        <DropdownMenuItem asChild>
                          <Link href={`/posts/${post.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center space-x-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={parseInt(searchParams.page || "1") === 1}
            >
              <Link
                href={{
                  pathname: "/dashboard/posts",
                  query: {
                    ...searchParams,
                    page: Math.max(
                      1,
                      parseInt(searchParams.page || "1") - 1
                    ).toString(),
                  },
                }}
              >
                Précédent
              </Link>
            </Button>

            <span className="text-sm text-muted-foreground px-4">
              Page {parseInt(searchParams.page || "1")} sur {pages}
            </span>

            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={parseInt(searchParams.page || "1") === pages}
            >
              <Link
                href={{
                  pathname: "/dashboard/posts",
                  query: {
                    ...searchParams,
                    page: Math.min(
                      pages,
                      parseInt(searchParams.page || "1") + 1
                    ).toString(),
                  },
                }}
              >
                Suivant
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
