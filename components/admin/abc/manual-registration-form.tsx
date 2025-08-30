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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  IconUserPlus,
  IconSearch,
  IconX,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  abcMember?: {
    id: string;
    memberNumber: string;
    type: string;
    status: string;
  };
  isAbcMember?: boolean;
}

interface ManualRegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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

export function ManualRegistrationForm({
  open,
  onOpenChange,
  onSuccess,
}: ManualRegistrationFormProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
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
  });
  const [autoApprove, setAutoApprove] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Rechercher les utilisateurs
  useEffect(() => {
    const searchUsers = async () => {
      if (userSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoadingSearch(true);
      try {
        const response = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(
            userSearch
          )}&includeMembers=true`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.users || []);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche d'utilisateurs:", error);
      } finally {
        setLoadingSearch(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [userSearch]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setUserSearch("");
    setSearchResults([]);

    // Préremplir les champs avec les informations de l'utilisateur
    const nameParts = user.name?.split(" ") || [];
    setFormData((prev) => ({
      ...prev,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: user.email,
    }));
  };

  const handleInputChange = (field: string, value: string) => {
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
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/abc/registrations/create-manual",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: selectedUser?.id,
            ...formData,
            autoApprove,
            adminNotes,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          resetForm();
        }, 2000);
      } else {
        setError(result.error || "Erreur lors de la création de l'inscription");
      }
    } catch (error) {
      console.error("Erreur inscription manuelle:", error);
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setUserSearch("");
    setSearchResults([]);
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
    setAutoApprove(true);
    setAdminNotes("");
    setError("");
    setSuccess(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <IconCheck className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Inscription créée !
            </h3>
            <p className="text-muted-foreground">
              {autoApprove
                ? "L'inscription a été créée et approuvée automatiquement."
                : "L'inscription a été créée avec succès."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <IconUserPlus className="h-5 w-5" />
            <span>Créer une inscription manuelle</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sélection d'utilisateur existant */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Utilisateur (optionnel)</h3>
            <p className="text-sm text-muted-foreground">
              Recherchez un utilisateur existant ou laissez vide pour créer une
              nouvelle inscription.
            </p>

            {selectedUser ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedUser.image || ""} />
                    <AvatarFallback>
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.email}
                    </p>
                    {selectedUser.isAbcMember && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Déjà membre ABC: {selectedUser.abcMember?.memberNumber}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(null);
                    setFormData((prev) => ({
                      ...prev,
                      firstName: "",
                      lastName: "",
                      email: "",
                    }));
                  }}
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un utilisateur par nom ou email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                  {loadingSearch && (
                    <IconLoader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleUserSelect(user)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                          {user.isAbcMember && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Membre ABC: {user.abcMember?.memberNumber}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

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
              Informations professionnelles
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
              onValueChange={(value) =>
                handleInputChange("membershipType", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
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
            <Textarea
              value={formData.motivation}
              onChange={(e) => handleInputChange("motivation", e.target.value)}
              placeholder="Motivation pour rejoindre l'association..."
              rows={3}
            />
          </div>

          {/* Options admin */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Options administratives</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoApprove"
                  checked={autoApprove}
                  onCheckedChange={(checked) =>
                    setAutoApprove(checked === true)
                  }
                />
                <Label htmlFor="autoApprove" className="text-sm">
                  Approuver automatiquement cette inscription (créera
                  immédiatement le membre ABC)
                </Label>
              </div>
              <div>
                <Label htmlFor="adminNotes">Notes administratives</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes internes sur cette inscription..."
                  rows={2}
                />
              </div>
            </div>
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
                  Création...
                </>
              ) : (
                <>
                  <IconUserPlus className="h-4 w-4 mr-2" />
                  Créer l&apos;inscription
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
