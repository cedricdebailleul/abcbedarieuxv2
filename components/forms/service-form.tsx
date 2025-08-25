"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, X, Save, Clock } from "lucide-react";

const serviceFormSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Maximum 100 caractères"),
  description: z.string().optional(),
  summary: z.string().max(280, "Maximum 280 caractères").optional(),
  price: z.number().min(0, "Le prix doit être positif").optional(),
  priceType: z
    .enum(["FIXED", "HOURLY", "DAILY", "VARIABLE", "ON_REQUEST", "FREE"])
    .default("FIXED"),
  currency: z.string().default("EUR"),
  unit: z.string().optional(),
  duration: z.number().int().min(1, "La durée doit être positive").optional(),
  status: z
    .enum(["DRAFT", "PUBLISHED", "UNAVAILABLE", "DISCONTINUED", "ARCHIVED"])
    .default("DRAFT"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  requiresBooking: z.boolean().default(false),
  category: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

const priceTypes = [
  { value: "FIXED", label: "Prix fixe" },
  { value: "HOURLY", label: "Par heure" },
  { value: "DAILY", label: "Par jour" },
  { value: "VARIABLE", label: "Prix variable" },
  { value: "ON_REQUEST", label: "Sur demande" },
  { value: "FREE", label: "Gratuit" },
];

const statuses = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "PUBLISHED", label: "Publié" },
  { value: "UNAVAILABLE", label: "Indisponible" },
  { value: "DISCONTINUED", label: "Arrêté" },
  { value: "ARCHIVED", label: "Archivé" },
];

interface ServiceFormProps {
  placeId: string;
  placeName?: string;
  initialData?: Partial<ServiceFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ServiceForm({
  placeId,
  placeName,
  initialData,
  onSuccess,
  onCancel,
}: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>(
    initialData?.tags
      ? initialData.tags.split(",").map((tag) => tag.trim())
      : []
  );
  const [newTag, setNewTag] = useState("");

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(
      serviceFormSchema
    ) as unknown as Resolver<ServiceFormData>,
    defaultValues: {
      name: "",
      description: "",
      summary: "",
      price: undefined,
      priceType: "FIXED",
      currency: "EUR",
      unit: "",
      duration: undefined,
      status: "DRAFT",
      isActive: true,
      isFeatured: false,
      isAvailable: true,
      requiresBooking: false,
      category: "",
      tags: "",
      coverImage: "",
      images: [],
      metaTitle: "",
      metaDescription: "",
      ...initialData,
    },
  });

  const priceType = form.watch("priceType");
  const showPrice = priceType !== "FREE" && priceType !== "ON_REQUEST";

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      form.setValue("tags", updatedTags.join(", "));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    form.setValue("tags", updatedTags.join(", "));
  };

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}min`;
  };

  async function onSubmit(data: ServiceFormData) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/places/${placeId}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la création du service"
        );
      }

      toast.success("Service créé avec succès !");
      form.reset();
      setTags([]);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la création du service:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création du service. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Ajouter un service
          {placeName && (
            <Badge variant="outline" className="ml-2">
              {placeName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations générales</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du service *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Réparation de vélos"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Réparation, Conseil, Formation..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Résumé court</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Description courte pour les aperçus (280 caractères max)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Utilisé dans les listes et partages sociaux
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description complète</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description détaillée du service, ce qui est inclus, le processus..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Prix et durée */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Prix et durée</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="priceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de prix</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showPrice && (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                parseFloat(e.target.value) || undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unité</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: /intervention, /heure"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée estimée (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ex: 60 pour 1 heure"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || undefined)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {form.watch("duration") && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Durée: {formatDuration(form.watch("duration"))}
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tags et catégorisation</h3>

              <div className="space-y-2">
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Statut et options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Statut et options</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Actif</FormLabel>
                        <FormDescription>
                          Le service est visible et disponible
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Service vedette
                        </FormLabel>
                        <FormDescription>
                          Mis en avant dans les listes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Disponible</FormLabel>
                        <FormDescription>
                          Le service peut être demandé
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresBooking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Réservation requise
                        </FormLabel>
                        <FormDescription>
                          Le service nécessite une prise de rendez-vous
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SEO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">SEO (Optionnel)</h3>

              <FormField
                control={form.control}
                name="metaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre SEO</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Titre pour les moteurs de recherche"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description SEO</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description pour les moteurs de recherche (160 caractères max)"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Création..." : "Créer le service"}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
