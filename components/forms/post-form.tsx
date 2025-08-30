"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  FileText,
  Folder,
  Globe,
  Image as ImageIcon,
  MapPin,
  Save,
  Settings,
  Tag as TagIcon,
  X,
  Loader2} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  FormProvider,
  Resolver,
  useForm,
  useFormContext,
  type FieldValues,
} from "react-hook-form";
import { toast } from "sonner";
import { useBadgeCelebration } from "@/hooks/use-badge-celebration";
import {
  createPostAction,
  getCategoriesAction,
  getTagsAction,
  updatePostAction,
} from "@/actions/post";
import { getUserPlacesAction, getAllPlacesAction } from "@/actions/place-select";
import { TipTapEditor } from "@/components/editors/tiptap-editor";
import { usePermissions } from "@/hooks/use-permissions";
import { ImageUpload } from "@/components/media/image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PostStatus } from "@/lib/generated/prisma";
import {
  type CreatePostInput,
  createPostSchema,
  generateSlug,
  type UpdatePostInput,
  updatePostSchema,
} from "@/lib/validations/post";
import { CreateCategoryDialog } from "./create-category-dialog";
import { CreateTagsDialog } from "./create-tags-dialog";

// Types pour les données
interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface Place {
  id: string;
  name: string;
  slug: string;
  type: string;
  city?: string;
}

interface PostFormProps {
  initialData?: {
    id?: string;
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    published?: boolean;
    categoryId?: string;
    placeId?: string;
    tags?: { tag: { id: string } }[];
    coverImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    status?: PostStatus;
  }; // Post existant pour l'édition
  mode: "create" | "edit";
}

// Composant pour la sélection des tags
function TagSelector({ refreshTrigger }: { refreshTrigger?: number }) {
  const form = useFormContext();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les tags disponibles
  const loadTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTagsAction();
      if (result.success && result.data) {
        setTags(
          result.data.map((tag) => ({ ...tag, color: tag.color ?? undefined }))
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des tags:", error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Pas de dépendances car getTagsAction est stable

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Recharger les tags quand refreshTrigger change (après création de nouveaux tags)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadTags();
    }
  }, [refreshTrigger, loadTags]);

  // Initialiser les tags sélectionnés
  useEffect(() => {
    const tagIds = form.getValues("tagIds") || [];
    setSelectedTags(tagIds);
  }, [form]);

  const toggleTag = (tagId: string) => {
    const newSelection = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];

    setSelectedTags(newSelection);
    form.setValue("tagIds", newSelection);
  };

  const removeTag = (tagId: string) => {
    const newSelection = selectedTags.filter((id) => id !== tagId);
    setSelectedTags(newSelection);
    form.setValue("tagIds", newSelection);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">
          Chargement des tags...
        </span>
      </div>
    );
  }

  const selectedTagsData = tags.filter((tag) => selectedTags.includes(tag.id));

  return (
    <div className="space-y-4">
      {/* Tags sélectionnés */}
      {selectedTagsData.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTagsData.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeTag(tag.id)}
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Sélecteur de tags */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
        {tags.map((tag) => (
          <Button
            key={tag.id}
            variant={selectedTags.includes(tag.id) ? "default" : "outline"}
            size="sm"
            className="justify-start text-xs"
            onClick={() => toggleTag(tag.id)}
            type="button"
          >
            <TagIcon className="h-3 w-3 mr-1" />
            {tag.name}
          </Button>
        ))}
      </div>

      {tags.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun tag disponible
        </p>
      )}
    </div>
  );
}

