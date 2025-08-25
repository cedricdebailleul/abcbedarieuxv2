"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlacePostsAction } from "@/actions/place-posts";
import { PostCard } from "@/components/posts/post-card";
import { Card, CardContent } from "@/components/ui/card";

interface PlaceArticlesTabProps {
  placeId: string;
}

interface PostData {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  published: boolean;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  coverImage?: string | null;
  author: { id: string; name: string; image?: string | null };
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
  tags: Array<{
    tag: { id: string; name: string; slug: string; color?: string | null };
  }>;
}

export function PlaceArticlesTab({ placeId }: PlaceArticlesTabProps) {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const result = await getPlacePostsAction(placeId, 6);
        if (result.success && result.data) {
          setPosts(result.data);
        } else {
          setError(result.error || "Erreur lors du chargement des articles");
        }
      } catch (err) {
        console.error("Erreur lors du chargement des articles:", err);
        setError("Erreur lors du chargement des articles");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [placeId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Articles
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              Chargement des articles...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Articles
        </h2>
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-destructive font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Articles
          {posts.length > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-primary bg-primary/10 rounded-full">
              {posts.length}
            </span>
          )}
        </h2>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucun article</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Aucun article n&apos;a encore été publié pour cet établissement.
                Revenez plus tard pour découvrir du nouveau contenu !
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              variant="compact"
              showAuthor={true}
              showExcerpt={true}
              showCategory={true}
              showPlace={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
