"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Star,
  MessageSquare,
  User,
  Calendar,
  ExternalLink,
  Filter,
  Plus,
  Edit3,
} from "lucide-react";
import { ReviewForm } from "./review-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import type { Review, GoogleReview } from "@/types/review";

interface PlaceReviewsTabProps {
  placeId: string;
  placeName: string;
  reviews: Review[] | undefined;
  googleReviews: GoogleReview[] | undefined;
}

// Discriminated union to represent either a site review or a Google review after merging
type MixedReview =
  | (Review & { type: "site" })
  | (GoogleReview & { type: "google" });

export function PlaceReviewsTab({
  placeId,
  placeName,
  reviews = [],
  googleReviews = [],
}: PlaceReviewsTabProps) {
  const safeReviews = useMemo(() => reviews || [], [reviews]);
  const safeGoogleReviews = useMemo(() => googleReviews || [], [googleReviews]);

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentReviews, setCurrentReviews] = useState<Review[]>(safeReviews);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { status } = useSession();

  // Synchroniser les reviews avec les props
  useEffect(() => {
    setCurrentReviews(safeReviews);
  }, [safeReviews]);

  // Vérifier si l'utilisateur a déjà un avis
  useEffect(() => {
    if (status === "authenticated") {
      fetch(`/api/places/${placeId}/reviews/user`)
        .then((res) => res.json())
        .then((data) => {
          if (data.hasReview && data.review) {
            setUserReview(data.review);
          }
        })
        .catch((error) => {
          console.error("Error fetching user review:", error);
        });
    }
  }, [placeId, status]);

  // Fonction pour rafraîchir les avis après ajout/modification
  const handleReviewAdded = () => {
    setShowReviewForm(false);
    setIsEditing(false);
    // Rafraîchir la page pour récupérer les nouveaux avis
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  // Fonction pour démarrer l'édition
  const handleEditReview = () => {
    setIsEditing(true);
    setShowReviewForm(true);
  };

  // Fonction pour annuler l'édition
  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowReviewForm(false);
  };

  // Calcul des statistiques globales
  const allRatings = [
    ...currentReviews.filter((r) => r.rating).map((r) => r.rating!),
    ...safeGoogleReviews.map((r) => r.rating),
  ];

  const averageRating =
    allRatings.length > 0
      ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
      : 0;

  const totalReviews = currentReviews.length + safeGoogleReviews.length;

  // Distribution des notes
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = allRatings.filter((r) => r === rating).length;
    const percentage =
      allRatings.length > 0 ? (count / allRatings.length) * 100 : 0;
    return { rating, count, percentage };
  });

  // Filtrage par note
  const filteredReviews = selectedRating
    ? currentReviews.filter((r) => r.rating === selectedRating)
    : currentReviews;

  const filteredGoogleReviews = selectedRating
    ? safeGoogleReviews.filter((r) => r.rating === selectedRating)
    : safeGoogleReviews;

  const renderStars = (
    rating: number | null | undefined,
    className?: string
  ) => {
    const value = rating ?? 0;
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Titre de l'onglet */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Avis et évaluations
        </h2>

        {/* Bouton pour ajouter/modifier un avis */}
        {status === "authenticated" && (
          <div className="flex gap-2">
            {userReview ? (
              <>
                <Button
                  onClick={handleEditReview}
                  variant="outline"
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Modifier mon avis
                </Button>
                {showReviewForm && (
                  <Button
                    onClick={handleCancelEdit}
                    variant="ghost"
                    className="gap-2"
                  >
                    Annuler
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={() => setShowReviewForm(!showReviewForm)}
                variant={showReviewForm ? "outline" : "default"}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {showReviewForm ? "Annuler" : "Laisser un avis"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Formulaire d'avis */}
      {showReviewForm && (
        <ReviewForm
          placeId={placeId}
          placeName={placeName}
          onReviewAdded={handleReviewAdded}
          existingReview={userReview}
          isEditing={isEditing}
        />
      )}

      {/* Avis existant de l'utilisateur */}
      {userReview && !showReviewForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-yellow-500" />
              Votre avis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {renderStars(userReview.rating)}
                <span className="text-sm text-muted-foreground">
                  {new Date(userReview.createdAt).toLocaleDateString("fr-FR")}
                  {userReview.updatedAt &&
                    userReview.updatedAt !== userReview.createdAt &&
                    " (modifié)"}
                </span>
              </div>
              {userReview.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {userReview.comment}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Statistiques globales */}
      {totalReviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Résumé des avis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Note moyenne */}
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {averageRating.toFixed(1)}
                </div>
                {renderStars(Math.round(averageRating), "justify-center mb-2")}
                <p className="text-sm text-muted-foreground">
                  Basé sur {totalReviews} avis
                </p>
              </div>

              {/* Distribution des notes */}
              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-3">{rating}</span>
                    <Star className="h-3 w-3 text-yellow-400" />
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      {totalReviews > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrer par note :</span>
              <Button
                variant={selectedRating === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRating(null)}
              >
                Toutes
              </Button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <Button
                  key={rating}
                  variant={selectedRating === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRating(rating)}
                  className="gap-1"
                >
                  {rating}
                  <Star className="h-3 w-3" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets des avis */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Tous ({totalReviews})
          </TabsTrigger>
          <TabsTrigger value="site" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Site ({filteredReviews.length})
          </TabsTrigger>
          <TabsTrigger value="google" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Google ({filteredGoogleReviews.length})
          </TabsTrigger>
        </TabsList>

        {/* All - combined reviews (site + google), sorted by date */}
        <TabsContent value="all" className="mt-6 space-y-4">
          {(() => {
            const mergedReviews: MixedReview[] = [
              ...filteredReviews.map((r) => ({ ...r, type: "site" as const })),
              ...filteredGoogleReviews.map((r) => ({
                ...r,
                type: "google" as const,
              })),
            ];

            const sorted = mergedReviews.sort((a, b) => {
              const dateA = new Date(a.createdAt);
              const dateB = new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime();
            });

            if (sorted.length === 0) {
              return (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucun avis pour le moment
                  </h3>
                  <p className="text-muted-foreground">
                    Soyez le premier à laisser un avis sur ce lieu !
                  </p>
                </div>
              );
            }

            return sorted.slice(0, 10).map((review) => (
              <Card key={`${review.type}-${review.id}`} className="relative">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* En-tête */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {review.type === "site"
                              ? review.user.name
                              : review.author}
                          </span>
                          <Badge
                            variant={
                              review.type === "site" ? "default" : "secondary"
                            }
                          >
                            {review.type === "site"
                              ? "ABC Bédarieux"
                              : "Google"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {review.rating && renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(review.createdAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Commentaire */}
                    {review.comment && (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {review.comment}
                      </p>
                    )}

                    {/* Lien vers Google pour les avis Google */}
                    {review.type === "google" && review.reviewUrl && (
                      <div className="pt-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={review.reviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gap-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Voir sur Google
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ));
          })()}
        </TabsContent>

        <TabsContent value="site" className="mt-6 space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{review.user.name}</span>
                      <Badge variant="default">ABC Bédarieux</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.rating && renderStars(review.rating)}
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredReviews.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {selectedRating
                  ? "Aucun avis avec cette note"
                  : "Aucun avis du site"}
              </h3>
              <p className="text-muted-foreground">
                {selectedRating
                  ? "Essayez de changer le filtre de notation"
                  : "Les avis des utilisateurs du site apparaîtront ici"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="google" className="mt-6 space-y-4">
          {filteredGoogleReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{review.author}</span>
                      <Badge variant="secondary">Google</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                  {review.reviewUrl && (
                    <div className="pt-2">
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={review.reviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gap-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir sur Google
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredGoogleReviews.length === 0 && (
            <div className="text-center py-12">
              <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {selectedRating
                  ? "Aucun avis Google avec cette note"
                  : "Aucun avis Google"}
              </h3>
              <p className="text-muted-foreground">
                {selectedRating
                  ? "Essayez de changer le filtre de notation"
                  : "Les avis Google apparaîtront ici une fois synchronisés"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
