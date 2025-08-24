import { ArrowLeft, Calendar, Edit, Eye, User } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PostForm } from "@/components/forms/post-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface EditPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditPostPage({
  params: paramsPromise,
}: EditPostPageProps) {
  const params = await paramsPromise;

  // Vérifier l'authentification
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  // Récupérer l'article
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  // Vérifier les permissions
  const canEdit =
    post.authorId === session.user.id ||
    (!!session.user.role && ["admin", "editor"].includes(session.user.role));

  if (!canEdit) {
    redirect("/dashboard/posts");
  }

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string, published: boolean) => {
    if (published && status === "PUBLISHED")
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (status === "PENDING_REVIEW")
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (status === "REJECTED")
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const getStatusText = (status: string, published: boolean) => {
    if (published && status === "PUBLISHED") return "Publié";
    if (status === "PENDING_REVIEW") return "En attente";
    if (status === "REJECTED") return "Rejeté";
    if (status === "ARCHIVED") return "Archivé";
    return "Brouillon";
  };

  // Préparer les données initiales en convertissant les valeurs null en undefined
  const initialDataForForm = {
    id: post.id,
    title: post.title ?? undefined,
    slug: post.slug ?? undefined,
    content: post.content ?? undefined,
    excerpt: post.excerpt ?? undefined,
    published: post.published ?? undefined,
    categoryId: post.category?.id ?? undefined,
    placeId: post.placeId ?? undefined,
    tags: post.tags ?? undefined,
    coverImage: post.coverImage ?? undefined,
    metaTitle: post.metaTitle ?? undefined,
    metaDescription: post.metaDescription ?? undefined,
    ogImage: post.ogImage ?? undefined,
    canonicalUrl: post.canonicalUrl ?? undefined,
    status: post.status ?? undefined,
  };

  return (
    <div className="space-y-6">
      {/* Navigation et en-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/posts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux articles
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Edit className="h-6 w-6" />
              Modifier l&apos;article
            </h1>
            <p className="text-muted-foreground truncate max-w-md">
              {post.title}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/posts/${post.slug}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </Link>
          </Button>
        </div>
      </div>

      {/* Informations de l'article */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Auteur:</span>
              <span className="font-medium">{post.author.name}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Créé le:</span>
              <span>
                {new Date(post.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Statut:</span>
              <Badge className={getStatusColor(post.status, post.published)}>
                {getStatusText(post.status, post.published)}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Vues:</span>
              <span>{(post.viewCount || 0).toLocaleString()}</span>
            </div>
          </div>

          {post.publishedAt && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Publié le:</span>
                <span className="text-green-600 font-medium">
                  {new Date(post.publishedAt).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )}

          {post.category && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center space-x-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: post.category.color || "#6B7280" }}
                />
                <span className="text-muted-foreground">Catégorie:</span>
                <span>{post.category.name}</span>
              </div>
            </div>
          )}

          {post.tags.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-start space-x-2 text-sm">
                <span className="text-muted-foreground mt-1">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((postTag) => (
                    <Badge
                      key={postTag.tag.id}
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: postTag.tag.color || "#6B7280",
                        color: postTag.tag.color || "#6B7280",
                      }}
                    >
                      {postTag.tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avertissement si l'utilisateur n'est pas l'auteur */}
      {post.authorId !== session.user.id &&
        session.user.role &&
        ["admin", "editor"].includes(session.user.role) && (
          <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/50">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
                <Edit className="h-4 w-4" />
                <span className="font-medium">
                  Vous modifiez l&apos;article d&apos;un autre utilisateur
                </span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                En tant qu&apos;
                {session.user.role === "admin" ? "administrateur" : "éditeur"},
                vous pouvez modifier cet article de {post.author.name}.
              </p>
            </CardContent>
          </Card>
        )}

      {/* Formulaire de modification */}
      <PostForm mode="edit" initialData={initialDataForForm} />
    </div>
  );
}

// Métadonnées dynamiques
export async function generateMetadata({
  params: paramsPromise,
}: EditPostPageProps) {
  const params = await paramsPromise;
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    select: { title: true },
  });

  return {
    title: `Modifier "${post?.title || "Article"}" - Dashboard`,
    description: "Modifier un article existant",
  };
}
