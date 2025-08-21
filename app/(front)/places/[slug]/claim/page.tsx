"use client";

import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";

interface Place {
  id: string;
  name: string;
  street: string;
  city: string;
  slug: string;
}

interface ClaimPlacePageProps {
  params: Promise<{ slug: string }>;
}

export default function ClaimPlacePage({
  params: paramsPromise,
}: ClaimPlacePageProps) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const { data: session, status } = useSession();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    relationship: "owner" as
      | "owner"
      | "manager"
      | "employee"
      | "family"
      | "other",
    message: "",
    proof: "",
  });

  // Résoudre les paramètres
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await paramsPromise;
        console.log("🔍 Slug résolu:", resolvedParams.slug);
        setSlug(resolvedParams.slug);
      } catch (error) {
        console.error("❌ Erreur résolution params:", error);
      }
    };
    resolveParams();
  }, [paramsPromise]);

  // Récupérer les infos de la place
  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const response = await fetch(`/api/places/by-slug/${slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.place) {
            setPlace(data.place);
          }
        } else {
          toast.error("Place non trouvée");
        }
      } catch (error) {
        console.error("Erreur chargement place:", error);
        toast.error("Erreur lors du chargement de la place");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPlace();
    }
  }, [slug]);

  // Rediriger si pas connecté (seulement si on a un slug et que le status est chargé)
  useEffect(() => {
    if (status === "unauthenticated" && !session?.user && slug) {
      router.push(`/login?callbackUrl=/places/${slug}/claim`);
    }
  }, [session, status, router, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place) return;

    if (!formData.firstName.trim() || formData.firstName.length < 2) {
      toast.error("Le prénom doit faire au moins 2 caractères");
      return;
    }

    if (!formData.lastName.trim() || formData.lastName.length < 2) {
      toast.error("Le nom doit faire au moins 2 caractères");
      return;
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Veuillez saisir un email valide");
      return;
    }

    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast.error("Le téléphone doit faire au moins 10 caractères");
      return;
    }

    if (formData.message.length < 20) {
      toast.error("Le message doit faire au moins 20 caractères");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/places/${place.id}/claim-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la soumission");
      }

      toast.success(result.message);
      router.push(`/places/${place.slug}`);
    } catch (error: unknown) {
      console.error("Erreur soumission:", error);
      if (error instanceof Error) {
        toast.error(
          error.message || "Erreur lors de la soumission de la demande"
        );
      } else {
        toast.error("Erreur lors de la soumission de la demande");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Place non trouvée</p>
        <Link href="/" className="text-primary hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link href={`/places/${place.slug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la fiche
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revendiquer la place : {place.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {place.street}, {place.city}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Pour revendiquer cette place, veuillez fournir des informations
            détaillées prouvant votre lien avec cet établissement.
          </p>
        </CardContent>
      </Card>

      {/* Formulaire de demande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Demande de revendication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Votre prénom"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Votre nom"
                  className="mt-2"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="votre.email@exemple.com"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="06 12 34 56 78"
                  className="mt-2"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="relationship">
                Votre relation avec l&apos;établissement *
              </Label>
              <select
                id="relationship"
                value={formData.relationship}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    relationship: e.target.value as
                      | "owner"
                      | "manager"
                      | "employee"
                      | "family"
                      | "other",
                  })
                }
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="owner">Propriétaire</option>
                <option value="manager">Gérant</option>
                <option value="employee">Employé</option>
                <option value="family">Membre de la famille</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <Label htmlFor="message">Message de justification *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Expliquez votre relation avec cet établissement et pourquoi vous souhaitez le revendiquer. Minimum 20 caractères."
                className="min-h-[120px] mt-2"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.message.length}/20 caractères minimum
              </p>
            </div>

            <div>
              <Label htmlFor="proof">Preuve (optionnel)</Label>
              <Input
                id="proof"
                type="url"
                value={formData.proof}
                onChange={(e) =>
                  setFormData({ ...formData, proof: e.target.value })
                }
                placeholder="https://exemple.com/document-ou-photo.jpg"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lien vers un document, photo ou autre preuve de votre relation
                avec l&apos;établissement
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Types de preuves acceptées :
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Kbis ou documents officiels de l&apos;entreprise</li>
                <li>• Factures ou contrats au nom de l&apos;établissement</li>
                <li>• Photos de vous dans l&apos;établissement</li>
                <li>• Attestation d&apos;emploi ou contrat de travail</li>
                <li>• Tout autre document prouvant votre lien</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={
                  submitting ||
                  formData.message.length < 20 ||
                  formData.firstName.length < 2 ||
                  formData.lastName.length < 2 ||
                  !formData.email.trim() ||
                  formData.phone.length < 10
                }
                className="flex-1"
              >
                {submitting ? "Envoi en cours..." : "Soumettre la demande"}
              </Button>
              <Link href={`/places/${place.slug}`}>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Information sur le processus */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-2">Que se passe-t-il ensuite ?</h4>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li>1. Votre demande sera examinée par un administrateur</li>
            <li>
              2. Nous pourrons vous contacter pour des informations
              complémentaires
            </li>
            <li>
              3. Une fois approuvée, vous deviendrez propriétaire de la fiche
            </li>
            <li>4. Vous recevrez un email de confirmation</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-4">
            Délai de traitement habituel : 2-5 jours ouvrés
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
