"use client";

import { useState, useEffect } from "react";
import { Mail, Settings, Check, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isVerified: boolean;
  preferences?: {
    events: boolean;
    places: boolean;
    offers: boolean;
    news: boolean;
    frequency: string;
  };
}

interface NewsletterPreferencesProps {
  userEmail: string;
}

export default function NewsletterPreferences({ userEmail }: NewsletterPreferencesProps) {
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriber, setSubscriber] = useState<NewsletterSubscriber | null>(null);
  const [preferences, setPreferences] = useState({
    events: true,
    places: true,
    offers: false,
    news: true,
    frequency: "WEEKLY",
  });

  // Charger les données d'abonnement
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch("/api/user/newsletter");
        const data = await response.json();

        if (data.success) {
          setIsSubscribed(data.isSubscribed);
          setSubscriber(data.subscriber);
          
          if (data.subscriber?.preferences) {
            setPreferences({
              events: data.subscriber.preferences.events,
              places: data.subscriber.preferences.places,
              offers: data.subscriber.preferences.offers,
              news: data.subscriber.preferences.news,
              frequency: data.subscriber.preferences.frequency,
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };

    fetchSubscriptionData();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe",
          preferences,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(true);
        setSubscriber(data.subscriber);
        toast.success(data.message || "Abonnement réussi !");
      } else {
        toast.error(data.error || "Erreur lors de l'abonnement");
      }
    } catch (error) {
      toast.error("Erreur lors de l'abonnement");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unsubscribe",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(false);
        setSubscriber(null);
        toast.success(data.message || "Désabonnement réussi");
      } else {
        toast.error(data.error || "Erreur lors du désabonnement");
      }
    } catch (error) {
      toast.error("Erreur lors du désabonnement");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePreferences",
          preferences,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubscriber(data.subscriber);
        toast.success(data.message || "Préférences mises à jour");
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      DAILY: "Quotidienne",
      WEEKLY: "Hebdomadaire", 
      MONTHLY: "Mensuelle",
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Newsletter
        </CardTitle>
        <CardDescription>
          Restez informé des dernières actualités de l'association
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statut d'abonnement */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isSubscribed ? 'bg-green-100' : 'bg-gray-100'}`}>
              {isSubscribed ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div>
              <div className="font-medium">
                {isSubscribed ? "Abonné à la newsletter" : "Non abonné"}
              </div>
              <div className="text-sm text-gray-600">
                Email: {userEmail}
              </div>
            </div>
          </div>
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? "Actif" : "Inactif"}
          </Badge>
        </div>

        {/* Actions principales */}
        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button 
              onClick={handleSubscribe}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              {loading ? "Abonnement..." : "S'abonner à la newsletter"}
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={handleUnsubscribe}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {loading ? "Désabonnement..." : "Se désabonner"}
            </Button>
          )}
        </div>

        {/* Préférences de contenu */}
        {isSubscribed && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium border-t pt-4">
              <Settings className="w-4 h-4" />
              Préférences de contenu
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="events" className="text-sm font-medium">
                    Événements et animations
                  </Label>
                  <p className="text-xs text-gray-600">
                    Recevez les informations sur les événements à venir
                  </p>
                </div>
                <Switch
                  id="events"
                  checked={preferences.events}
                  onCheckedChange={(checked) => updatePreference("events", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="places" className="text-sm font-medium">
                    Nouveaux commerces et services
                  </Label>
                  <p className="text-xs text-gray-600">
                    Découvrez les nouveaux commerces référencés
                  </p>
                </div>
                <Switch
                  id="places"
                  checked={preferences.places}
                  onCheckedChange={(checked) => updatePreference("places", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="offers" className="text-sm font-medium">
                    Offres et promotions
                  </Label>
                  <p className="text-xs text-gray-600">
                    Recevez les offres spéciales des commerçants
                  </p>
                </div>
                <Switch
                  id="offers"
                  checked={preferences.offers}
                  onCheckedChange={(checked) => updatePreference("offers", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="news" className="text-sm font-medium">
                    Actualités de l'association
                  </Label>
                  <p className="text-xs text-gray-600">
                    Recevez les nouvelles de l'association ABC Bédarieux
                  </p>
                </div>
                <Switch
                  id="news"
                  checked={preferences.news}
                  onCheckedChange={(checked) => updatePreference("news", checked)}
                />
              </div>
            </div>

            {/* Fréquence d'envoi */}
            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-sm font-medium">
                Fréquence d'envoi
              </Label>
              <Select
                value={preferences.frequency}
                onValueChange={(value) => updatePreference("frequency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Quotidienne</SelectItem>
                  <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                  <SelectItem value="MONTHLY">Mensuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bouton de sauvegarde des préférences */}
            <Button 
              onClick={handleUpdatePreferences}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Sauvegarde..." : "Sauvegarder les préférences"}
            </Button>
          </div>
        )}

        {/* Informations RGPD */}
        <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded border-l-4 border-blue-200">
          <strong>Conformité RGPD :</strong> Vos données personnelles sont traitées conformément à notre politique de confidentialité. 
          Vous pouvez vous désabonner à tout moment et demander la suppression de vos données via cette interface.
        </div>
      </CardContent>
    </Card>
  );
}