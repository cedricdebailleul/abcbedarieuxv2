"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { OfferForm } from "@/components/forms/offer-form";
import Link from "next/link";
import { toast } from "sonner";

interface Offer {
  id: string;
  title: string;
  place: {
    id: string;
    name: string;
  };
  [key: string]: unknown;
}

interface OfferEditFormProps {
  offerId: string;
}

export function OfferEditForm({ offerId }: OfferEditFormProps) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchOffer() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/offers/${offerId}`);

        if (!response.ok) {
          throw new Error("Offre non trouvée");
        }

        const data = await response.json();
        setOffer(data.offer);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (offerId) {
      fetchOffer();
    }
  }, [offerId]);

  const handleSuccess = () => {
    toast.success("Offre mise à jour avec succès !");
    router.push("/dashboard/products-services/manage");
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de l&apos;offre...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !offer) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive mb-4">
            {error || "Offre non trouvée"}
          </p>
          <Button asChild>
            <Link href="/dashboard/products-services/manage">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Modifier l&apos;offre : {offer.title}</CardTitle>
          <Button variant="outline" asChild>
            <Link href="/dashboard/products-services/manage">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <OfferForm
          placeId={offer.place.id}
          placeName={offer.place.name}
          initialData={offer}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </CardContent>
    </Card>
  );
}
