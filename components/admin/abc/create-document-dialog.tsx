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
import { IconLoader2, IconUpload } from "@tabler/icons-react";

interface CreateDocumentDialogProps {
  onSuccess: () => void;
}

const typeLabels = {
  MINUTES: "Procès-verbaux",
  AGENDA: "Ordre du jour",
  FINANCIAL: "Documents financiers",
  LEGAL: "Documents légaux",
  COMMUNICATION: "Communications",
  OTHER: "Autres",
};

export function CreateDocumentDialog({ onSuccess }: CreateDocumentDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier la taille du fichier (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("Le fichier ne peut pas dépasser 10MB");
        return;
      }

      // Vérifier le type de fichier
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/gif",
        "text/plain",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Type de fichier non autorisé. Formats acceptés: PDF, Word, Excel, images, texte");
        return;
      }

      setFile(selectedFile);
      setError("");
      
      // Auto-compléter le titre si vide
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !type || !file) {
      setError("Veuillez remplir tous les champs obligatoires et sélectionner un fichier");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", type);
      formData.append("isPublic", isPublic.toString());
      formData.append("file", file);

      const response = await fetch("/api/admin/abc/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'upload");
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

      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre du document *</Label>
        <Input
          id="title"
          placeholder="ex: Statuts de l'association 2024"
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

      {/* Upload de fichier */}
      <div className="space-y-2">
        <Label htmlFor="file">Fichier *</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <IconUpload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <Label htmlFor="file" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Cliquez pour sélectionner un fichier
                </span>
                <Input
                  id="file"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                />
              </Label>
              <p className="mt-1 text-xs text-gray-500">
                PDF, Word, Excel, images, texte (max 10MB)
              </p>
            </div>
          </div>
          {file && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visibilité */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-public"
          checked={isPublic}
          onCheckedChange={setIsPublic}
        />
        <Label htmlFor="is-public" className="text-sm">
          Document public (accessible à tous les membres)
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading || !file}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          Uploader le document
        </Button>
      </div>
    </form>
  );
}