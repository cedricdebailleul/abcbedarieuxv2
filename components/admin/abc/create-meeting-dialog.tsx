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

interface CreateMeetingDialogProps {
  onSuccess: () => void;
}

const typeLabels = {
  GENERAL: "Assemblée générale",
  BUREAU: "Conseil d'administration", 
  EXTRAORDINAIRE: "Assemblée extraordinaire",
  COMMISSION: "Commission",
};

const statusLabels = {
  SCHEDULED: "Programmée",
};

export function CreateMeetingDialog({ onSuccess }: CreateMeetingDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("SCHEDULED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !type || !scheduledAt) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const meetingData: any = {
        title,
        description: description || null,
        type,
        scheduledAt: new Date(scheduledAt).toISOString(),
        status,
        location: location || null,
      };

      if (duration) {
        meetingData.duration = parseInt(duration);
      }


      const response = await fetch("/api/admin/abc/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingData),
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

  // Générer une date minimale (aujourd'hui)
  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre de la réunion *</Label>
        <Input
          id="title"
          placeholder="ex: Assemblée générale 2024"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Textarea
          id="description"
          placeholder="Détails et ordre du jour de la réunion..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label>Type de réunion *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un type" />
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

      {/* Date et heure */}
      <div className="space-y-2">
        <Label htmlFor="scheduled-at">Date et heure *</Label>
        <Input
          id="scheduled-at"
          type="datetime-local"
          min={minDate}
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </div>

      {/* Durée */}
      <div className="space-y-2">
        <Label htmlFor="duration">Durée (minutes)</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          placeholder="ex: 120"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>

      {/* Lieu */}
      <div className="space-y-2">
        <Label htmlFor="location">Lieu (optionnel)</Label>
        <Input
          id="location"
          placeholder="ex: Salle des fêtes, 123 rue de la République"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>


      {/* Statut */}
      <div className="space-y-2">
        <Label>Statut initial *</Label>
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

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer la réunion
        </Button>
      </div>
    </form>
  );
}