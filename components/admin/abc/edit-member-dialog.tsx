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
import { IconLoader2 } from "@tabler/icons-react";

interface Member {
  id: string;
  type: string;
  role: string;
  status: string;
  memberNumber: string | null;
  membershipDate: string | null;
  joinedAt: string;
  renewedAt: string | null;
  expiresAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface EditMemberDialogProps {
  member: Member;
  onSuccess: () => void;
  onCancel: () => void;
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

const statusLabels = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  SUSPENDED: "Suspendu",
  EXPIRED: "Expiré",
};

export function EditMemberDialog({
  member,
  onSuccess,
  onCancel,
}: EditMemberDialogProps) {
  const [type, setType] = useState(member.type);
  const [role, setRole] = useState(member.role);
  const [status, setStatus] = useState(member.status);
  const [memberNumber, setMemberNumber] = useState(member.memberNumber || "");
  const [renewalYear, setRenewalYear] = useState(() => {
    if (member.renewedAt) {
      return new Date(member.renewedAt).getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      // Calculer les nouvelles dates si l'année de renouvellement change
      const renewedAt = new Date(`${renewalYear}-01-01`);
      const expiresAt = new Date(`${renewalYear}-12-31`);

      const updateData: Partial<Omit<Member, "id" | "user" | "joinedAt">> = {
        type,
        role,
        status,
        renewedAt: renewedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      if (memberNumber !== member.memberNumber) {
        updateData.memberNumber = memberNumber || null;
      }

      const response = await fetch(`/api/admin/abc/members/${member.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la modification");
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

      {/* Informations utilisateur (lecture seule) */}
      <div className="space-y-2">
        <Label>Utilisateur</Label>
        <div className="p-2 bg-muted rounded-md">
          <div className="font-medium">{member.user.name}</div>
          <div className="text-sm text-muted-foreground">
            {member.user.email}
          </div>
        </div>
      </div>

      {/* Type de membre */}
      <div className="space-y-2">
        <Label>Type de membre *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
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
        <Label>Rôle *</Label>
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

      {/* Statut */}
      <div className="space-y-2">
        <Label>Statut *</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Année de renouvellement */}
      <div className="space-y-2">
        <Label>Année de renouvellement *</Label>
        <Select value={renewalYear} onValueChange={setRenewalYear}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i + 1;
              return (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Numéro de membre */}
      <div className="space-y-2">
        <Label htmlFor="member-number">Numéro de membre</Label>
        <Input
          id="member-number"
          placeholder="ex: ABC001"
          value={memberNumber}
          onChange={(e) => setMemberNumber(e.target.value)}
        />
      </div>

      {/* Informations sur l'adhésion */}
      <div className="space-y-2">
        <Label>Informations adhésion</Label>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>
            Première adhésion:{" "}
            {new Date(member.joinedAt).toLocaleDateString("fr-FR")}
          </div>
          {member.renewedAt && (
            <div>
              Dernier renouvellement:{" "}
              {new Date(member.renewedAt).toLocaleDateString("fr-FR")}
            </div>
          )}
          {member.expiresAt && (
            <div>
              Expire le:{" "}
              {new Date(member.expiresAt).toLocaleDateString("fr-FR")}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          Modifier le membre
        </Button>
      </div>
    </form>
  );
}
