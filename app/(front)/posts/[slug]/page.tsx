import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Folder,
  Tag,
  User,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SocialShare } from "@/components/shared/social-share";
import { PostSchema } from "@/components/structured-data/post-schema";
import { PrintHeader } from "@/components/print/print-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePostShareData } from "@/lib/share-utils";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    preview?: string;
  }>;
}

export default async function PostPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: PostPageProps) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;

  // Vérifier si c'est un aperçu (preview mode)
  const isPreview = searchParams.preview === "true";

  // Si en mode preview, vérifier l'authentification
  if (isPreview) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      notFound();
    }
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

  // En mode normal (pas preview), l'article doit être publié
  if (!isPreview && (!post.published || post.status !== "PUBLISHED")) {
    notFound();
  }

  // Incrémenter les vues seulement si ce n'est pas un aperçu
  if (!isPreview) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  // Fonction pour obtenir les initiales
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Date formatée
  const publishedDate = post.publishedAt || post.createdAt;
  const formattedDate = new Date(publishedDate).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Estimation du temps de lecture (environ 200 mots par minute)
  const wordCount = post.content
    ? post.content.replace(/<[^>]*>/g, "").split(/\s+/).length
    : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <>
      {/* Données structurées pour SEO et réseaux sociaux */}
      <PostSchema post={post} />

      {/* En-tête d'impression */}
      <PrintHeader
        title={post.title}
        subtitle={`Article - ${formattedDate}`}
        date={post.category?.name || "ABC Bédarieux"}
      />

      {/* Mode aperçu */}
      {isPreview && (
        <div className="bg-orange-100 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
              <Eye className="h-4 w-4" />
              <span className="font-medium">Mode aperçu</span>
              <span className="text-sm">
                - Cet article n&apos;est peut-être pas encore publié
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Full width, below header */}
      <section className="relative min-h-screen flex items-end -mt-16 pt-16">
        {/* Background Image */}
        {post.coverImage ? (
          <div className="absolute inset-0">
            <Image
              src={post.coverImage}
              alt={post.title}
              height={800}
              width={1200}
              className="w-full h-full object-center"
              loading="eager"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </div>
        ) : (
          // Fallback gradient si pas d'image
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        )}

        {/* Hero Content */}
        <div className="relative z-10 w-full">
          <div className="container mx-auto px-4 pb-12 pt-8">
            {/* Navigation */}
            <div className="mb-8">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
              >
                <Link href="/articles">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux articles
                </Link>
              </Button>
            </div>

            {/* Category Badge */}
            {post.category && (
              <div className="mb-6">
                <Badge
                  className="bg-white/15 backdrop-blur-md border-white/20 text-white hover:bg-white/25"
                  style={{
                    borderLeftColor: post.category.color || "#6B7280",
                    borderLeftWidth: "4px",
                  }}
                >
                  <Folder className="h-3 w-3 mr-2" />
                  {post.category.name}
                </Badge>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight max-w-4xl">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-white/80">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min de lecture</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>{(post.viewCount || 0).toLocaleString()} vues</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Article Content */}
          <div className="lg:col-span-2">
            <article>
              {/* Content */}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {post.content ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: post.content }}
                    className="leading-relaxed"
                  />
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg">
                      Aucun contenu disponible pour cet article.
                    </p>
                  </div>
                )}
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              {/* Author Card */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Auteur
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={post.author.image || undefined}
                        alt={post.author.name || "Auteur"}
                      />
                      <AvatarFallback className="text-lg">
                        {getInitials(post.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg">
                        {post.author.name || "Auteur anonyme"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Publié le {formattedDate}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags Card */}
              {post.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center">
                      <Tag className="h-5 w-5 mr-2" />
                      Tags
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((postTag) => (
                        <Badge
                          key={postTag.tag.id}
                          variant="outline"
                          className="hover:scale-105 transition-transform cursor-pointer"
                          style={{
                            borderColor: postTag.tag.color || "#6B7280",
                            color: postTag.tag.color || "#6B7280",
                          }}
                        >
                          {postTag.tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Article Stats */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Statistiques</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vues</span>
                    <Badge variant="secondary">
                      {(post.viewCount || 0).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Temps de lecture
                    </span>
                    <Badge variant="secondary">{readingTime} min</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mots</span>
                    <Badge variant="secondary">
                      ~{wordCount.toLocaleString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Share Card */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Partager</h3>
                </CardHeader>
                <CardContent>
                  <SocialShare
                    data={generatePostShareData(post)}
                    variant="outline"
                    size="sm"
                  />
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      {/* SEO Debug (only in development) */}
      {process.env.NODE_ENV === "development" &&
        (post.canonicalUrl || post.ogImage) && (
          <div className="border-t bg-muted/30">
            <div className="container mx-auto px-4 py-6">
              <details className="text-xs">
                <summary className="font-medium text-muted-foreground cursor-pointer">
                  Informations SEO (développement uniquement)
                </summary>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  {post.canonicalUrl && (
                    <div>
                      <span className="font-medium">URL canonique:</span>{" "}
                      <a
                        href={post.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {post.canonicalUrl}
                      </a>
                    </div>
                  )}
                  {post.ogImage && (
                    <div>
                      <span className="font-medium">Image OG:</span>{" "}
                      <a
                        href={post.ogImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Voir l&apos;image
                      </a>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        )}
    </>
  );
}

// Métadonnées dynamiques
export async function generateMetadata({
  params: paramsPromise,
}: PostPageProps) {
  const params = await paramsPromise;
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: {
      author: {
        select: {
          name: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!post) {
    return {
      title: "Article introuvable",
      description: "L'article demandé n'a pas été trouvé.",
    };
  }

  // URL absolue pour l'image
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const ogImg = post.ogImage || post.coverImage;
  const absoluteImageUrl = ogImg
    ? ogImg.startsWith("http")
      ? ogImg
      : `${baseUrl}${ogImg}`
    : `${baseUrl}/images/og-post-default.jpg`;

  return {
    title: post.metaTitle || post.title,
    description:
      post.metaDescription ||
      post.excerpt ||
      "Lisez cet article sur ABC Bédarieux",
    openGraph: {
      title: post.title,
      description:
        post.metaDescription ||
        post.excerpt ||
        "Article publié sur ABC Bédarieux",
      url: `${baseUrl}/posts/${params.slug}`,
      siteName: "ABC Bédarieux",
      locale: "fr_FR",
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author?.name || "ABC Bédarieux"],
      section: post.category?.name,
      tags: post.tags?.map((pt) => pt.tag.name),
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description:
        post.metaDescription ||
        post.excerpt ||
        "Article publié sur ABC Bédarieux",
      images: [absoluteImageUrl],
      creator: "@abc_bedarieux",
    },
    alternates: post.canonicalUrl
      ? {
          canonical: post.canonicalUrl,
        }
      : undefined,
  };
}
