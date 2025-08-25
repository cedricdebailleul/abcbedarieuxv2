"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, Send, MessageSquare, LogIn, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import type { Review } from "@/types/review";

const reviewFormSchema = z.object({
  rating: z
    .number()
    .min(1, "Veuillez sélectionner une note")
    .max(5, "La note maximum est 5"),
  comment: z
    .string()
    .min(10, "Le commentaire doit faire au moins 10 caractères")
    .optional()
    .or(z.literal("")),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  placeId: string;
  placeName: string;
  onReviewAdded?: () => void;
  existingReview?: Review | null;
  isEditing?: boolean;
}

export function ReviewForm({
  placeId,
  placeName,
  onReviewAdded,
  existingReview,
  isEditing = false,
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { status } = useSession();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: existingReview?.rating ?? 0,
      comment: existingReview?.comment || "",
    },
  });

  // Mettre à jour le formulaire quand existingReview change
  useEffect(() => {
    if (existingReview) {
      form.setValue("rating", existingReview.rating ?? 0);
      form.setValue("comment", existingReview.comment || "");
    }
  }, [existingReview, form]);

  const watchedRating = form.watch("rating");

  async function onSubmit(data: ReviewFormData) {
    setIsSubmitting(true);

    try {
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(`/api/places/${placeId}/reviews`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Erreur lors de ${isEditing ? "la modification" : "l'ajout"} de l'avis`
        );
      }

      toast.success(`Avis ${isEditing ? "modifié" : "ajouté"} avec succès !`);
      if (!isEditing) {
        form.reset();
      }
      onReviewAdded?.();
    } catch (error) {
      console.error(
        `Erreur lors de ${isEditing ? "la modification" : "l'ajout"} de l'avis:`,
        error
      );
      toast.error(
        error instanceof Error
          ? error.message
          : `Erreur lors de ${isEditing ? "la modification" : "l'ajout"} de l'avis. Veuillez réessayer.`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderStarRating = () => {
    const displayRating = hoveredRating || watchedRating;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => form.setValue("rating", star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className={cn(
              "transition-all duration-200 hover:scale-110 p-1 rounded-full",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors duration-200",
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/40 hover:text-yellow-300"
              )}
            />
          </button>
        ))}
        {displayRating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {displayRating} étoile{displayRating > 1 ? "s" : ""}
          </span>
        )}
      </div>
    );
  };

  // Si l'utilisateur n'est pas connecté
  if (status === "unauthenticated") {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Connectez-vous pour laisser un avis
            </h3>
            <p className="text-muted-foreground mb-6">
              Vous devez être connecté pour pouvoir laisser un avis sur{" "}
              {placeName}
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="default">
                <Link href="/auth/login" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Se connecter
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/auth/register" className="gap-2">
                  <User className="h-4 w-4" />
                  S&apos;inscrire
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // En cours de chargement
  if (status === "loading") {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {isEditing
            ? `Modifier votre avis sur ${placeName}`
            : `Laisser un avis sur ${placeName}`}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? "Modifiez votre expérience pour aider les autres visiteurs"
            : "Partagez votre expérience pour aider les autres visiteurs"}
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={() => (
                <FormItem>
                  <FormLabel className="text-base">Note générale *</FormLabel>
                  <FormControl>
                    <div className="py-2">{renderStarRating()}</div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Votre commentaire</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez votre expérience, ce qui vous a plu ou déplu..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Optionnel - Minimum 10 caractères si vous souhaitez laisser
                    un commentaire
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                * Champ obligatoire
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !watchedRating}
                className="min-w-[120px]"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting
                  ? isEditing
                    ? "Modification..."
                    : "Publication..."
                  : isEditing
                    ? "Modifier l'avis"
                    : "Publier l'avis"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
