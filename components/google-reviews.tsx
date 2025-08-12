"use client";

import { useState } from "react";
import { Star, User, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface GoogleReview {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  authorUrl: string | null;
  relativeTime: string | null;
  googleTime: number;
  createdAt: string;
}

interface GoogleReviewsProps {
  reviews: GoogleReview[];
  className?: string;
}

// Composant étoiles
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

// Composant avis individuel
function ReviewItem({ review }: { review: GoogleReview }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shouldTruncate = review.comment && review.comment.length > 200;
  const displayText = shouldTruncate && !isExpanded 
    ? review.comment.substring(0, 200) + "..."
    : review.comment;

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{review.authorName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.rating} />
                  {review.relativeTime && (
                    <span className="text-sm text-gray-500">
                      {review.relativeTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {review.comment && (
              <div className="text-gray-700 text-sm leading-relaxed">
                <p>{displayText}</p>
                
                {shouldTruncate && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-1 p-0 h-auto text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? (
                      <>
                        Voir moins <ChevronUp className="h-3 w-3 ml-1" />
                      </>
                    ) : (
                      <>
                        Voir plus <ChevronDown className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GoogleReviews({ reviews, className = "" }: GoogleReviewsProps) {
  const [showAll, setShowAll] = useState(false);
  
  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Trier par date (plus récent en premier)
  const sortedReviews = reviews.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Afficher seulement les 3 premiers par défaut
  const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, 3);

  // Calculer la moyenne
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Avis Google</h3>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold">
                    {averageRating.toFixed(1)}
                  </span>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="text-sm text-gray-500">
                  {reviews.length} avis
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Liste des avis */}
      <div>
        {displayedReviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>

      {/* Bouton "Voir plus" */}
      {reviews.length > 3 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Voir moins" : `Voir les ${reviews.length - 3} autres avis`}
          </Button>
        </div>
      )}
    </div>
  );
}