// Composant principal du formulaire
export function PostForm({ initialData, mode }: PostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [previewSlug, setPreviewSlug] = useState("");
  const [tagRefreshTrigger, setTagRefreshTrigger] = useState(0);
  const { showBadge } = useBadgeCelebration();
  const { isAdmin } = usePermissions();

  // Configuration du formulaire selon le mode
  type PostFormValues = {
    id?: string; // Add id as optional for compatibility with edit mode
    title: string;
    slug: string;
    content?: string | null;
    excerpt?: string | null;
    published?: boolean;
    categoryId?: string | null;
    placeId?: string | null;
    tagIds: string[];
    coverImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    status: PostStatus;
  };

  const form = useForm<PostFormValues>({
    resolver:
      mode === "create"
        ? (zodResolver(createPostSchema) as Resolver<PostFormValues>)
        : (zodResolver(updatePostSchema) as Resolver<PostFormValues>),
    defaultValues:
      mode === "create"
        ? {
            title: "",
            slug: "",
            content: "",
            excerpt: "",
            published: false,
            categoryId: "none",
            placeId: "none",
            tagIds: [],
            metaTitle: "",
            metaDescription: "",
            ogImage: "",
            canonicalUrl: "",
            status: PostStatus.DRAFT,
          }
        : {
            id: initialData?.id,
            title: initialData?.title || "",
            slug: initialData?.slug || "",
            content: initialData?.content || "",
            excerpt: initialData?.excerpt || "",
            published: initialData?.published || false,
            categoryId: initialData?.categoryId || "none",
            placeId: initialData?.placeId || "none",
            tagIds:
              initialData?.tags?.map(
                (t: { tag: { id: string } }) => t.tag.id
              ) || [],
            coverImage: initialData?.coverImage || "",
            metaTitle: initialData?.metaTitle || "",
            metaDescription: initialData?.metaDescription || "",
            ogImage: initialData?.ogImage || "",
            canonicalUrl: initialData?.canonicalUrl || "",
            status: initialData?.status || PostStatus.DRAFT,
          },
  });

  // Charger les catégories
  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await getCategoriesAction();
        if (result.success && result.data) {
          setCategories(
            result.data.map((category) => ({
              ...category,
              color: category.color ?? undefined,
            }))
          );
        }
      } catch (error) {
        console.error("Erreur lors du chargement des catégories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  // Charger les lieux selon le rôle utilisateur
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        let result;
        if (isAdmin) {
          // Admins voient tous les lieux
          result = await getAllPlacesAction();
        } else {
          // Utilisateurs voient seulement leurs lieux
          result = await getUserPlacesAction();
        }
        
        if (result.success && result.data) {
          setPlaces(result.data);
        } else {
          console.error("Erreur lors du chargement des lieux:", result.error);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des lieux:", error);
      } finally {
        setIsLoadingPlaces(false);
      }
    };

    loadPlaces();
  }, [isAdmin]);

  // Générer automatiquement le slug à partir du titre
  const watchTitle = form.watch("title");
  useEffect(() => {
    if (watchTitle && mode === "create") {
      const newSlug = generateSlug(watchTitle);
      setPreviewSlug(newSlug);

      // Mettre à jour le slug seulement si l'utilisateur n'a pas manually modifié
      const currentSlug = form.getValues("slug");
      if (
        !currentSlug ||
        currentSlug === generateSlug(watchTitle.slice(0, -1))
      ) {
        form.setValue("slug", newSlug);
      }
    }
  }, [watchTitle, form, mode]);

  // Soumettre le formulaire
  const onSubmit = async (data: FieldValues) => {
    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await createPostAction(data as CreatePostInput)
            : await updatePostAction(data as UpdatePostInput);

        if (result.success) {
          toast.success(
            `Article ${mode === "create" ? "créé" : "mis à jour"} avec succès`
          );

          // Afficher les badges nouvellement obtenus
          if (mode === "create" && result.data) {
            const createData = result.data as {
              slug: string;
              newBadges?: Array<{
                badge: {
                  title: string;
                  description: string;
                  iconUrl?: string | null;
                  color?: string | null;
                  rarity: string;
                };
                reason: string;
              }>;
            };
            if (createData.newBadges && createData.newBadges.length > 0) {
              setTimeout(() => {
                createData.newBadges!.forEach((badgeData) => {
                  showBadge(badgeData.badge as import("@/types/membership").BadgeCelebration, badgeData.reason);
                });
              }, 1000);
            }
          }

          router.push("/dashboard/posts");
          router.refresh();
        } else {
          if (result.errors) {
            // Afficher les erreurs de validation
            Object.entries(result.errors).forEach(([field, messages]) => {
              form.setError(field as keyof PostFormValues, {
                message: messages.join(", "),
              });
            });
          } else {
            toast.error(result.error || "Une erreur est survenue");
          }
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Une erreur inattendue est survenue");
      }
    });
  };

  const handleSaveAsDraft = () => {
    form.setValue("published", false);
    form.setValue("status", PostStatus.DRAFT);
    form.handleSubmit(onSubmit)();
  };

  const handlePublish = () => {
    form.setValue("published", true);
    form.setValue("status", PostStatus.PUBLISHED);
    form.handleSubmit(onSubmit)();
  };

  const handlePreview = () => {
    const slug = form.getValues("slug");
    if (slug) {
      window.open(`/posts/${slug}?preview=true`, "_blank");
    }
  };

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informations générales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Titre */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Titre de votre article..."
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
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              placeholder="slug-de-votre-article"
                              {...field}
                            />
                            {previewSlug && mode === "create" && (
                              <p className="text-sm text-muted-foreground">
                                Aperçu:{" "}
                                <code className="bg-muted px-1 rounded">
                                  {previewSlug}
                                </code>
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Extrait */}
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Extrait</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Résumé de votre article (affiché dans les listes)..."
                            className="min-h-[80px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Image de couverture */}
                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Image de couverture
                        </FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ""}
                            onChange={field.onChange}
                            onRemove={() => field.onChange("")}
                            type="posts"
                            slug={form.getValues("slug") || "general"}
                            aspectRatios={[
                              {
                                label: "Réseaux sociaux 1.91:1 (optimal)",
                                value: 1.91,
                              },
                              { label: "Paysage 16:9", value: 16 / 9 },
                              { label: "Paysage 4:3", value: 4 / 3 },
                              { label: "Carré 1:1", value: 1 },
                            ]}
                            className="max-w-md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contenu */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contenu</FormLabel>
                        <FormControl>
                          <TipTapEditor
                            content={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Rédigez le contenu de votre article..."
                            className="min-h-[400px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* SEO */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Référencement (SEO)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre SEO</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Titre optimisé pour les moteurs de recherche..."
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
                    name="metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description SEO</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description optimisée pour les moteurs de recherche..."
                            className="min-h-[80px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ogImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image OG (optionnel)</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://example.com/image.jpg (laisser vide si aucune)"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Image affichée lors du partage sur les réseaux
                            sociaux
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canonicalUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL canonique (optionnel)</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://example.com/article (laisser vide si aucune)"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            URL de référence pour éviter le contenu dupliqué
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveAsDraft}
                      disabled={isPending}
                      className="w-full"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Enregistrer comme brouillon
                    </Button>

                    <Button
                      type="button"
                      onClick={handlePublish}
                      disabled={isPending}
                      className="w-full"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Globe className="h-4 w-4 mr-2" />
                      )}
                      Publier
                    </Button>

                    {mode === "edit" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreview}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Aperçu
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Statut de publication */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="published">Publié</Label>
                    <FormField
                      control={form.control}
                      name="published"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              id="published"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Catégorie */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Folder className="h-5 w-5" />
                      Catégorie
                    </CardTitle>
                    <CreateCategoryDialog
                      onCategoryCreated={(newCategory) => {
                        setCategories((prev) => [
                          ...prev,
                          newCategory as Category,
                        ]);
                        form.setValue("categoryId", newCategory.id);
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            value={field.value || "none"}
                            onValueChange={field.onChange}
                            disabled={isLoadingCategories}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                Aucune catégorie
                              </SelectItem>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor: category.color,
                                      }}
                                    />
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Sélecteur de lieu */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Lieu associé
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin 
                      ? "Associer cet article à un établissement (optionnel)"
                      : "Associer cet article à un de vos établissements"}
                  </p>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="placeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            value={field.value || "none"}
                            onValueChange={field.onChange}
                            disabled={isLoadingPlaces}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un lieu" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                {isAdmin 
                                  ? "Article de l'association (non lié à un lieu)"
                                  : "Article général (non lié à un lieu)"}
                              </SelectItem>
                              {places.map((place) => (
                                <SelectItem
                                  key={place.id}
                                  value={place.id}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    {place.name} ({place.type})
                                    {place.city && isAdmin && (
                                      <span className="text-xs text-muted-foreground">
                                        - {place.city}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                        {places.length === 0 && !isLoadingPlaces && (
                          <p className="text-sm text-muted-foreground">
                            {isAdmin 
                              ? "Aucun lieu disponible dans le système."
                              : "Vous n'avez aucun lieu enregistré. Les articles sans lieu associé seront considérés comme des articles généraux."}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TagIcon className="h-5 w-5" />
                      Tags
                    </CardTitle>
                    <CreateTagsDialog
                      onTagsCreated={(newTagIds) => {
                        // Déclencher le refresh du TagSelector
                        setTagRefreshTrigger((prev) => prev + 1);
                        // Optionnel : sélectionner automatiquement les nouveaux tags créés
                        const currentTagIds = form.getValues("tagIds") || [];
                        const uniqueTagIds = [
                          ...new Set([...currentTagIds, ...newTagIds]),
                        ];
                        form.setValue("tagIds", uniqueTagIds);
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <TagSelector refreshTrigger={tagRefreshTrigger} />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
