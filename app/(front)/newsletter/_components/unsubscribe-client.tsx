"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Mail, Loader, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useCallback } from "react";
interface Subscriber {
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  subscribedAt: string;
}

export default function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [email, setEmail] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Vérifier le token au chargement de la page

  const verifyToken = useCallback(async () => {
    if (!token) return;

    setVerifying(true);
    try {
      const response = await fetch(
        `/api/newsletter/unsubscribe?token=${token}`
      );
      const data = await response.json();

      if (data.success) {
        setTokenValid(true);
        setSubscriber(data.subscriber);
        if (!data.subscriber.isActive) {
          setIsUnsubscribed(true);
        }
      } else {
        setTokenValid(false);
        toast.error(data.error || "Token invalide");
      }
    } catch {
      setTokenValid(false);
      toast.error("Erreur lors de la vérification du token");
    } finally {
      setVerifying(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token, verifyToken]);

  const handleUnsubscribe = async (useToken = false) => {
    setLoading(true);

    try {
      const body = useToken ? { token } : { email: email.trim() };

      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setIsUnsubscribed(true);
        setSubscriber(data.subscriber);
        toast.success(data.message);
      } else {
        toast.error(data.error || "Erreur lors du désabonnement");
      }
    } catch {
      toast.error("Erreur lors du désabonnement");
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (subscriber?.firstName && subscriber?.lastName) {
      return `${subscriber.firstName} ${subscriber.lastName}`;
    }
    return subscriber?.email || email;
  };

  if (verifying) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-center">Vérification en cours...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isUnsubscribed) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Désabonnement confirmé</CardTitle>
              <CardDescription>
                Vous avez été désabonné avec succès de notre newsletter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="font-medium">{getDisplayName()}</p>
                <p className="text-sm text-gray-600">
                  Vous ne recevrez plus nos emails de newsletter.
                </p>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/">Retour à l&apos;accueil</Link>
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Vous pouvez vous réabonner à tout moment depuis notre site
                  web.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (token && tokenValid === false) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Lien invalide</CardTitle>
              <CardDescription>
                Le lien de désinscription est invalide ou a expiré
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Vous pouvez vous désabonner en utilisant votre adresse email
                ci-dessous.
              </p>

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button
                onClick={() => handleUnsubscribe(false)}
                disabled={loading || !email.trim()}
                className="w-full"
              >
                {loading ? "Désabonnement..." : "Se désabonner"}
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/">Retour à l&apos;accueil</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">
              Désinscription Newsletter
            </CardTitle>
            <CardDescription>
              {token && subscriber
                ? "Confirmez votre désinscription de notre newsletter"
                : "Entrez votre email pour vous désabonner"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {token && subscriber ? (
              // Cas avec token valide
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium">{getDisplayName()}</div>
                  <div className="text-sm text-gray-600">
                    {subscriber.email}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Abonné depuis le{" "}
                    {new Date(subscriber.subscribedAt).toLocaleDateString(
                      "fr-FR"
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Êtes-vous sûr ?</p>
                    <p>
                      En vous désabonnant, vous ne recevrez plus nos
                      informations sur les événements, nouveaux commerces et
                      actualités de l&apos;association.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleUnsubscribe(true)}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? "Désabonnement..." : "Confirmer le désabonnement"}
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Annuler et retourner à l&apos;accueil</Link>
                </Button>
              </div>
            ) : (
              // Cas sans token - formulaire email
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button
                  onClick={() => handleUnsubscribe(false)}
                  disabled={loading || !email.trim()}
                  className="w-full"
                >
                  {loading ? "Désabonnement..." : "Se désabonner"}
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Retour à l&apos;accueil</Link>
                </Button>
              </div>
            )}

            {/* Informations RGPD */}
            <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded border-l-4 border-blue-200">
              <strong>Informations RGPD :</strong> Vos données personnelles
              seront conservées de manière sécurisée mais marquées comme
              inactives. Vous pouvez vous réabonner à tout moment. Pour une
              suppression complète de vos données, contactez-nous via notre
              <Link
                href="/contact"
                className="underline hover:text-blue-700 ml-1"
              >
                page de contact
              </Link>
              .
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
