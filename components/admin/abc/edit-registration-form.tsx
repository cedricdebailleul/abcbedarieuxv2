"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  IconLoader2, 
  IconEdit,
  IconCheck,
} from "@tabler/icons-react";

interface AbcRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  profession?: string;
  company?: string;
  siret?: string;
  membershipType: string;
  motivation?: string;
  interests?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EditRegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: AbcRegistration | null;
  onSuccess: () => void;
}

const membershipTypes = [
  { value: "ACTIF", label: "Membre Actif", description: "Participation active aux activités" },
  { value: "ARTISAN", label: "Artisan", description: "Artisan local" },
  { value: "AUTO_ENTREPRENEUR", label: "Auto-Entrepreneur", description: "Travailleur indépendant" },
  { value: "PARTENAIRE", label: "Partenaire", description: "Entreprise partenaire" },
  { value: "BIENFAITEUR", label: "Bienfaiteur", description: "Soutien financier" },
];

const interestOptions = [
  "Commerce local",
  "Artisanat",
  "Tourisme",
  "Culture",
  "Événements",
  "Networking",
  "Formation",
  "Solidarité",
];

export function EditRegistrationForm({ open, onOpenChange, registration, onSuccess }: EditRegistrationFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    address: "",
    city: "",
    postalCode: "",
    profession: "",
    company: "",
    siret: "",
    membershipType: "ACTIF",
    motivation: "",
    interests: [] as string[],
    adminNotes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Charger les données de l'inscription quand elle change
  useEffect(() => {
    if (registration) {
      const interestsArray = registration.interests ? registration.interests.split(',').map(s => s.trim()) : [];
      
      setFormData({
        firstName: registration.firstName || "",
        lastName: registration.lastName || "",
        email: registration.email || "",
        phone: registration.phone || "",
        birthDate: registration.birthDate ? new Date(registration.birthDate).toISOString().split('T')[0] : "",
        address: registration.address || "",
        city: registration.city || "",
        postalCode: registration.postalCode || "",
        profession: registration.profession || "",
        company: registration.company || "",
        siret: registration.siret || "",
        membershipType: registration.membershipType || "ACTIF",
        motivation: registration.motivation || "",
        interests: interestsArray,
        adminNotes: registration.adminNotes || "",
      });
    }
  }, [registration]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/admin/abc/registrations/${registration.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          interests: formData.interests.join(", "),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          resetForm();
        }, 2000);
      } else {
        setError(result.error || "Erreur lors de la modification de l'inscription");
      }
    } catch (error) {
      console.error("Erreur modification inscription:", error);
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError("");
    setSuccess(false);
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <IconCheck className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Inscription modifiée !
            </h3>
            <p className="text-muted-foreground">
              Les informations de l&apos;inscription ont été mises à jour avec succès.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!registration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <IconEdit className="h-5 w-5" />
            <span>Modifier l&apos;inscription de {registration.firstName} {registration.lastName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="birthDate">Date de naissance</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange("birthDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Adresse</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations professionnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  value={formData.profession}
                  onChange={(e) => handleInputChange("profession", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  value={formData.siret}
                  onChange={(e) => handleInputChange("siret", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Type d'adhésion */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Type d&apos;adhésion</h3>
            <Select
              value={formData.membershipType}
              onValueChange={(value) => handleInputChange("membershipType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {membershipTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Centres d'intérêt */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Centres d&apos;intérêt</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {interestOptions.map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={interest}
                    checked={formData.interests.includes(interest)}
                    onCheckedChange={() => handleInterestToggle(interest)}
                  />
                  <Label htmlFor={interest} className="text-sm">
                    {interest}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Motivation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Motivation</h3>
            <Textarea
              value={formData.motivation}
              onChange={(e) => handleInputChange("motivation", e.target.value)}
              placeholder="Motivation pour rejoindre l'association..."
              rows={3}
            />
          </div>

          {/* Notes admin */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Notes administratives</h3>
            <Textarea
              value={formData.adminNotes}
              onChange={(e) => handleInputChange("adminNotes", e.target.value)}
              placeholder="Notes internes sur cette inscription..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Modification...
                </>
              ) : (
                <>
                  <IconEdit className="h-4 w-4 mr-2" />
                  Modifier l&apos;inscription
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}