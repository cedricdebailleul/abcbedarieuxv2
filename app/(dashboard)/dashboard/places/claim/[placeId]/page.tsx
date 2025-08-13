"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";

interface Place {
  id: string;
  name: string;
  type: string;
  street: string;
  city: string;
  ownerId?: string;
}

export default async function ClaimPlacePage({ params }: { params: Promise<{ placeId: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [proof, setProof] = useState("");

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const { placeId } = await params;
        const response = await fetch(`/api/places/${placeId}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Place non trouvée");
            router.push("/places");
            return;
          }
          throw new Error("Erreur lors du chargement");
        }

        const data = await response.json();
        setPlace(data.place);
      } catch (error: any) {
        console.error("Erreur:", error);
        toast.error(error.message || "Erreur lors du chargement");
        router.push("/places");
      } finally {
        setLoading(false);
      }
    };

    fetchPlace();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Veuillez expliquer pourquoi vous revendiquez cet établissement");
      return;
    }

    setSubmitting(true);

    try {
      const { placeId } = await params;
      const response = await fetch(`/api/places/${placeId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          proof: proof.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la revendication");
      }

      toast.success(
        "Revendication envoyée avec succès! Un administrateur la traitera dans les plus brefs délais."
      );
      router.push("/dashboard/places");
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de l'envoi de la revendication");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Connexion requise</h1>
        <p className="text-gray-600 mb-6">
          Vous devez être connecté pour revendiquer un établissement.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  if (!place) {
    return null;
  }

  if (place.ownerId) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href={`/places/${(await params).placeId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la place
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Établissement déjà revendiqué</CardTitle>
            <CardDescription>Cet établissement a déjà un propriétaire</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              L'établissement "{place.name}" est déjà géré par son propriétaire. Si vous pensez
              qu'il y a une erreur, contactez notre équipe.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/places/${(await params).placeId}`}
        className="inline-flex items-center text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour à la place
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Revendiquer cet établissement</CardTitle>
          <CardDescription>
            Vous pouvez revendiquer "{place.name}" si vous en êtes le propriétaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Informations sur l'établissement</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <strong>Nom:</strong> {place.name}
              </p>
              <p>
                <strong>Type:</strong> {place.type}
              </p>
              <p>
                <strong>Adresse:</strong> {place.street}, {place.city}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">
                Pourquoi revendiquez-vous cet établissement ? *
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Expliquez en quelques mots pourquoi vous êtes le propriétaire de cet établissement. Par exemple : 'Je suis le gérant de ce restaurant depuis 2020' ou 'C'est mon salon de coiffure'."
                className="min-h-[100px] resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof" className="text-sm font-medium">
                Preuve (optionnel)
              </Label>
              <Input
                id="proof"
                type="url"
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="https://... (lien vers un document, photo, site web, etc.)"
              />
              <p className="text-xs text-gray-500">
                Vous pouvez fournir un lien vers une preuve (document officiel, photo, site web de
                l'établissement, etc.)
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">À savoir</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Votre demande sera examinée par notre équipe</li>
                <li>• Vous recevrez un email une fois la validation effectuée</li>
                <li>
                  • En cas d'approbation, vous pourrez gérer toutes les informations de votre
                  établissement
                </li>
                <li>• Les demandes sont généralement traitées sous 48h</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting || !message.trim()} className="flex-1">
                {submitting ? "Envoi en cours..." : "Envoyer la revendication"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
