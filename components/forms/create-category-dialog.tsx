"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Folder, Palette, Plus, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createCategoryAction } from "@/actions/post";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type CategoryInput,
  createCategorySchema,
  generateSlug,
} from "@/lib/validations/post";
import { Category } from "@/lib/generated/prisma";

interface CreateCategoryDialogProps {
  onCategoryCreated?: (category: Category) => void;
  trigger?: React.ReactNode;
}

export function CreateCategoryDialog({
  onCategoryCreated,
  trigger,
}: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CategoryInput>({
    resolver: zodResolver(createCategorySchema, undefined, { raw: true }),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      color: "#6B7280",
      parentId: null,
    },
  });

  // Générer automatiquement le slug à partir du nom
  const watchName = form.watch("name");
  const watchSlug = form.watch("slug");

  // Mettre à jour le slug automatiquement
  const updateSlug = () => {
    if (watchName && !watchSlug) {
      const newSlug = generateSlug(watchName);
      form.setValue("slug", newSlug);
    }
  };

  const onSubmit = async (data: CategoryInput) => {
    startTransition(async () => {
      try {
        const result = await createCategoryAction(data);

        if (result.success && result.data) {
          toast.success("Catégorie créée avec succès");

          // Appeler le callback si fourni
          if (onCategoryCreated) {
            onCategoryCreated({
              ...result.data,
              slug: "slug" in result.data ? (result.data.slug as string) : "",
              description:
                "description" in result.data
                  ? (result.data.description as string | null)
                  : null,
              color:
                "color" in result.data
                  ? (result.data.color as string | null)
                  : null,
              parentId:
                "parentId" in result.data
                  ? (result.data.parentId as string | null)
                  : null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          // Réinitialiser le formulaire et fermer
          form.reset();
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
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" type="button">
      <Plus className="h-4 w-4 mr-2" />
      Nouvelle catégorie
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Créer une nouvelle catégorie
          </DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle catégorie pour organiser vos articles.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nom de la catégorie"
                      {...field}
                      onBlur={() => {
                        field.onBlur();
                        updateSlug();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="slug-de-la-categorie" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description de la catégorie (optionnel)"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        value={field.value || "#6B7280"}
                      />
                      <Input
                        placeholder="#6B7280"
                        className="flex-1"
                        {...field}
                        value={field.value || "#6B7280"}
                      />
                    </div>
                  </FormControl>
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
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer
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
