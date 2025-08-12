"use client";

import { Globe, Mail, MapPin, Phone, Save, Settings, User, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  profile: z.object({
    firstname: z.string().optional(),
    lastname: z.string().optional(),
    bio: z.string().max(500, "La biographie ne peut pas dépasser 500 caractères").optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    isPublic: z.boolean(),
    showEmail: z.boolean(),
    showPhone: z.boolean(),
  }),
});

interface UserData {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  status: string;
  profile?: {
    firstname?: string;
    lastname?: string;
    bio?: string;
    phone?: string;
    address?: string;
    language?: string;
    timezone?: string;
    isPublic: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
  badges: any[];
  _count: any;
}

interface ProfileEditFormProps {
  user: UserData;
  onUpdate: (user: UserData) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ user, onUpdate, onCancel }: ProfileEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    profile: {
      firstname: user.profile?.firstname || "",
      lastname: user.profile?.lastname || "",
      bio: user.profile?.bio || "",
      phone: user.profile?.phone || "",
      address: user.profile?.address || "",
      language: user.profile?.language || "fr",
      timezone: user.profile?.timezone || "Europe/Paris",
      isPublic: user.profile?.isPublic ?? true,
      showEmail: user.profile?.showEmail ?? false,
      showPhone: user.profile?.showPhone ?? false,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrors({});

    try {
      // Validation côté client
      const validatedData = profileSchema.parse(formData);

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          // Erreurs de validation Zod
          const newErrors: Record<string, string> = {};
          data.details.forEach((error: any) => {
            const path = error.path.join(".");
            newErrors[path] = error.message;
          });
          setErrors(newErrors);
        } else {
          setError(data.error || "Une erreur est survenue");
        }
        return;
      }

      toast.success("Profil mis à jour avec succès");

      // Mettre à jour les données locales
      const updatedUser = {
        ...user,
        ...validatedData,
      };

      onUpdate(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const path = err.path.join(".");
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      } else {
        setError("Une erreur est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { value: "fr", label: "Français" },
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "de", label: "Deutsch" },
    { value: "it", label: "Italiano" },
  ];

  const timezones = [
    { value: "Europe/Paris", label: "Europe/Paris (UTC+1)" },
    { value: "Europe/London", label: "Europe/London (UTC+0)" },
    { value: "America/New_York", label: "America/New_York (UTC-5)" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8)" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9)" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations de base
          </CardTitle>
          <CardDescription>Modifiez vos informations personnelles de base</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom d'utilisateur *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-red-500" : ""}
                disabled={loading}
                required
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresse email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-red-500 pl-10" : "pl-10"}
                  disabled={loading}
                  required
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              {formData.email !== user.email && (
                <p className="text-sm text-orange-600">
                  ⚠️ Modifier l'email nécessitera une nouvelle vérification
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstname">Prénom</Label>
              <Input
                id="firstname"
                value={formData.profile.firstname}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, firstname: e.target.value },
                  })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastname">Nom de famille</Label>
              <Input
                id="lastname"
                value={formData.profile.lastname}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, lastname: e.target.value },
                  })
                }
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biographie</Label>
            <Textarea
              id="bio"
              value={formData.profile.bio}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  profile: { ...formData.profile, bio: e.target.value },
                })
              }
              placeholder="Parlez-nous de vous..."
              rows={4}
              className={errors["profile.bio"] ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors["profile.bio"] && (
              <p className="text-sm text-red-500">{errors["profile.bio"]}</p>
            )}
            <p className="text-sm text-gray-500">{formData.profile.bio.length}/500 caractères</p>
          </div>
        </CardContent>
      </Card>

      {/* Contact et localisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact et localisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.profile.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      profile: { ...formData.profile, phone: e.target.value },
                    })
                  }
                  placeholder="06 12 34 56 78"
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="address"
                  value={formData.profile.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      profile: { ...formData.profile, address: e.target.value },
                    })
                  }
                  placeholder="Ville, Pays"
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Préférences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Préférences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <Select
                value={formData.profile.language}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, language: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select
                value={formData.profile.timezone}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, timezone: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidentialité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Confidentialité
          </CardTitle>
          <CardDescription>Contrôlez la visibilité de vos informations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Profil public</div>
              <div className="text-xs text-gray-500">
                Permet aux autres utilisateurs de voir votre profil
              </div>
            </div>
            <Switch
              checked={formData.profile.isPublic}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  profile: { ...formData.profile, isPublic: checked },
                })
              }
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Afficher l'email</div>
              <div className="text-xs text-gray-500">
                Rend votre adresse email visible sur votre profil public
              </div>
            </div>
            <Switch
              checked={formData.profile.showEmail}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  profile: { ...formData.profile, showEmail: checked },
                })
              }
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Afficher le téléphone</div>
              <div className="text-xs text-gray-500">
                Rend votre numéro de téléphone visible sur votre profil public
              </div>
            </div>
            <Switch
              checked={formData.profile.showPhone}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  profile: { ...formData.profile, showPhone: checked },
                })
              }
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Erreur globale */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
