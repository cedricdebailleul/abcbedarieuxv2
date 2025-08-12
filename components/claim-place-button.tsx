"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { User, UserPlus, FileText } from "lucide-react";
import Link from "next/link";

interface ClaimPlaceButtonProps {
  placeId: string;
  placeName: string;
  placeSlug: string;
  className?: string;
}

export function ClaimPlaceButton({ placeId, placeName, placeSlug, className }: ClaimPlaceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleClaim = async () => {
    if (isLoading) return;

    if (!confirm(`Voulez-vous revendiquer "${placeName}" ? Cette action est irréversible.`)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/places/${placeId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la revendication");
      }

      toast.success(result.message);
      
      // Rediriger vers la page d'édition de la place
      router.push(`/dashboard/places/${placeId}/edit`);
      
    } catch (error: any) {
      console.error("Erreur revendication:", error);
      toast.error(error.message || "Erreur lors de la revendication");
    } finally {
      setIsLoading(false);
    }
  };

  // Si l'utilisateur est connecté, afficher les options de revendication
  if (session?.user) {
    return (
      <div className="space-y-2">
        <Link href={`/places/${placeSlug}/claim`} className="block">
          <Button className={`w-full ${className}`} variant="default">
            <FileText className="w-4 h-4 mr-2" />
            Revendiquer cette place
          </Button>
        </Link>
        
        <p className="text-xs text-muted-foreground">
          Soumettez une demande avec justificatifs pour validation par un administrateur
        </p>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher les options de connexion/inscription
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Vous devez être connecté pour revendiquer cette place.
      </p>
      
      <div className="space-y-2">
        <Link href={`/login?callbackUrl=/places/${placeSlug}/claim`} className="block">
          <Button className={`w-full ${className}`} variant="default">
            <User className="w-4 h-4 mr-2" />
            Se connecter et revendiquer
          </Button>
        </Link>
        
        <Link href={`/register?callbackUrl=/places/${placeSlug}/claim`} className="block">
          <Button className={`w-full ${className}`} variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Créer un compte pour revendiquer
          </Button>
        </Link>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Après inscription, vous pourrez fournir des preuves de propriété.
      </p>
    </div>
  );
}