"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Mail, User, Settings } from "lucide-react";
import { toast } from "sonner";

interface AddSubscriberDialogProps {
  onSuccess: () => void;
  children?: React.ReactNode;
}

export function AddSubscriberDialog({ onSuccess, children }: AddSubscriberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    preferences: {
      events: true,
      places: true,
      offers: false,
      news: true,
      frequency: "WEEKLY",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/newsletter/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Abonné ajouté avec succès");
        setOpen(false);
        resetForm();
        onSuccess();
      } else {
        if (data.migrationRequired) {
          toast.error("Migration de base de données requise. Veuillez exécuter 'pnpm newsletter:migrate'");
        } else {
          toast.error(data.error || "Erreur lors de l'ajout");
        }
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout de l'abonné");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      preferences: {
        events: true,
        places: true,
        offers: false,
        news: true,
        frequency: "WEEKLY",
      },
    });
  };

  const updatePreference = (key: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un abonné
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Ajouter un abonné
          </DialogTitle>
          <DialogDescription>
            Ajoutez manuellement un nouvel abonné à la newsletter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4" />
              Informations personnelles
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="exemple@email.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Prénom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Nom"
                />
              </div>
            </div>
          </div>

          {/* Préférences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings className="w-4 h-4" />
              Préférences de contenu
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="events"
                  checked={formData.preferences.events}
                  onCheckedChange={(checked) => updatePreference("events", checked as boolean)}
                />
                <Label htmlFor="events" className="text-sm">
                  Événements et animations
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="places"
                  checked={formData.preferences.places}
                  onCheckedChange={(checked) => updatePreference("places", checked as boolean)}
                />
                <Label htmlFor="places" className="text-sm">
                  Nouveaux commerces et services
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="offers"
                  checked={formData.preferences.offers}
                  onCheckedChange={(checked) => updatePreference("offers", checked as boolean)}
                />
                <Label htmlFor="offers" className="text-sm">
                  Offres et promotions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="news"
                  checked={formData.preferences.news}
                  onCheckedChange={(checked) => updatePreference("news", checked as boolean)}
                />
                <Label htmlFor="news" className="text-sm">
                  Actualités de l'association
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Fréquence d'envoi</Label>
              <Select
                value={formData.preferences.frequency}
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !formData.email}>
              {loading ? "Ajout..." : "Ajouter l'abonné"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}