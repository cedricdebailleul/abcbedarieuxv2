"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Shield, BarChart3, Target } from "lucide-react";

const cookieCategories = [
  {
    id: "necessary",
    name: "Cookies nécessaires",
    description:
      "Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés.",
    icon: Shield,
    required: true,
    enabled: true,
    cookies: [
      {
        name: "Session utilisateur",
        purpose: "Maintenir votre connexion",
        duration: "Session",
      },
      {
        name: "Préférences cookies",
        purpose: "Mémoriser vos choix de cookies",
        duration: "1 an",
      },
      {
        name: "Sécurité CSRF",
        purpose: "Protection contre les attaques",
        duration: "Session",
      },
    ],
  },
  {
    id: "analytics",
    name: "Cookies analytiques",
    description:
      "Ces cookies nous aident à comprendre comment vous utilisez notre site pour l'améliorer.",
    icon: BarChart3,
    required: false,
    enabled: false,
    cookies: [
      {
        name: "Google Analytics",
        purpose: "Mesure d'audience anonyme",
        duration: "2 ans",
      },
      {
        name: "Statistiques pages",
        purpose: "Pages les plus visitées",
        duration: "1 an",
      },
    ],
  },
  {
    id: "marketing",
    name: "Cookies marketing",
    description:
      "Ces cookies permettent de personnaliser les contenus et publicités.",
    icon: Target,
    required: false,
    enabled: false,
    cookies: [
      {
        name: "Publicités ciblées",
        purpose: "Affichage de publicités pertinentes",
        duration: "1 an",
      },
      {
        name: "Réseaux sociaux",
        purpose: "Intégration des boutons de partage",
        duration: "6 mois",
      },
    ],
  },
];

export default function CookiesPage() {
  const [preferences, setPreferences] = useState(
    cookieCategories.reduce((acc, category) => {
      acc[category.id] = category.enabled;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handlePreferenceChange = (categoryId: string, enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [categoryId]: enabled,
    }));
  };

  const acceptAll = () => {
    const newPreferences = cookieCategories.reduce((acc, category) => {
      acc[category.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const acceptNecessaryOnly = () => {
    const newPreferences = cookieCategories.reduce((acc, category) => {
      acc[category.id] = category.required;
      return acc;
    }, {} as Record<string, boolean>);
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const savePreferences = (prefs: Record<string, boolean>) => {
    // Sauvegarder les préférences en localStorage
    localStorage.setItem("cookiePreferences", JSON.stringify(prefs));
    // Ici vous pouvez ajouter la logique pour activer/désactiver les cookies
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Cookie className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Gestion des cookies</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Configurez vos préférences pour les cookies et traceurs utilisés sur
          notre site
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Cookie Categories */}
          <div className="space-y-6">
            {cookieCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card key={category.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-6 h-6 text-primary" />
                        <CardTitle>{category.name}</CardTitle>
                        {category.required && (
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                            Obligatoire
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={category.id} className="sr-only">
                          {category.name}
                        </Label>
                        <Switch
                          id={category.id}
                          checked={preferences[category.id]}
                          onCheckedChange={(enabled) =>
                            handlePreferenceChange(category.id, enabled)
                          }
                          disabled={category.required}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {category.description}
                    </p>

                    {/* Cookie Details */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">
                        Cookies concernés :
                      </h4>
                      <div className="grid gap-3">
                        {category.cookies.map((cookie, index) => (
                          <div
                            key={index}
                            className="bg-muted/50 p-3 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {cookie.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {cookie.purpose}
                                </p>
                              </div>
                              <span className="text-xs bg-background px-2 py-1 rounded">
                                {cookie.duration}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={acceptAll} className="flex-1">
                  Accepter tous les cookies
                </Button>
                <Button
                  variant="outline"
                  onClick={acceptNecessaryOnly}
                  className="flex-1"
                >
                  Cookies nécessaires uniquement
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSavePreferences}
                  className="flex-1"
                >
                  Sauvegarder mes préférences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>À propos des cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Les cookies sont de petits fichiers texte stockés sur votre
                appareil pour améliorer votre expérience de navigation.
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Types de cookies :</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>
                    • <strong>Session :</strong> Supprimés à la fermeture du
                    navigateur
                  </li>
                  <li>
                    • <strong>Persistants :</strong> Conservés jusqu&apos;à
                    expiration
                  </li>
                  <li>
                    • <strong>Première partie :</strong> Émis par notre site
                  </li>
                  <li>
                    • <strong>Tiers :</strong> Émis par des partenaires
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vos droits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vous pouvez modifier vos préférences à tout moment depuis cette
                page.
              </p>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Autres options :</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Paramètres de votre navigateur</li>
                  <li>• Mode navigation privée</li>
                  <li>• Extensions de blocage</li>
                  <li>• Suppression manuelle</li>
                </ul>
              </div>

              <Button asChild variant="outline" size="sm" className="w-full">
                <a href="/privacy">Politique de confidentialité</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Besoin d&apos;aide ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Des questions sur les cookies ou la protection de vos données ?
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href="/contact">Nous contacter</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Information Section */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Comment supprimer les cookies ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Chrome</h4>
                <p className="text-sm text-muted-foreground">
                  Paramètres → Confidentialité et sécurité → Cookies et autres
                  données de sites
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Firefox</h4>
                <p className="text-sm text-muted-foreground">
                  Options → Vie privée et sécurité → Cookies et données de sites
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Safari</h4>
                <p className="text-sm text-muted-foreground">
                  Préférences → Confidentialité → Gérer les données de sites web
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
