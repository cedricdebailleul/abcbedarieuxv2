"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ServiceForm } from "@/components/forms/service-form";
import Link from "next/link";
import { toast } from "sonner";

interface ServiceEditFormProps {
  serviceId: string;
}

interface Service {
  id: string;
  name: string;
  place: {
    id: string;
    name: string;
  };
  tags?: string[] | string;
  description?: string;
  price?: number;
  [key: string]: unknown;
}

export function ServiceEditForm({ serviceId }: ServiceEditFormProps) {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchService() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/services/${serviceId}`);

        if (!response.ok) {
          throw new Error("Service non trouvé");
        }

        const data = await response.json();
        setService(data.service);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  const handleSuccess = () => {
    toast.success("Service mis à jour avec succès !");
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
          <p className="text-muted-foreground">Chargement du service...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !service) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive mb-4">
            {error || "Service non trouvé"}
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
          <CardTitle>Modifier le service : {service.name}</CardTitle>
          <Button variant="outline" asChild>
            <Link href="/dashboard/products-services/manage">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ServiceForm
          placeId={service.place.id}
          placeName={service.place.name}
          initialData={{
            ...service,
            tags: Array.isArray(service.tags)
              ? service.tags.join(", ")
              : service.tags,
          }}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </CardContent>
    </Card>
  );
}
