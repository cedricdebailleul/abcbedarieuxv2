"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HexColorPicker } from "react-colorful";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import {
  createBadgeAction,
  updateBadgeAction,
  getBadgeAction,
} from "@/actions/badge";
import {
  createBadgeSchema,
  updateBadgeSchema,
  CATEGORY_LABELS,
  RARITY_LABELS,
  RARITY_COLORS,
  type CreateBadgeInput,
  type UpdateBadgeInput,
} from "@/lib/validations/badge";
import { BadgeFormData } from "@/lib/types/badge";
import { BadgeCategory, BadgeRarity } from "@/lib/generated/prisma";
import Image from "next/image";

interface BadgeFormProps {
  mode: "create" | "edit";
  badgeId?: string;
  initialData?: Partial<BadgeFormData>;
}

export function BadgeForm({ mode, badgeId, initialData }: BadgeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [loading, setLoading] = useState(mode === "edit" && !initialData);

  const schema = mode === "create" ? createBadgeSchema : updateBadgeSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      id: "", // Ensure 'id' is part of the default values and type definition
      title: "",
      description: "",
      category: BadgeCategory.ACHIEVEMENT,
      rarity: BadgeRarity.COMMON,
      color: RARITY_COLORS[BadgeRarity.COMMON],
      iconUrl: "",
      isActive: true,
      ...initialData,
    },
  });

  // Charger les données en mode édition
  useEffect(() => {
    if (mode === "edit" && badgeId && !initialData) {
      const loadBadge = async () => {
        try {
          const result = await getBadgeAction(badgeId);
          if (result.success) {
            const badge = result.data;
            form.reset({
              ...form.getValues(), // Preserve existing values
              ...(badge?.id ? { id: badge.id } : {}),
              title: badge?.title ?? "",
              description: badge?.description ?? "",
              category: badge?.category ?? BadgeCategory.ACHIEVEMENT,
              rarity: badge?.rarity ?? BadgeRarity.COMMON,
              color:
                RARITY_COLORS[badge?.rarity as keyof typeof RARITY_COLORS] ||
                RARITY_COLORS[badge?.rarity as keyof typeof RARITY_COLORS],
              iconUrl: "",
              isActive: badge?.isActive,
            });
          } else {
            toast.error(result.error || "Erreur lors du chargement");
            router.push("/dashboard/admin/badges");
          }
        } catch {
          toast.error("Erreur lors du chargement du badge");
          router.push("/dashboard/admin/badges");
        }
        setLoading(false);
      };

      loadBadge();
    }
  }, [mode, badgeId, initialData, form, router]);

  // Synchroniser la couleur avec la rareté
  const rarity = form.watch("rarity");
  useEffect(() => {
    if (rarity) {
      form.setValue("color", RARITY_COLORS[rarity]);
    }
  }, [rarity, form]);

  // Aperçu du badge
  const previewData = form.watch();
  const renderBadgePreview = () => {
    const iconUrl = previewData.iconUrl;
    const isUrl =
      iconUrl &&
      (iconUrl.startsWith("http://") ||
        iconUrl.startsWith("https://") ||
        iconUrl.startsWith("/"));

    return (
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
        <div
          className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
          style={{
            borderColor: previewData.color || RARITY_COLORS.COMMON,
            backgroundColor: `${previewData.color || RARITY_COLORS.COMMON}20`,
          }}
        >
          {iconUrl ? (
            isUrl ? (
              <Image src={iconUrl} alt="" className="w-8 h-8 object-contain" />
            ) : (
              <span className="text-xl">{iconUrl}</span>
            )
          ) : (
            <span className="text-xl">🏆</span>
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold">
            {previewData.title || "Titre du badge"}
          </div>
          <div className="text-sm text-muted-foreground">
            {previewData.description || "Description du badge"}
          </div>
          <div className="flex gap-2 mt-1">
            <Badge
              variant="outline"
              style={{ borderColor: previewData.color || RARITY_COLORS.COMMON }}
            >
              {RARITY_LABELS[previewData.rarity] || "Commun"}
            </Badge>
            <Badge variant="outline">
              {CATEGORY_LABELS[
                previewData.category as keyof typeof CATEGORY_LABELS
              ] || "Accomplissement"}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  const onSubmit = async (data: CreateBadgeInput | UpdateBadgeInput) => {
    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await createBadgeAction(data as CreateBadgeInput)
            : await updateBadgeAction(data as UpdateBadgeInput);

        if (result.success) {
          toast.success(
            `Badge ${mode === "create" ? "créé" : "mis à jour"} avec succès`
          );
          router.push("/dashboard/admin/badges");
          router.refresh();
        } else {
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              form.setError(
                field as Exclude<keyof CreateBadgeInput | keyof UpdateBadgeInput, "id">,
                {
                  message: messages.join(", "),
                }
              );
            });
          } else {
            toast.error(result.error || "Une erreur est survenue");
          }
        }
      } catch {
        toast.error("Une erreur est survenue");
      }
    });
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Aperçu */}
      <div>
        <Label className="text-base font-medium">Aperçu</Label>
        <div className="mt-2">{renderBadgePreview()}</div>
      </div>

      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations générales</h3>

                {/* Titre */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du badge..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description du badge..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Icône */}
                <FormField
                  control={form.control}
                  name="iconUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icône</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="🏆 ou URL d'image..."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Utilisez un emoji (🏆, 📝, ⭐) ou une URL d&apos;image
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuration</h3>

                {/* Catégorie */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rareté */}
                <FormField
                  control={form.control}
                  name="rarity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rareté *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une rareté" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(RARITY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full border"
                                  style={{
                                    backgroundColor:
                                      RARITY_COLORS[
                                        key as keyof typeof RARITY_COLORS
                                      ],
                                  }}
                                />
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Couleur personnalisée */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Couleur personnalisée</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="#FFFFFF"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <Popover
                          open={colorPickerOpen}
                          onOpenChange={setColorPickerOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" type="button">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{
                                  backgroundColor: field.value || "#000000",
                                }}
                              />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3">
                            <HexColorPicker
                              color={field.value || "#000000"}
                              onChange={field.onChange}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Laissez vide pour utiliser la couleur par défaut de la
                        rareté
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Statut actif */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Badge actif</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Les badges inactifs ne peuvent pas être attribués
                          automatiquement
                        </div>
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

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>Enregistrement...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {mode === "create" ? "Créer le badge" : "Mettre à jour"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </FormProvider>
    </div>
  );
}
