"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HexColorPicker } from "react-colorful";
import { Save, Hash, FolderOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";

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
import { Separator } from "@/components/ui/separator";

import {
  createPlaceCategoryAction,
  updatePlaceCategoryAction,
  getPlaceCategoryAction,
  getPlaceCategoriesAction,
} from "@/actions/place-category";
import {
  createPlaceCategorySchema,
  updatePlaceCategorySchema,
  generateSlug,
  PREDEFINED_COLORS,
  PREDEFINED_ICONS,
  type CreatePlaceCategoryInput,
  type UpdatePlaceCategoryInput,
} from "@/lib/validations/place-category";
import { cn } from "@/lib/utils";
import z from "zod";

interface PlaceCategoryFormProps {
  mode: "create" | "edit";
  categoryId?: string;
  initialData?: Partial<CreatePlaceCategoryInput & UpdatePlaceCategoryInput>;
}

export function PlaceCategoryForm({
  mode,
  categoryId,
  initialData,
}: PlaceCategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [loading, setLoading] = useState(mode === "edit" && !initialData);

  type ParentCategory = {
    id: string;
    name: string;
    // parent can be either a nested object returned by the API, or just an id string, or null
    parent?: { id: string; name: string; slug?: string } | string | null;
    parentId?: string | null;
    [key: string]: unknown;
  };

  const [parentCategories, setParentCategories] = useState<ParentCategory[]>(
    []
  );

  const schema =
    mode === "create"
      ? createPlaceCategorySchema.extend({
          id: z.string().optional(),
          isActive: z.boolean(),
          sortOrder: z.number(),
        })
      : updatePlaceCategorySchema.extend({
          id: z.string(),
          isActive: z.boolean(),
          sortOrder: z.number(),
        });

  const form = useForm<CreatePlaceCategoryInput | UpdatePlaceCategoryInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: mode === "edit" && categoryId ? categoryId : "",
      name: "",
      slug: "",
      description: "",
      icon: "",
      color: "#6B7280",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
      isActive: true,
      sortOrder: 0,
      parentId: null,
      ...initialData,
    },
  });

  // Charger les catégories parent disponibles
  useEffect(() => {
    const loadParentCategories = async () => {
      try {
        const result = await getPlaceCategoriesAction({
          page: 1,
          limit: 100,
          sortBy: "name",
          sortOrder: "asc",
        });

        if (result.success) {
          // Ne garder que les catégories principales (sans parent) pour le sélecteur
          let filtered = result.data!.categories.filter(
            (cat) => cat.parent === null
          );

          // Exclure la catégorie actuelle si on est en mode édition
          if (mode === "edit" && categoryId) {
            filtered = filtered.filter((cat) => cat.id !== categoryId);
          }

          setParentCategories(filtered);
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des catégories parent:",
          error
        );
      }
    };

    loadParentCategories();
  }, [mode, categoryId]);

  // Charger les données en mode édition
  useEffect(() => {
    if (mode === "edit" && categoryId && !initialData) {
      const loadCategory = async () => {
        try {
          const result = await getPlaceCategoryAction(categoryId);
          if (result.success && result.data) {
            const category = result.data;
            form.reset({
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: category.description || "",
              icon: category.icon || "",
              color: category.color || "#6B7280",
              bgColor: category.bgColor || "bg-gray-100",
              textColor: category.textColor || "text-gray-700",
              borderColor: category.borderColor || "border-gray-200",
              isActive: category.isActive,
              sortOrder: category.sortOrder,
              parentId: category.parentId || null,
            });
          } else {
            toast.error(result.error || "Erreur lors du chargement");
            router.push("/dashboard/admin/place-categories");
          }
        } catch {
          toast.error("Erreur lors du chargement de la catégorie");
          router.push("/dashboard/admin/place-categories");
        }
        setLoading(false);
      };

      loadCategory();
    }
  }, [mode, categoryId, initialData, form, router]);

  // Générer le slug automatiquement
  const watchedName = form.watch("name");
  useEffect(() => {
    if (watchedName && mode === "create") {
      const slug = generateSlug(watchedName);
      form.setValue("slug", slug);
    }
  }, [watchedName, mode, form]);

  // Aperçu de la catégorie
  const previewData = form.watch();

  const renderCategoryIcon = () => {
    const icon = previewData.icon;
    if (!icon) return <Hash className="w-8 h-8 text-muted-foreground" />;

    // Emoji
    if (
      icon.length <= 4 &&
      /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
        icon
      )
    ) {
      return <span className="text-2xl">{icon}</span>;
    }

    // Icône Lucide
    const IconComponent = (
      LucideIcons as unknown as Record<
        string,
        React.ComponentType<React.SVGProps<SVGSVGElement>>
      >
    )[icon];
    if (IconComponent) {
      return (
        <IconComponent
          className="w-8 h-8"
          color={previewData.color ?? undefined}
        />
      );
    }

    return <Hash className="w-8 h-8 text-muted-foreground" />;
  };

  const renderCategoryPreview = () => {
    const style = {
      backgroundColor: previewData.bgColor
        ? undefined
        : `${previewData.color}20`,
      color: previewData.textColor ? undefined : previewData.color || undefined,
      borderColor: previewData.borderColor
        ? undefined
        : previewData.color || undefined,
    };

    const className = cn(
      "flex items-center gap-3 p-4 border rounded-lg transition-all",
      previewData.bgColor,
      previewData.textColor,
      previewData.borderColor ? previewData.borderColor : "border"
    );

    return (
      <div className={className} style={style}>
        {renderCategoryIcon()}
        <div className="flex-1">
          <div className="font-semibold text-lg">
            {previewData.name || "Nom de la catégorie"}
          </div>
          <div className="text-sm opacity-80">
            {previewData.description || "Description de la catégorie"}
          </div>
          {previewData.parentId && (
            <div className="text-xs mt-1 opacity-60">
              Sous-catégorie de:{" "}
              {
                parentCategories.find((p) => p.id === previewData.parentId)
                  ?.name
              }
            </div>
          )}
        </div>
      </div>
    );
  };

  const onSubmit = async (
    data: CreatePlaceCategoryInput | UpdatePlaceCategoryInput
  ) => {
    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await createPlaceCategoryAction(data as CreatePlaceCategoryInput)
            : await updatePlaceCategoryAction(data as UpdatePlaceCategoryInput);

        if (result.success) {
          toast.success(
            `Catégorie ${
              mode === "create" ? "créée" : "mise à jour"
            } avec succès`
          );
          router.push("/dashboard/admin/place-categories");
          router.refresh();
        } else {
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              form.setError(field as keyof CreatePlaceCategoryInput | keyof UpdatePlaceCategoryInput, {
                message: messages.join(", "),
              });
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
        <div className="mt-2">{renderCategoryPreview()}</div>
      </div>

      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Informations générales
                </h3>

                {/* Nom */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la catégorie *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Restaurants, Commerces..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slug */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="restaurants, commerces..."
                          {...field}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        URL-friendly. Généré automatiquement depuis le nom.
                      </div>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description de cette catégorie..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Catégorie parent */}
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie parent (optionnel)</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? null : value)
                        }
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Aucune (catégorie racine)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            Aucune (catégorie racine)
                          </SelectItem>
                          {parentCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Apparence */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Apparence
                </h3>

                {/* Icône */}
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icône</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Store, Restaurant, 🏪..."
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <Popover
                          open={iconPickerOpen}
                          onOpenChange={setIconPickerOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" type="button">
                              {renderCategoryIcon()}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4">
                            <div className="space-y-4">
                              <h4 className="font-medium">
                                Icônes prédéfinies
                              </h4>
                              <div className="grid grid-cols-5 gap-2">
                                {PREDEFINED_ICONS.map(({ icon, name }) => {
                                  const IconComponent = (
                                    LucideIcons as unknown as Record<
                                      string,
                                      React.ComponentType<
                                        React.SVGProps<SVGSVGElement>
                                      >
                                    >
                                  )[icon];
                                  return (
                                    <Button
                                      key={icon}
                                      variant="outline"
                                      size="sm"
                                      className="h-10 p-2"
                                      onClick={() => {
                                        field.onChange(icon);
                                        setIconPickerOpen(false);
                                      }}
                                      type="button"
                                      title={name}
                                    >
                                      {IconComponent ? (
                                        <IconComponent className="w-4 h-4" />
                                      ) : (
                                        <span className="text-sm">{name}</span>
                                      )}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Nom d&apos;icône Lucide ou emoji
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Couleur */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Couleur</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="#6B7280"
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
                                style={{ backgroundColor: field.value || "" }}
                              />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">
                                  Couleurs prédéfinies
                                </h4>
                                <div className="grid grid-cols-5 gap-2">
                                  {PREDEFINED_COLORS.map((color) => (
                                    <Button
                                      key={color.hex}
                                      variant="outline"
                                      size="sm"
                                      className="h-10 p-1"
                                      onClick={() => {
                                        field.onChange(color.hex);
                                        form.setValue("bgColor", color.bg);
                                        form.setValue("textColor", color.text);
                                        form.setValue(
                                          "borderColor",
                                          color.border
                                        );
                                      }}
                                      type="button"
                                      title={color.name}
                                    >
                                      <div
                                        className="w-full h-full rounded"
                                        style={{ backgroundColor: color.hex }}
                                      />
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <Separator />
                              <div>
                                <h4 className="font-medium mb-2">
                                  Couleur personnalisée
                                </h4>
                                <HexColorPicker
                                  color={field.value ?? undefined}
                                  onChange={field.onChange}
                                />
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Configuration */}
                <Separator />

                {/* Ordre */}
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordre d&apos;affichage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number.parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Plus le nombre est petit, plus la catégorie apparaît en
                        premier
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
                        <FormLabel className="text-base">
                          Catégorie active
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Les catégories inactives ne sont pas affichées
                          publiquement
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
                    {mode === "create" ? "Créer la catégorie" : "Mettre à jour"}
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
