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

interface CreateBulletinDialogProps {
  onSuccess: () => void;
}

const statusLabels = {
  DRAFT: "Brouillon",
  SCHEDULED: "Programmé",
};

export function CreateBulletinDialog({ onSuccess }: CreateBulletinDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [scheduledAt, setScheduledAt] = useState("");
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

      const bulletinData: { title: string; content: string; status: string; scheduledAt?: string } = {
        title,
        content,
        status,
      };

      if (status === "SCHEDULED" && scheduledAt) {
        bulletinData.scheduledAt = new Date(scheduledAt).toISOString();
      }

      const response = await fetch("/api/admin/abc/bulletins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bulletinData),
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

  // Générer une date minimale (maintenant + 1 heure)
  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre du bulletin *</Label>
        <Input
          id="title"
          placeholder="ex: Bulletin ABC - Janvier 2024"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Contenu */}
      <div className="space-y-2">
        <Label htmlFor="content">Contenu du bulletin *</Label>
        <Textarea
          id="content"
          placeholder="Rédigez le contenu de votre bulletin ici...

Vous pouvez inclure :
- Les dernières actualités de l'association
- Les événements à venir
- Les nouveaux membres
- Les informations importantes

Le contenu sera envoyé par email à tous les membres actifs."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="min-h-[300px]"
        />
        <div className="text-xs text-muted-foreground">
          {content.length} caractères
        </div>
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

      {/* Date de programmation (si statut = SCHEDULED) */}
      {status === "SCHEDULED" && (
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

      {/* Informations sur les destinataires */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="font-medium text-sm mb-2">📧 Destinataires</h4>
        <p className="text-xs text-muted-foreground">
          Ce bulletin sera envoyé à tous les membres actifs de l&apos;association ABC.
          Les membres inactifs, suspendus ou expirés ne recevront pas le bulletin.
        </p>
      </div>

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
        <Button type="submit" disabled={loading}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          {status === "DRAFT" ? "Créer le brouillon" : "Programmer l'envoi"}
        </Button>
      </div>
    </form>
  );
}