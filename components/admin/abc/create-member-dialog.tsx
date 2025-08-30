"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconSearch, IconLoader2 } from "@tabler/icons-react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateMemberDialogProps {
  onSuccess: () => void;
}

const typeLabels = {
  ACTIF: "Actif",
  ARTISAN: "Artisan",
  AUTO_ENTREPRENEUR: "Auto-entrepreneur",
  PARTENAIRE: "Partenaire",
  BIENFAITEUR: "Bienfaiteur",
};

const roleLabels = {
  MEMBRE: "Membre",
  SECRETAIRE: "Secrétaire",
  TRESORIER: "Trésorier",
  PRESIDENT: "Président",
  VICE_PRESIDENT: "Vice-président",
};

export function CreateMemberDialog({ onSuccess }: CreateMemberDialogProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [type, setType] = useState("");
  const [role, setRole] = useState("MEMBRE");
  const [memberNumber, setMemberNumber] = useState("");
  const [membershipDate, setMembershipDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // Format YYYY-MM-DD
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUserSearch = (value: string) => {
    setUserSearch(value);
    if (value !== selectedUser?.name && value !== selectedUser?.email) {
      setSelectedUser(null);
    }
    searchUsers(value);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setUserSearch(user.name);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !type) {
      setError("Veuillez sélectionner un utilisateur et un type de membre");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/abc/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          type,
          role,
          membershipDate: membershipDate,
          ...(memberNumber && { memberNumber }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recherche d'utilisateur */}
      <div className="space-y-2">
        <Label htmlFor="user-search">Utilisateur *</Label>
        <div className="relative">
          <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="user-search"
            placeholder="Rechercher un utilisateur par nom ou email..."
            value={userSearch}
            onChange={(e) => handleUserSearch(e.target.value)}
            className="pl-8"
          />
          {searchLoading && (
            <IconLoader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="border rounded-md bg-background max-h-48 overflow-y-auto">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                onClick={() => handleUserSelect(user)}
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">
                  {user.email}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedUser && (
          <div className="p-2 bg-muted rounded-md">
            <div className="font-medium">{selectedUser.name}</div>
            <div className="text-sm text-muted-foreground">
              {selectedUser.email}
            </div>
          </div>
        )}
      </div>

      {/* Type de membre */}
      <div className="space-y-2">
        <Label>Type de membre *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner le type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rôle */}
      <div className="space-y-2">
        <Label>Rôle</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(roleLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date d'adhésion */}
      <div className="space-y-2">
        <Label htmlFor="membership-date">Date d&apos;adhésion réelle *</Label>
        <Input
          id="membership-date"
          type="date"
          value={membershipDate}
          onChange={(e) => setMembershipDate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Date réelle d&apos;adhésion (sur papier ou en ligne)
        </p>
      </div>

      {/* Numéro de membre */}
      <div className="space-y-2">
        <Label htmlFor="member-number">Numéro de membre (optionnel)</Label>
        <Input
          id="member-number"
          placeholder="ex: ABC001"
          value={memberNumber}
          onChange={(e) => setMemberNumber(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading || !selectedUser || !type}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer le membre
        </Button>
      </div>
    </form>
  );
}
