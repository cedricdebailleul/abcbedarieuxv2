import { ArrowRight, FileText, MapPin } from "lucide-react";
import Link from "next/link";
import { getLatestPostsAction } from "@/actions/post";
import { getUpcomingEventsAction } from "@/actions/event";
import { getFeaturedPlacesAction } from "@/actions/place";
import Hero from "@/components/front/hero";
import { PostCard } from "@/components/posts/post-card";
import { PlacePreviewCard } from "@/components/places/place-preview-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActionsSection } from "@/components/actions/actions-section";
import { CTASection } from "@/components/sections/cta-section";
import { PartnersSection } from "@/components/sections/partners-section";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function Home() {
  // Récupérer les derniers articles
  const latestPostsResult = await getLatestPostsAction(6);
  const latestPosts = latestPostsResult.success ? latestPostsResult.data! : [];

  // Récupérer les événements à venir
  const upcomingEventsResult = await getUpcomingEventsAction(5);

  // Récupérer les places en vedette
  const featuredPlacesResult = await getFeaturedPlacesAction(6);
  const upcomingEvents = upcomingEventsResult.success
    ? upcomingEventsResult.data!.map(
        (event: {
          id: string;
          title: string;
          startDate: Date;
          endDate: Date;
          place?: { name: string; street: string; city: string };
          slug?: string;
          category?: string;
          additionalInfo?: string;
          price?: number;
          maxParticipants?: number;
        }) => ({
          ...event,
          description: "", // Default value since 'description' does not exist on the event type
          slug: event.slug || "",
          location: event.place?.name || "",
          category: event.category || "",
          additionalInfo: event.additionalInfo || "",
          price: event.price || 0,
          maxParticipants: event.maxParticipants || 0,
        })
      )
    : [];

  // Traiter les places en vedette
  const featuredPlaces = featuredPlacesResult.success
    ? featuredPlacesResult.data!
    : [];

  return (
    <>
      <Hero upcomingEvents={upcomingEvents} />

      {/* Section des actions */}
      <ActionsSection
        featuredOnly={true}
        limit={4}
        layout="columns"
        title="Nos Actions Phares"
        description="Découvrez nos principales initiatives pour soutenir et dynamiser le commerce local à Bédarieux"
      />

      {/* Section des places en vedette */}
      {featuredPlaces.length > 0 && (
        <section className="py-16 container mx-auto px-8">
          <div>
            {/* En-tête de section */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  Établissements en vedette
                </h2>
                <p className="text-muted-foreground">
                  Découvrez les commerces et services mis en avant à Bédarieux
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/carte">
                  <MapPin className="size-4 mr-2" />
                  Voir la carte
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Grille des places */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPlaces.map((place) => (
                <PlacePreviewCard key={place.id} place={place} />
              ))}
            </div>

            {/* Message si aucune place */}
            {featuredPlaces.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucun établissement en vedette
                  </h3>
                  <p className="text-muted-foreground">
                    Les établissements mis en avant apparaîtront ici
                    prochainement.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Section des derniers articles */}
      {latestPosts.length > 0 && (
        <section className="py-16 container mx-auto px-8">
          <div>
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

      {/* Section call-to-action */}
      <CTASection />
      <PartnersSection />
    </>
  );
}
