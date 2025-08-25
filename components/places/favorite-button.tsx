"use client";

import { useState, useTransition, useEffect } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleFavoriteAction, checkIsFavoriteAction } from "@/actions/favorite";
import { useSession } from "@/hooks/use-session";

interface FavoriteButtonProps {
  placeId: string;
  placeName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
  className?: string;
}

export function FavoriteButton({
  placeId,
  placeName,
  variant = "outline",
  size = "default",
  showText = true,
  className
}: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Charger le statut favori au montage du composant
  useEffect(() => {
    if (status === "loading") return;

    const checkFavoriteStatus = async () => {
      try {
        const result = await checkIsFavoriteAction(placeId);
        if (result.success) {
          setIsFavorite(result.data!.isFavorite);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut favori:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFavoriteStatus();
  }, [placeId, status]);

  const handleToggleFavorite = () => {
    if (!session?.user) {
      toast.error("Vous devez être connecté pour ajouter aux favoris");
      return;
    }

    startTransition(async () => {
      try {
        const result = await toggleFavoriteAction(placeId);
        
        if (result.success) {
          const newIsFavorite = result.data!.isFavorite;
          setIsFavorite(newIsFavorite);
          
          if (newIsFavorite) {
            toast.success(`${placeName || 'Place'} ajouté${placeName ? 'e' : ''} aux favoris ❤️`);
          } else {
            toast.success(`${placeName || 'Place'} retiré${placeName ? 'e' : ''} des favoris`);
          }
        } else {
          toast.error(result.error || "Erreur lors de la modification des favoris");
        }
      } catch (error) {
        toast.error("Une erreur est survenue");
        console.error("Erreur toggle favori:", error);
      }
    });
  };

  // Si utilisateur non connecté, afficher le bouton désactivé
  if (status === "unauthenticated") {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn("relative", className)}
        title="Connectez-vous pour ajouter aux favoris"
      >
        <Heart className={cn(
          size === "icon" ? "h-4 w-4" : "h-4 w-4 mr-2",
        )} />
        {showText && size !== "icon" && "Favoris"}
      </Button>
    );
  }

  // Affichage de chargement
  if (isLoading || status === "loading") {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn("relative", className)}
      >
        <Heart className={cn(
          size === "icon" ? "h-4 w-4" : "h-4 w-4 mr-2",
        )} />
        {showText && size !== "icon" && "Favoris"}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={isPending}
      className={cn(
        "relative transition-all duration-200",
        isFavorite && "text-red-600 hover:text-red-700",
        className
      )}
      title={isFavorite ? `Retirer ${placeName || 'cette place'} des favoris` : `Ajouter ${placeName || 'cette place'} aux favoris`}
    >
      <Heart 
        className={cn(
          size === "icon" ? "h-4 w-4" : "h-4 w-4 mr-2",
          "transition-all duration-200",
          isFavorite ? "fill-current scale-110" : ""
        )} 
      />
      {showText && size !== "icon" && (
        <span className="transition-all duration-200">
          {isFavorite ? "En favoris" : "Favoris"}
        </span>
      )}
      
      {/* Animation de coeur qui bat */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Heart className="h-4 w-4 fill-current text-red-600 animate-pulse" />
        </div>
      )}
    </Button>
  );
}