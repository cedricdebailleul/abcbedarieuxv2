"use client";

import { FileText, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

interface ClaimPlaceButtonProps {
  placeId: string;
  placeName: string;
  placeSlug: string;
  className?: string;
}

export function ClaimPlaceButton({
  placeSlug,
  className,
}: ClaimPlaceButtonProps) {
  const { data: session } = useSession();

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
          Soumettez une demande avec justificatifs pour validation par un
          administrateur
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
        <Link
          href={`/login?callbackUrl=/places/${placeSlug}/claim`}
          className="block"
        >
          <Button className={`w-full ${className}`} variant="default">
            <User className="w-4 h-4 mr-2" />
            Se connecter et revendiquer
          </Button>
        </Link>

        <Link
          href={`/register?callbackUrl=/places/${placeSlug}/claim`}
          className="block"
        >
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
