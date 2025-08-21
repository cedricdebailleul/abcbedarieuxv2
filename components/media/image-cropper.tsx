"use client";

import { Crop as CropIcon, RotateCcw, Save, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
  type PixelCrop,
} from "react-image-crop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropperProps {
  src: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (cropData: PixelCrop, croppedImageUrl: string) => void;
  aspectRatios?: {
    label: string;
    value: number | undefined;
  }[];
}

const defaultAspectRatios = [
  { label: "Libre", value: undefined },
  { label: "Carré (1:1)", value: 1 },
  { label: "Paysage (16:9)", value: 16 / 9 },
  { label: "Paysage (4:3)", value: 4 / 3 },
  { label: "Portrait (3:4)", value: 3 / 4 },
  { label: "Portrait (9:16)", value: 9 / 16 },
];

export function ImageCropper({
  src,
  isOpen,
  onClose,
  onCropComplete,
  aspectRatios = defaultAspectRatios,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;

    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 80,
        },
        aspect || width / height,
        width,
        height
      ),
      width,
      height
    );

    setCrop(crop);
  }

  const generateCanvas = useCallback(
    (image: HTMLImageElement, crop: PixelCrop) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Calculer les dimensions réelles du crop dans l'image naturelle
      const cropWidth = crop.width * scaleX;
      const cropHeight = crop.height * scaleY;

      const pixelRatio = window.devicePixelRatio;

      // Utiliser les dimensions réelles pour le canvas
      canvas.width = cropWidth * pixelRatio;
      canvas.height = cropHeight * pixelRatio;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
    },
    []
  );

  const onSaveCrop = useCallback(async () => {
    const image = imgRef.current;
    const canvas = canvasRef.current;

    if (!image || !canvas || !completedCrop) {
      return;
    }

    generateCanvas(image, completedCrop);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const croppedImageUrl = URL.createObjectURL(blob);

        // Convertir les coordonnées du crop en coordonnées de l'image originale
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const scaledCrop = {
          x: completedCrop.x * scaleX,
          y: completedCrop.y * scaleY,
          width: completedCrop.width * scaleX,
          height: completedCrop.height * scaleY,
          unit: completedCrop.unit,
        };

        onCropComplete(scaledCrop, croppedImageUrl);
        onClose();
      },
      "image/jpeg",
      0.9
    );
  }, [completedCrop, generateCanvas, onCropComplete, onClose]);

  const resetCrop = () => {
    if (!imgRef.current) return;

    const { width, height } = imgRef.current;
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 80,
        },
        aspect || width / height,
        width,
        height
      ),
      width,
      height
    );

    setCrop(newCrop);
  };

  const handleAspectChange = (value: string) => {
    const selectedRatio = aspectRatios.find((r) => r.label === value);
    const newAspect = selectedRatio?.value;

    setAspect(newAspect);

    if (!imgRef.current) return;

    const { width, height } = imgRef.current;
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 80,
        },
        newAspect || width / height,
        width,
        height
      ),
      width,
      height
    );

    setCrop(newCrop);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5" />
            Rogner l&apos;image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contrôles */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Label>Format:</Label>
              <Select
                value={
                  aspectRatios.find((r) => r.value === aspect)?.label || "Libre"
                }
                onValueChange={handleAspectChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map((ratio) => (
                    <SelectItem key={ratio.label} value={ratio.label}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={resetCrop}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>

            {completedCrop && (
              <Badge variant="secondary">
                {Math.round(completedCrop.width)} x{" "}
                {Math.round(completedCrop.height)}px
              </Badge>
            )}
          </div>

          {/* Zone de crop */}
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
              onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              aspect={aspect}
              minWidth={50}
              minHeight={50}
              className="max-w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt="Image à rogner"
                onLoad={onImageLoad}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </ReactCrop>
          </div>

          {/* Aperçu (caché, utilisé pour générer le canvas) */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={onSaveCrop} disabled={!completedCrop}>
              <Save className="h-4 w-4 mr-2" />
              Appliquer le recadrage
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
