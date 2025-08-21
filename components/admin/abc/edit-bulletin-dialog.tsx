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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconLoader2 } from "@tabler/icons-react";

// Définir un type local compatible avec page.tsx
type BulletinData = {
  id: string;
  title: string;
  content: string;
  // Propriétés de page.tsx
  isPublished?: boolean;
  publishedAt?: string | null;
  // Propriétés étendues pour l'édition
  status?: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  _count?: {
    recipients: number;
  };
};

interface EditBulletinDialogProps {
  bulletin: BulletinData;
  onSuccess: () => void;
  onCancel: () => void;
}

const statusLabels = {
  DRAFT: "Brouillon",
  SCHEDULED: "Programmé",
  SENDING: "En cours d'envoi",
  SENT: "Envoyé",
  FAILED: "Échec",
};

export function EditBulletinDialog({
  bulletin,
  onSuccess,
  onCancel,
}: EditBulletinDialogProps) {
  const [title, setTitle] = useState(bulletin.title);
  const [content, setContent] = useState(bulletin.content);
  const [status, setStatus] = useState(
    bulletin.status || (bulletin.isPublished ? "SENT" : "DRAFT")
  );
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (bulletin.scheduledAt) {
      return new Date(bulletin.scheduledAt).toISOString().slice(0, 16);
    }
    if (bulletin.publishedAt) {
      return new Date(bulletin.publishedAt).toISOString().slice(0, 16);
    }
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (status === "SCHEDULED" && !scheduledAt) {
      setError("Veuillez sélectionner une date de programmation");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const updateData: Partial<BulletinData> = {
        title,
        content,
        status,
      };

      if (status === "SCHEDULED" && scheduledAt) {
        updateData.scheduledAt = new Date(scheduledAt).toISOString();
      } else if (status === "DRAFT") {
        updateData.scheduledAt = null;
      }

      const response = await fetch(`/api/admin/abc/bulletins/${bulletin.id}`, {
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

  // Générer une date minimale (maintenant + 1 heure)
  const minDate = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  // Détermine quels statuts sont modifiables
  const getAvailableStatuses = () => {
    const statuses: Record<string, string> = {};

    if (bulletin.status === "DRAFT") {
      statuses.DRAFT = statusLabels.DRAFT;
      statuses.SCHEDULED = statusLabels.SCHEDULED;
    } else if (bulletin.status === "SCHEDULED") {
      statuses.SCHEDULED = statusLabels.SCHEDULED;
      statuses.DRAFT = statusLabels.DRAFT;
    } else {
      // Pour les bulletins envoyés, en cours d'envoi ou en échec, on ne peut plus modifier le statut
      if (bulletin.status && bulletin.status in statusLabels) {
        if (bulletin.status && bulletin.status in statusLabels) {
          statuses[bulletin.status] =
            statusLabels[bulletin.status as keyof typeof statusLabels];
        }
      }
    }

    return statuses;
  };

  const availableStatuses = getAvailableStatuses();
  const canEdit = ["DRAFT", "SCHEDULED"].includes(bulletin.status || "");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!canEdit && (
        <Alert>
          <AlertDescription>
            Ce bulletin ne peut plus être modifié car il a été envoyé ou est en
            cours d&apos;envoi.
          </AlertDescription>
        </Alert>
      )}

      {/* Informations du bulletin */}
      <div className="space-y-2">
        <Label>Informations</Label>
        <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md space-y-1">
          <div>Créé par: {bulletin.createdBy.name}</div>
          <div>
            Date de création:{" "}
            {new Date(bulletin.createdAt).toLocaleDateString("fr-FR")}
          </div>
          {bulletin.sentAt && (
            <div>
              Envoyé le: {new Date(bulletin.sentAt).toLocaleDateString("fr-FR")}
            </div>
          )}
          <div>
            Destinataires: {bulletin._count?.recipients || "N/A"} membre(s)
          </div>
          <div>ID: {bulletin.id}</div>
        </div>
      </div>

      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre du bulletin *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
        />
      </div>

      {/* Contenu */}
      <div className="space-y-2">
        <Label htmlFor="content">Contenu du bulletin *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="min-h-[300px]"
          disabled={!canEdit}
        />
        <div className="text-xs text-muted-foreground">
          {content.length} caractères
        </div>
      </div>

      {/* Statut */}
      <div className="space-y-2">
        <Label>Statut *</Label>
        <Select value={status} onValueChange={setStatus} disabled={!canEdit}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(availableStatuses).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date de programmation (si statut = SCHEDULED) */}
      {status === "SCHEDULED" && canEdit && (
        <div className="space-y-2">
          <Label htmlFor="scheduled-at">Date et heure de programmation *</Label>
          <Input
            id="scheduled-at"
            type="datetime-local"
            min={minDate}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <div className="text-xs text-muted-foreground">
            Le bulletin sera automatiquement envoyé à cette date et heure
          </div>
        </div>
      )}

      {/* Affichage de la date de programmation pour les bulletins programmés (lecture seule) */}
      {status === "SCHEDULED" && !canEdit && bulletin.scheduledAt && (
        <div className="space-y-2">
          <Label>Date de programmation</Label>
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
            {new Date(bulletin.scheduledAt).toLocaleDateString("fr-FR")} à{" "}
            {new Date(bulletin.scheduledAt).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      )}

      {/* Aperçu du contenu */}
      {content && (
        <div className="border rounded-md p-4 bg-gray-50">
          <h4 className="font-medium text-sm mb-2">📋 Aperçu</h4>
          <div className="text-sm bg-white p-3 rounded border">
            <div className="font-bold mb-2">{title || "Titre du bulletin"}</div>
            <div className="whitespace-pre-wrap text-muted-foreground">
              {content.substring(0, 200)}
              {content.length > 200 && "..."}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        {canEdit && (
          <Button type="submit" disabled={loading}>
            {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Modifier le bulletin
          </Button>
        )}
      </div>
    </form>
  );
}
