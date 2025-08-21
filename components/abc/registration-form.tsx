"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconLoader2,
  IconUserPlus,
  IconMail,
  IconFileText,
  IconCheck,
} from "@tabler/icons-react";

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  city: string;
  postalCode: string;
  profession: string;
  company: string;
  siret: string;
  membershipType: string;
  motivation: string;
  interests: string[];
}

const membershipTypes = [
  {
    value: "ACTIF",
    label: "Membre Actif",
    description: "Participation active aux activités",
  },
  { value: "ARTISAN", label: "Artisan", description: "Artisan local" },
  {
    value: "AUTO_ENTREPRENEUR",
    label: "Auto-Entrepreneur",
    description: "Travailleur indépendant",
  },
  {
    value: "PARTENAIRE",
    label: "Partenaire",
    description: "Entreprise partenaire",
  },
  {
    value: "BIENFAITEUR",
    label: "Bienfaiteur",
    description: "Soutien financier",
  },
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

interface RegistrationFormProps {
  onSuccess?: () => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps = {}) {
  const [formData, setFormData] = useState<RegistrationFormData>({
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
    interests: [],
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleInputChange = (
    field: keyof RegistrationFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions pour continuer");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/abc/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        onSuccess?.();
        setFormData({
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
          interests: [],
        });
        setAcceptedTerms(false);
      } else {
        setError(result.error || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error("Erreur inscription:", error);
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <IconCheck className="h-16 w-16 text-green-600 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">
            Inscription envoyée !
          </h3>
          <p className="text-muted-foreground mb-4">
            Votre demande d&apos;adhésion à l&apos;association ABC Bédarieux a
            été envoyée avec succès.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-center space-x-2">
              <IconMail className="h-4 w-4" />
              <span>Un email de confirmation vous a été envoyé</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <IconFileText className="h-4 w-4" />
              <span>
                Le bulletin d&apos;inscription PDF est joint à l&apos;email
              </span>
            </div>
          </div>
          <Button className="mt-6" onClick={() => setSuccess(false)}>
            Nouvelle inscription
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-2xl">
          <IconUserPlus className="h-6 w-6" />
          <span>Adhésion Association ABC Bédarieux</span>
        </CardTitle>
        <p className="text-muted-foreground">
          Rejoignez notre association pour soutenir le commerce local et
          l&apos;artisanat bédaricien
        </p>
      </CardHeader>
      <CardContent>
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
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleInputChange("birthDate", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleInputChange("postalCode", e.target.value)
                  }
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
            <h3 className="text-lg font-semibold">
              Informations professionnelles (optionnel)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  value={formData.profession}
                  onChange={(e) =>
                    handleInputChange("profession", e.target.value)
                  }
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
                <Label htmlFor="siret">SIRET (pour les entreprises)</Label>
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
              onValueChange={(value) =>
                handleInputChange("membershipType", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir le type d'adhésion" />
              </SelectTrigger>
              <SelectContent>
                {membershipTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {type.description}
                      </div>
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
            <div>
              <Label htmlFor="motivation">
                Pourquoi souhaitez-vous rejoindre l&apos;association ABC
                Bédarieux ?
              </Label>
              <Textarea
                id="motivation"
                value={formData.motivation}
                onChange={(e) =>
                  handleInputChange("motivation", e.target.value)
                }
                placeholder="Décrivez vos motivations et ce que vous espérez apporter à l'association..."
                rows={4}
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) =>
                  setAcceptedTerms(checked === true)
                }
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                J&apos;accepte les conditions d&apos;adhésion et autorise
                l&apos;association ABC Bédarieux à traiter mes données
                personnelles dans le cadre de ma demande d&apos;adhésion. Un
                bulletin d&apos;inscription PDF me sera envoyé par email.
              </Label>
            </div>
          </div>

          {/* Bouton de soumission */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full md:w-auto"
              size="lg"
            >
              {loading ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <IconUserPlus className="h-4 w-4 mr-2" />
                  Envoyer ma demande d&apos;adhésion
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
