"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

import { createTagsAction } from "@/actions/post";

import { Plus, Tag as TagIcon, Loader2, Palette, X } from "lucide-react";

// Schéma de validation pour le formulaire de création de tags
const createTagsFormSchema = z.object({
  names: z
    .string()
    .min(1, "Au moins un nom de tag est requis")
    .refine((value) => {
      const names = value
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      return names.length > 0;
    }, "Au moins un nom de tag valide est requis"),
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "La couleur doit être un code hexadécimal valide"
    )
    .optional(),
});

type CreateTagsFormInput = z.infer<typeof createTagsFormSchema>;

interface CreateTagsDialogProps {
  onTagsCreated?: (tags: any[]) => void;
  trigger?: React.ReactNode;
}

export function CreateTagsDialog({
  onTagsCreated,
  trigger,
}: CreateTagsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [previewTags, setPreviewTags] = useState<string[]>([]);

  const form = useForm<CreateTagsFormInput>({
    resolver: zodResolver(createTagsFormSchema),
    defaultValues: {
      names: "",
      color: "#8B5CF6",
    },
  });

  // Prévisualiser les tags basés sur l'input
  const watchNames = form.watch("names");

  const updatePreview = (names: string) => {
    const tagNames = names
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .filter((name, index, arr) => arr.indexOf(name) === index); // Supprimer doublons

    setPreviewTags(tagNames);
  };

  // Mettre à jour la prévisualisation quand l'input change
  React.useEffect(() => {
    updatePreview(watchNames);
  }, [watchNames]);

  const onSubmit = async (data: CreateTagsFormInput) => {
    startTransition(async () => {
      try {
        const result = await createTagsAction({
          names: data.names,
          color: data.color,
        });

        if (result.success && result.data) {
          const { created, existing } = result.data;

          // Afficher les résultats
          if (created.length > 0 && existing.length > 0) {
            toast.success(
              `${created.length} tag(s) créé(s), ${existing.length} existait(s) déjà`
            );
          } else if (created.length > 0) {
            toast.success(`${created.length} tag(s) créé(s) avec succès`);
          } else if (existing.length > 0) {
            toast.info(`Tous les tags existaient déjà (${existing.length})`);
          }

          // Appeler le callback avec tous les tags (créés + existants)
          if (onTagsCreated) {
            onTagsCreated([...created, ...existing]);
          }

          // Réinitialiser le formulaire et fermer
          form.reset();
          setPreviewTags([]);
          setOpen(false);
        } else {
          toast.error(result.error || "Erreur lors de la création");
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Une erreur inattendue est survenue");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
      setPreviewTags([]);
    }
  };

  const removePreviewTag = (tagToRemove: string) => {
    const currentNames = form.getValues("names");
    const tagNames = currentNames
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name !== tagToRemove && name.length > 0);

    const newValue = tagNames.join(", ");
    form.setValue("names", newValue);
    updatePreview(newValue);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" type="button">
      <Plus className="h-4 w-4 mr-2" />
      Nouveaux tags
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Créer de nouveaux tags
          </DialogTitle>
          <DialogDescription>
            Ajoutez un ou plusieurs tags séparés par des virgules. Les tags
            existants seront détectés automatiquement.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="names"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Noms des tags *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="React, Next.js, TypeScript..."
                      {...field}
                      onBlur={(e) => {
                        field.onBlur();
                        updatePreview(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Séparez plusieurs tags par des virgules
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prévisualisation des tags */}
            {previewTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Prévisualisation ({previewTags.length} tag
                  {previewTags.length > 1 ? "s" : ""})
                </Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-muted/50">
                  {previewTags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                      style={{
                        backgroundColor:
                          (form.watch("color") || "#8B5CF6") + "20",
                        color: form.watch("color") || "#8B5CF6",
                      }}
                    >
                      <TagIcon className="h-3 w-3" />
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removePreviewTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Couleur
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1 border rounded"
                        {...field}
                        value={field.value || "#8B5CF6"}
                      />
                      <Input
                        placeholder="#8B5CF6"
                        className="flex-1"
                        {...field}
                        value={field.value || "#8B5CF6"}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Couleur qui sera appliquée à tous les nouveaux tags
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isPending || previewTags.length === 0}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer {previewTags.length > 0 && `(${previewTags.length})`}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
