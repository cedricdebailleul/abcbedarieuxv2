import { ArrowRight, Calendar, Eye, FileText, Folder, Tag, User } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    content?: string | null;
    published: boolean;
    publishedAt?: Date | null;
    createdAt: Date;
    viewCount?: number | null;
    coverImage?: string | null;
    author: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    category?: {
      id: string;
      name: string;
      slug: string;
      color?: string | null;
    } | null;
    place?: {
      id: string;
      name: string;
      slug: string;
      type: string;
      city?: string | null;
    } | null;
    tags: {
      tag: {
        id: string;
        name: string;
        slug: string;
        color?: string | null;
      };
    }[];
  };
  variant?: "default" | "compact" | "featured";
  showAuthor?: boolean;
  showExcerpt?: boolean;
  showTags?: boolean;
  showCategory?: boolean;
  showPlace?: boolean;
  showViewCount?: boolean;
  className?: string;
}

export function PostCard({
  post,
  variant = "default",
  showAuthor = true,
  showExcerpt = true,
  showTags = true,
  showCategory = true,
  showViewCount = true,
  className = "",
}: PostCardProps) {
  // Fonction pour obtenir les initiales
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Fonction pour extraire du texte brut du contenu HTML (simple)
  const getPlainText = (html: string) => {
    return html.replace(/<[^>]*>/g, "").trim();
  };

  // Obtenir l'extrait à afficher
  const displayExcerpt =
    post.excerpt || (post.content ? `${getPlainText(post.content).substring(0, 150)}...` : "");

  // Date de publication ou de création
  const displayDate = post.publishedAt || post.createdAt;

  if (variant === "compact") {
    const getGradientForId = (id: string): string => {
      const gradients = [
        'from-blue-400 to-blue-600',
        'from-purple-400 to-purple-600',
        'from-green-400 to-green-600',
        'from-orange-400 to-orange-600',
        'from-red-400 to-red-600',
        'from-pink-400 to-pink-600',
        'from-indigo-400 to-indigo-600',
        'from-teal-400 to-teal-600',
        'from-cyan-400 to-cyan-600',
        'from-yellow-400 to-yellow-600',
        'from-emerald-400 to-emerald-600',
        'from-violet-400 to-violet-600'
      ];
      const index = id.charCodeAt(0) % gradients.length;
      return gradients[index];
    };

    return (
      <Link href={`/posts/${post.slug}`}>
        <Card className={`group transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden h-full flex flex-col ${className}`}>
          {/* Image de couverture ou dégradé */}
          <div className="relative h-48 w-full overflow-hidden">
            {post.coverImage ? (
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className={`h-full w-full bg-gradient-to-br ${getGradientForId(post.id)} flex items-center justify-center`}>
                <div className="text-white/80 text-center p-4">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-medium opacity-80">{post.title.substring(0, 30)}...</p>
                </div>
              </div>
            )}
            {post.category && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-white/90 text-black border-0 text-xs">
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: post.category.color || "#6B7280" }}
                  />
                  {post.category.name}
                </Badge>
              </div>
            )}
          </div>

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
                  {post.title}
                </CardTitle>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 mt-auto">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-3">
                {showAuthor && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{post.author.name}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{displayDate.toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              {showViewCount && (
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{(post.viewCount || 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Card className={`group hover:shadow-lg transition-all duration-300 ${className}`}>
        {/* Image de couverture */}
        {post.coverImage && (
          <div className="relative overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              className="w-full h-48 object-cover transition-transform duration-300"
              width={600}
              height={300}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            {/* Catégorie overlay sur l'image */}
            {showCategory && post.category && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-white/90 text-black border-0">
                  <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: post.category.color || "#6B7280" }}
                  />
                  {post.category.name}
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardHeader className="pb-3">
          {/* Catégorie (si pas d'image de couverture) */}
          {!post.coverImage && showCategory && post.category && (
            <div className="flex items-center space-x-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: post.category.color || "#6B7280" }}
              />
              <Badge variant="secondary" className="text-xs">
                <Folder className="h-3 w-3 mr-1" />
                {post.category.name}
              </Badge>
            </div>
          )}

          {/* Titre */}
          <Link
            href={`/posts/${post.slug}`}
            className="block group-hover:text-primary transition-colors"
          >
            <h2 className="text-xl font-bold leading-tight line-clamp-2 mb-2">{post.title}</h2>
          </Link>

          {/* Extrait */}
          {showExcerpt && displayExcerpt && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
              {displayExcerpt}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Tags */}
            {showTags && post.tags.length > 0 && (
              <div className="flex items-start space-x-2">
                <Tag className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((postTag) => (
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
                  {post.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{post.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Métadonnées */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-3">
                {/* Auteur */}
                {showAuthor && (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={post.author.image || undefined}
                        alt={post.author.name || "Auteur"}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(post.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{post.author.name}</span>
                  </div>
                )}

                {showAuthor && <Separator orientation="vertical" className="h-3" />}

                {/* Date */}
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{displayDate.toLocaleDateString("fr-FR")}</span>
                </div>

                {showViewCount && <Separator orientation="vertical" className="h-3" />}

                {/* Vues */}
                {showViewCount && (
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{(post.viewCount || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Bouton Lire la suite */}
              <Link href={`/posts/${post.slug}`}>
                <Button variant="outline" size="sm" className="h-auto py-1 px-3">
                  Lire la suite
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant par défaut
  return (
    <Card className={`group hover:shadow-md transition-shadow ${className}`}>
      {/* Image de couverture */}
      {post.coverImage && (
        <div className="relative overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            className="w-full h-40 object-cover transition-transform duration-300"
            width={600}
            height={300}
          />
          {/* Catégorie overlay sur l'image */}
          {showCategory && post.category && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-white/90 text-black border-0 text-xs">
                <div
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: post.category.color || "#6B7280" }}
                />
                {post.category.name}
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardHeader className="pb-3">
        {/* Catégorie (si pas d'image de couverture) */}
        {!post.coverImage && showCategory && post.category && (
          <div className="flex items-center space-x-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: post.category.color || "#6B7280" }}
            />
            <Badge variant="secondary" className="text-xs">
              <Folder className="h-3 w-3 mr-1" />
              {post.category.name}
            </Badge>
          </div>
        )}

        {/* Titre */}
        <Link
          href={`/posts/${post.slug}`}
          className="block group-hover:text-primary transition-colors"
        >
          <h3 className="font-semibold leading-tight line-clamp-2">{post.title}</h3>
        </Link>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Extrait */}
          {showExcerpt && displayExcerpt && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
              {displayExcerpt}
            </p>
          )}

          {/* Tags */}
          {showTags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((postTag) => (
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
              {post.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{post.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Métadonnées */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center space-x-3">
              {/* Auteur */}
              {showAuthor && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{post.author.name}</span>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{displayDate.toLocaleDateString("fr-FR")}</span>
              </div>

              {/* Vues */}
              {showViewCount && (
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{(post.viewCount || 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Bouton Lire */}
            <Link href={`/posts/${post.slug}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
