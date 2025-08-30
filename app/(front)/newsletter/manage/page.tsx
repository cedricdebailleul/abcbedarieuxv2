"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  Settings,
  Trash2,
  Loader2,
  MapPin} from "lucide-react";
import { toast } from "sonner";

type NewsletterFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

interface Subscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isVerified: boolean;
  preferences: {
    events: boolean;
    places: boolean;
    offers: boolean;
    news: boolean;
    frequency: NewsletterFrequency;
  };
}

export default function ManageNewsletterPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [preferences, setPreferences] = useState({
    events: true,
    places: true,
    offers: false,
    news: true,
    frequency: "WEEKLY" as NewsletterFrequency,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmUnsubscribe, setShowConfirmUnsubscribe] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/newsletter/subscriber?email=${encodeURIComponent(email)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.subscriber) {
          setSubscriber(data.subscriber);
          setPreferences(
            data.subscriber.preferences || {
              events: true,
              places: true,
              offers: false,
              news: true,
              frequency: "WEEKLY" as NewsletterFrequency,
            }
          );
        } else {
          toast.error("Aucun abonnement trouvé pour cet email");
          setSubscriber(null);
        }
      } else {
        toast.error("Aucun abonnement trouvé pour cet email");
        setSubscriber(null);
      }
    } catch (error) {
      toast.error("Erreur lors de la recherche");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!subscriber) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/newsletter/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: subscriber.email,
          preferences,
        }),
      });

      if (response.ok) {
        toast.success("Préférences mises à jour avec succès !");
        setSubscriber((prev) => (prev ? { ...prev, preferences } : null));
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscriber) return;

    setIsUnsubscribing(true);
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscriber.email }),
      });

      if (response.ok) {
        toast.success("Vous avez été désabonné avec succès");
        setSubscriber(null);
        setEmail("");
        setShowConfirmUnsubscribe(false);
      } else {
        toast.error("Erreur lors de la désinscription");
      }
    } catch (error) {
      toast.error("Erreur lors de la désinscription");
      console.error(error);
    } finally {
      setIsUnsubscribing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Settings className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Gérer mon abonnement newsletter
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Modifiez vos préférences ou désabonnez-vous de la newsletter ABC
          Bédarieux
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle>Rechercher mon abonnement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-email">Adresse email</Label>
                <Input
                  id="search-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@example.com"
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  "Rechercher mon abonnement"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Subscriber Details */}
        {subscriber && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Abonnement trouvé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subscriber Info */}
              <div className="space-y-2">
                <Label>Informations de l&apos;abonné</Label>
                <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                  <p>
                    <strong>Email :</strong> {subscriber.email}
                  </p>
                  {subscriber.firstName && (
                    <p>
                      <strong>Prénom :</strong> {subscriber.firstName}
                    </p>
                  )}
                  {subscriber.lastName && (
                    <p>
                      <strong>Nom :</strong> {subscriber.lastName}
                    </p>
                  )}
                  <p>
                    <strong>Statut :</strong>
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        subscriber.isVerified
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {subscriber.isVerified
                        ? "Vérifié"
                        : "En attente de vérification"}
                    </span>
                  </p>
                </div>
              </div>

              <Separator />

              {/* Preferences */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Préférences de contenu
                </Label>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="events"
                      checked={preferences.events}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          events: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="events" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Événements et animations
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="places"
                      checked={preferences.places}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          places: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="places" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Nouveaux commerces et services
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="offers"
                      checked={preferences.offers}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          offers: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="offers" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Offres et promotions des membres
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="news"
                      checked={preferences.news}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          news: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="news" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Actualités de l&apos;association
                    </Label>
                  </div>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <Label>Fréquence d&apos;envoi</Label>
                  <div className="space-y-2">
                    {(
                      [
                        {
                          value: "DAILY" as NewsletterFrequency,
                          label: "Quotidienne",
                        },
                        {
                          value: "WEEKLY" as NewsletterFrequency,
                          label: "Hebdomadaire (recommandé)",
                        },
                        {
                          value: "MONTHLY" as NewsletterFrequency,
                          label: "Mensuelle",
                        },
                      ] as const
                    ).map((freq) => (
                      <div
                        key={freq.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={freq.value}
                          checked={preferences.frequency === freq.value}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setPreferences((prev) => ({
                                ...prev,
                                frequency: freq.value,
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={freq.value}>{freq.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    "Sauvegarder les préférences"
                  )}
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setShowConfirmUnsubscribe(true)}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Se désabonner
                </Button>
              </div>

              {/* Unsubscribe Confirmation */}
              {showConfirmUnsubscribe && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <p className="mb-4">
                      Êtes-vous sûr de vouloir vous désabonner ? Vous ne
                      recevrez plus aucune information de notre part.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleUnsubscribe}
                        disabled={isUnsubscribing}
                      >
                        {isUnsubscribing ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Désinscription...
                          </>
                        ) : (
                          "Confirmer la désinscription"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowConfirmUnsubscribe(false)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle>Besoin d&apos;aide ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Si vous ne trouvez pas votre abonnement ou rencontrez des
              difficultés, n&apos;hésitez pas à nous contacter à{" "}
              <a
                href="mailto:contact@abc-bedarieux.fr"
                className="text-primary underline"
              >
                contact@abc-bedarieux.fr
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
