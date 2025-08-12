"use client";

import { AlertCircle, CheckCircle2, Crop, Eye, Image as ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { PixelCrop } from "react-image-crop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ImageCropper } from "./image-cropper";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  type?: string; // "posts", "events", etc.
  slug?: string;
  subFolder?: string; // Utilisé pour les sous-dossiers dans l'upload pour galleries
  imageType?: string; // "logo", "cover", "gallery", etc.
  className?: string;
  aspectRatios?: {
    label: string;
    value: number | undefined;
  }[];
  maxSize?: number; // en MB
  showPreview?: boolean;
  showCrop?: boolean;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  preview: string | null;
  cropData: PixelCrop | null;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  type = "posts",
  slug = "general",
  subFolder,
  imageType,
  className,
  aspectRatios,
  maxSize = 10,
  showPreview = true,
  showCrop = true,
}: ImageUploadProps) {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    preview: null,
    cropData: null,
  });
  const [showCropper, setShowCropper] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const uploadImage = useCallback(
    async (file: File, cropData?: PixelCrop) => {
      setState((prev) => ({
        ...prev,
        isUploading: true,
        progress: 0,
        error: null,
      }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        formData.append("slug", slug);
        if (subFolder) {
          formData.append("subFolder", subFolder);
        }
        if (imageType) {
          formData.append("imageType", imageType);
        }

        // Ajouter l'ancienne image pour suppression si elle existe
        if (value?.startsWith("/uploads/")) {
          formData.append("oldImagePath", value);
        }

        if (cropData) {
          formData.append("cropData", JSON.stringify(cropData));
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de l'upload");
        }

        const result = await response.json();
        onChange(result.url);

        setState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 100,
          preview: null,
          cropData: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : "Erreur lors de l'upload",
        }));
      }
    },
    [onChange, type, slug, imageType, subFolder, value]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Vérifier la taille
      if (file.size > maxSize * 1024 * 1024) {
        setState((prev) => ({
          ...prev,
          error: `Le fichier est trop volumineux. Taille maximale: ${maxSize}MB`,
        }));
        return;
      }

      // Créer l'aperçu
      const reader = new FileReader();
      reader.onload = () => {
        setState((prev) => ({
          ...prev,
          preview: reader.result as string,
          error: null,
        }));
        setOriginalFile(file);

        // Ouvrir le cropper si activé
        if (showCrop) {
          setShowCropper(true);
        } else {
          uploadImage(file);
        }
      };
      reader.readAsDataURL(file);
    },
    [maxSize, showCrop, uploadImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    disabled: state.isUploading,
  });

  const handleCropComplete = useCallback(
    (cropData: PixelCrop, _croppedImageUrl: string) => {
      if (originalFile) {
        setState((prev) => ({ ...prev, cropData }));
        uploadImage(originalFile, cropData);
      }
      setShowCropper(false);
    },
    [originalFile, uploadImage]
  );

  const handleRemove = useCallback(async () => {
    // Si c'est une image uploadée, la supprimer physiquement
    if (value?.startsWith("/uploads/")) {
      setState((prev) => ({ ...prev, isUploading: true }));

      try {
        const response = await fetch(`/api/upload?path=${encodeURIComponent(value)}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          console.error("Erreur lors de la suppression du fichier");
          setState((prev) => ({
            ...prev,
            isUploading: false,
            error: "Erreur lors de la suppression du fichier",
          }));
          return;
        }
      } catch (error) {
        console.error("Erreur suppression fichier:", error);
        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: "Erreur lors de la suppression du fichier",
        }));
        return;
      }
    }

    setState({
      isUploading: false,
      progress: 0,
      error: null,
      preview: null,
      cropData: null,
    });
    setOriginalFile(null);
    onRemove?.();
  }, [onRemove, value]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zone d'upload */}
      {!value && (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50",
                state.isUploading && "pointer-events-none opacity-50"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">
                    {isDragActive ? "Déposez l'image ici" : "Télécharger une image"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Glissez-déposez une image ou cliquez pour sélectionner
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">JPG</Badge>
                    <Badge variant="outline">PNG</Badge>
                    <Badge variant="outline">WebP</Badge>
                    <span>•</span>
                    <span>Max {maxSize}MB</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barre de progression */}
      {state.isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Upload en cours...</span>
                <span className="text-sm text-muted-foreground">{state.progress}%</span>
              </div>
              <Progress value={state.progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erreur */}
      {state.error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{state.error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aperçu de l'image uploadée */}
      {value && showPreview && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <img
                  src={value}
                  alt="Image uploadée"
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="absolute -top-2 -right-2">
                  <div className="bg-green-100 text-green-600 p-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Image uploadée</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={value} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </a>
                  </Button>

                  {showCrop && originalFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowCropper(true);
                      }}
                    >
                      <Crop className="h-4 w-4 mr-2" />
                      Recadrer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cropper */}
      {state.preview && (
        <ImageCropper
          src={state.preview}
          isOpen={showCropper}
          onClose={() => setShowCropper(false)}
          onCropComplete={handleCropComplete}
          aspectRatios={aspectRatios}
        />
      )}
    </div>
  );
}
