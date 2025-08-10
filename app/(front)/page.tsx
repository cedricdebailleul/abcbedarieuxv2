import Hero from "@/components/front/hero";
import { getLatestPostsAction } from "@/actions/post";
import { PostCard } from "@/components/posts/post-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  // Récupérer les derniers articles
  const latestPostsResult = await getLatestPostsAction(6);
  const latestPosts = latestPostsResult.success ? latestPostsResult.data! : [];

  return (
    <>
      <Hero />

      {/* Section des derniers articles */}
      {latestPosts.length > 0 && (
        <section className="py-16">
          <div className="mx-auto">
            {/* En-tête de section */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Derniers articles</h2>
                <p className="text-muted-foreground">
                  Découvrez nos dernières publications sur ABC Bédarieux
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/articles">
                  Voir tous les articles
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Article en vedette (le plus récent) */}
            <div className="mb-8">
              <PostCard
                post={latestPosts[0]}
                variant="featured"
                className="max-w-none"
              />
            </div>

            {/* Autres articles */}
            {latestPosts.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestPosts.slice(1).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* Message si aucun article */}
            {latestPosts.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucun article publié
                  </h3>
                  <p className="text-muted-foreground">
                    Les articles publiés apparaîtront ici prochainement.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}
    </>
  );
}
