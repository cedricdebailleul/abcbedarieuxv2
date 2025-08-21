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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconLoader2 } from "@tabler/icons-react";

interface Document {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isPublic: boolean;
  uploadedAt: string;
  uploadedBy: {
    name: string;
    email: string;
  };
}

interface EditDocumentDialogProps {
  document: Document;
  onSuccess: () => void;
  onCancel: () => void;
}

const typeLabels = {
  STATUTES: "Statuts",
  MINUTES: "Procès-verbaux",
  FINANCIAL: "Documents financiers",
  INTERNAL_RULES: "Règlement intérieur",
  FORMS: "Formulaires",
  REPORTS: "Rapports",
  OTHER: "Autres",
};

export function EditDocumentDialog({
  document,
  onSuccess,
  onCancel,
}: EditDocumentDialogProps) {
  const [title, setTitle] = useState(document.title);
  const [description, setDescription] = useState(document.description || "");
  const [type, setType] = useState(document.type);
  const [isPublic, setIsPublic] = useState(document.isPublic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !type) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const updateData = {
        title,
        description: description || null,
        type,
        isPublic,
      };

      const response = await fetch(`/api/admin/abc/documents/${document.id}`, {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "📊";
    if (mimeType.includes("image")) return "🖼️";
    return "📁";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Informations du fichier (lecture seule) */}
      <div className="space-y-2">
        <Label>Fichier actuel</Label>
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getFileIcon(document.mimeType)}</span>
            <div>
              <div className="font-medium">{document.fileName}</div>
              <div className="text-sm text-muted-foreground">
                {formatFileSize(document.fileSize)} • {document.mimeType}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre du document *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Textarea
          id="description"
          placeholder="Description du contenu du document..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label>Type de document *</Label>
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

      {/* Visibilité */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-public"
          checked={isPublic}
          onCheckedChange={(checked) => setIsPublic(checked === true)}
        />
        <Label htmlFor="is-public" className="text-sm">
          Document public (accessible à tous les membres)
        </Label>
      </div>

      {/* Informations complémentaires */}
      <div className="space-y-2">
        <Label>Informations</Label>
        <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md space-y-1">
          <div>Uploadé par: {document.uploadedBy.name}</div>
          <div>
            Date d&apos;upload:{" "}
            {new Date(document.uploadedAt).toLocaleDateString("fr-FR")}
          </div>
          <div>ID: {document.id}</div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          Modifier le document
        </Button>
      </div>
    </form>
  );
}
