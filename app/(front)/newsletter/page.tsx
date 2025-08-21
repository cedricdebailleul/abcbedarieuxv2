"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  MapPin,
} from "lucide-react";

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferences, setPreferences] = useState({
    events: true,
    places: true,
    offers: false,
    news: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          preferences,
        }),
      });

      if (response.ok) {
        setStatus("success");
        setEmail("");
        setFirstName("");
        setLastName("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Mail className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Newsletter ABC Bédarieux</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Restez informé de l&apos;actualité commerciale de Bédarieux et ne
          manquez aucun événement !
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Subscription Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Abonnez-vous à notre newsletter</CardTitle>
            </CardHeader>
            <CardContent>
              {status === "success" && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Merci ! Votre inscription a été prise en compte. Vous allez
                    recevoir un email de confirmation.
                  </AlertDescription>
                </Alert>
              )}

              {status === "error" && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Une erreur s&apos;est produite. Veuillez réessayer plus
                    tard.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@example.com"
                    required
                  />
                </div>

                {/* Preferences */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Que souhaitez-vous recevoir ?
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
                      <Label
                        htmlFor="events"
                        className="flex items-center gap-2"
                      >
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
                      <Label
                        htmlFor="places"
                        className="flex items-center gap-2"
                      >
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
                      <Label
                        htmlFor="offers"
                        className="flex items-center gap-2"
                      >
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
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="consent" required />
                  <Label htmlFor="consent" className="text-sm">
                    J&apos;accepte de recevoir la newsletter et que mes données
                    soient utilisées conformément à la{" "}
                    <a href="/privacy" className="text-primary underline">
                      politique de confidentialité
                    </a>
                    .
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Inscription en cours..."
                    : "S'abonner à la newsletter"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pourquoi s&apos;abonner ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Ne manquez rien</p>
                  <p className="text-sm text-muted-foreground">
                    Soyez les premiers informés des événements et animations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Découvrez</p>
                  <p className="text-sm text-muted-foreground">
                    Les nouveaux commerces et services de Bédarieux
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Profitez</p>
                  <p className="text-sm text-muted-foreground">
                    D&apos;offres exclusives de nos commerçants partenaires
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Restez connecté</p>
                  <p className="text-sm text-muted-foreground">
                    À la vie économique et associative locale
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fréquence d&apos;envoi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Newsletter principale</span>
                  <span className="text-muted-foreground">1x / semaine</span>
                </div>
                <div className="flex justify-between">
                  <span>Événements spéciaux</span>
                  <span className="text-muted-foreground">Selon actualité</span>
                </div>
                <div className="flex justify-between">
                  <span>Offres partenaires</span>
                  <span className="text-muted-foreground">2x / mois max</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Vous pouvez vous désabonner à tout moment en cliquant sur le
                lien de désinscription en bas de nos emails.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Déjà abonné ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Gérez vos préférences ou désabonnez-vous.
              </p>
              <Button variant="outline" className="w-full">
                Gérer mon abonnement
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
