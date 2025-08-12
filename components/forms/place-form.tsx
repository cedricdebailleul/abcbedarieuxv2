"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  FileText,
  Globe,
  ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Settings,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUpload } from "@/components/media/image-upload";
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
import { type FormattedPlaceData, useGooglePlaces } from "@/hooks/use-google-places";
import { generateSlug } from "@/lib/validations/post";

// --- Schéma Zod (conserve ton modèle) ---
const placeSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  category: z.string().optional(),
  description: z.string().optional(),
  summary: z.string().max(280).optional(),
  openingHours: z.array(z.any()).optional(),

  street: z.string().min(1, "La rue est requise"),
  streetNumber: z.string().optional(),
  postalCode: z.string().min(1, "Le code postal est requis"),
  city: z.string().min(1, "La ville est requise"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  logo: z.string().optional(),
  coverImage: z.string().optional(),
  photos: z.array(z.string()).optional(),

  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),

  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  tiktok: z.string().optional(),

  googlePlaceId: z.string().optional(),
  googleMapsUrl: z.string().optional(),

  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),

  // Optionnel : statut publication si tu veux calquer PostForm
  published: z.boolean().optional(),
});
type PlaceFormData = z.infer<typeof placeSchema> & {
  openingHours?: any[];
};

type PlaceFormProps = {
  initialData?: Partial<PlaceFormData & { images?: string[] }>;
  onSubmit: (
    data: PlaceFormData & {
      openingHours?: any[];
      images?: string[];
      createForClaim?: boolean;
    }
  ) => Promise<void>;
  mode?: "create" | "edit";
  userRole?: string; // Pour déterminer les options disponibles
};

// Liste typée pour Select "type"
const PLACE_TYPES = [
  { value: "COMMERCE", label: "Commerce" },
  { value: "SERVICE", label: "Service" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "ARTISAN", label: "Artisan" },
  { value: "ADMINISTRATION", label: "Administration" },
  { value: "MUSEUM", label: "Musée" },
  { value: "TOURISM", label: "Tourisme" },
  { value: "PARK", label: "Parc" },
  { value: "LEISURE", label: "Loisirs" },
  { value: "ASSOCIATION", label: "Association" },
  { value: "HEALTH", label: "Santé" },
  { value: "EDUCATION", label: "Éducation" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "ACCOMMODATION", label: "Hébergement" },
  { value: "OTHER", label: "Autre" },
];

export function PlaceForm({ initialData, onSubmit, mode = "create", userRole }: PlaceFormProps) {
  const [isPending, startTransition] = useTransition();
  const [openingHours, setOpeningHours] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [showGoogleSearch, setShowGoogleSearch] = useState(mode === "create");
  const [showDropdown, setShowDropdown] = useState(false);
  const [createForClaim, setCreateForClaim] = useState(false);
  // Générer un slug temporaire unique pour les nouvelles places
  const [tempSlug] = useState(() =>
    mode === "create" ? `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : ""
  );

  // Initialiser les images existantes en mode édition
  useEffect(() => {
    if (mode === "edit" && Array.isArray(initialData?.images)) {
      const existingImages = Array.isArray(initialData.images) ? initialData.images : [];
      setImages(existingImages);
    }
    if (mode === "edit" && initialData?.openingHours) {
      setOpeningHours(initialData.openingHours);
    }
  }, [mode, initialData]);

  const form = useForm<PlaceFormData>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      name: "",
      type: "",
      category: "",
      description: "",
      summary: "",
      street: "",
      streetNumber: "",
      postalCode: "",
      city: "",
      latitude: undefined,
      longitude: undefined,
      logo: "",
      coverImage: "",
      photos: [],
      email: "",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      tiktok: "",
      googlePlaceId: "",
      googleMapsUrl: "",
      metaTitle: "",
      metaDescription: "",
      published: false,
      ...initialData,
    },
  });

  // Google Places hook
  const {
    isLoaded,
    isSearching,
    predictions,
    inputValue,
    searchPlaces,
    getPlaceDetails,
    setInputValue,
    clearPredictions,
  } = useGooglePlaces({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    onPlaceSelected: (place: FormattedPlaceData) => {
      fillFormWithGoogleData(place);
    },
  });

  // Debounce recherche Google
  useEffect(() => {
    if (!showGoogleSearch) return;
    const t = setTimeout(() => {
      if (inputValue && inputValue.length >= 3) {
        searchPlaces(inputValue);
        setShowDropdown(true);
      } else {
        clearPredictions();
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [inputValue, searchPlaces, clearPredictions, showGoogleSearch]);

  // Upload d'une image Google individuelle
  const uploadGoogleImage = async (
    imageUrl: string,
    imageType: "logo" | "cover"
  ): Promise<string | null> => {
    try {
      const response = await fetch("/api/upload-google-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: [imageUrl],
          slug: uploadSlug,
          type: "places",
          imageType,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload");
      }

      const result = await response.json();
      return result.uploadedImages?.[0] || null;
    } catch (error) {
      console.error(`Erreur upload ${imageType}:`, error);
      return null;
    }
  };

  // Import Google → remplir form
  const fillFormWithGoogleData = async (place: FormattedPlaceData) => {
    // Base
    form.setValue("name", place.name ?? "");
    form.setValue("type", place.type ?? "");
    form.setValue("category", place.category ?? "");

    // Adresse
    form.setValue("street", place.street ?? "");
    form.setValue("streetNumber", place.streetNumber ?? "");
    form.setValue("postalCode", place.postalCode ?? "");
    form.setValue("city", place.city ?? "");
    form.setValue("latitude", place.latitude);
    form.setValue("longitude", place.longitude);

    // Media - uploader seulement le logo automatiquement
    if (place.logo?.startsWith("http")) {
      const uploadedLogo = await uploadGoogleImage(place.logo, "logo");
      form.setValue("logo", uploadedLogo || place.logo);
    } else {
      form.setValue("logo", place.logo ?? "");
    }

    // Ne pas importer l'image de couverture automatiquement - laisser l'utilisateur la choisir
    form.setValue("coverImage", "");

    setImages(place.photos ?? []);

    // Contact
    form.setValue("phone", place.phone ?? "");
    form.setValue("website", place.website ?? "");

    // Google
    form.setValue("googlePlaceId", place.googlePlaceId ?? "");
    form.setValue("googleMapsUrl", place.googleMapsUrl ?? "");

    // SEO
    form.setValue("metaDescription", place.metaDescription ?? "");

    // Horaires
    setOpeningHours(place.openingHours ?? []);

    setShowGoogleSearch(false);
    toast.success("Les informations ont été importées depuis Google");
  };

  // util pour trier HH:MM
  function timeToMin(t: string) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  // Dans ton composant (au lieu de .map() direct sur openingHours)
  const grouped = (openingHours ?? []).reduce((acc: Record<string, any[]>, oh: any) => {
    const day = String(oh.dayOfWeek).toUpperCase();
    acc[day] ||= [];
    // format "slots" (si jamais tu as déjà agrégé)
    if (Array.isArray(oh.slots) && oh.slots.length) {
      for (const s of oh.slots) acc[day].push({ ...oh, ...s, isClosed: false });
    } else {
      acc[day].push(oh);
    }
    return acc;
  }, {});

  // Sélection d'une prédiction
  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    setInputValue(prediction.description);
    getPlaceDetails(prediction.place_id);
    setShowDropdown(false);
    clearPredictions();
  };

  // Soumission
  const onSubmitForm = (data: PlaceFormData) => {
    startTransition(async () => {
      try {
        await onSubmit({
          ...data,
          photos: (data.photos || []).filter(Boolean),
          openingHours,
          images,
          createForClaim: userRole === "admin" ? createForClaim : undefined,
        });
        toast.success(
          mode === "create" ? "Établissement créé avec succès" : "Établissement mis à jour"
        );
        if (mode === "create") {
          form.reset();
          setOpeningHours([]);
          setImages([]);
          setShowGoogleSearch(true);
          setInputValue("");
        }
      } catch (e) {
        console.error(e);
        toast.error("Une erreur est survenue");
      }
    });
  };

  const name = form.watch("name");
  const _coverImage = form.watch("coverImage");
  const _logo = form.watch("logo");
  const metaTitle = form.watch("metaTitle") ?? "";
  const metaDescription = form.watch("metaDescription") ?? "";
  const lat = form.watch("latitude");
  const lng = form.watch("longitude");
  const googlePlaceId = form.watch("googlePlaceId");
  const googleMapsUrl = form.watch("googleMapsUrl");

  const computedSlug = useMemo(() => generateSlug(name || ""), [name]);
  // Utiliser le slug temporaire pour les nouvelles places, le slug computed pour l'édition
  const uploadSlug = mode === "create" ? tempSlug : computedSlug || "general";

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Import Google */}
              {showGoogleSearch && isLoaded && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Importer depuis Google Business
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Rechercher par nom ou adresse…"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      )}

                      {showDropdown && predictions.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow">
                          {predictions.map((p) => (
                            <Button
                              key={p.place_id}
                              type="button"
                              variant="ghost"
                              className="w-full justify-start gap-2"
                              onClick={() => handleSelectPrediction(p)}
                            >
                              <MapPin className="h-4 w-4" />
                              <div className="text-left">
                                <div className="text-sm font-medium">
                                  {p.structured_formatting.main_text}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {p.structured_formatting.secondary_text}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Tapez au moins 3 caractères pour lancer la recherche
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowGoogleSearch(false)}
                      >
                        Remplir manuellement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Informations générales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informations générales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l’établissement *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom commercial…" {...field} />
                        </FormControl>
                        <FormMessage />
                        {name && (
                          <p className="text-xs text-muted-foreground">
                            Slug prévisionnel :{" "}
                            <code className="bg-muted px-1 rounded">{computedSlug}</code>
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner…" />
                              </SelectTrigger>
                              <SelectContent>
                                {PLACE_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                          <FormLabel>Catégorie (optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex : Boulangerie, Assurance…" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez votre établissement…"
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Adresse */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Adresse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="streetNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>N°</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>Rue *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code postal *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ville *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {(lat || lng) && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground">Latitude</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="bg-muted" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground">Longitude</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="bg-muted" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site web</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Réseaux sociaux */}
              <Card>
                <CardHeader>
                  <CardTitle>Réseaux sociaux</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["facebook", "instagram", "twitter", "linkedin", "tiktok"] as const).map(
                    (fieldName) => (
                      <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="capitalize">{fieldName}</FormLabel>
                            <FormControl>
                              <Input placeholder="URL ou @handle" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )
                  )}
                </CardContent>
              </Card>

              {/* Média */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Média
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image de couverture</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ""}
                            onChange={field.onChange}
                            onRemove={() => field.onChange("")}
                            type="places"
                            slug={uploadSlug}
                            imageType="cover"
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
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image du logo</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ""}
                            onChange={field.onChange}
                            onRemove={() => field.onChange("")}
                            type="places"
                            slug={uploadSlug}
                            imageType="logo"
                            aspectRatios={[
                              { label: "Carré 1:1 (recommandé)", value: 1 },
                              { label: "Paysage 4:3", value: 4 / 3 },
                              { label: "Paysage 16:9", value: 16 / 9 },
                            ]}
                            className="max-w-md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Galerie d'images */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Galerie d'images</h4>
                      <span className="text-sm text-muted-foreground">
                        {images.length} image{images.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Uploader des images Google vers la galerie */}
                    {images.some((img) => img.startsWith("http")) && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium text-muted-foreground">
                            Images de Google à uploader
                          </h5>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const googleImages = images.filter((img) => img.startsWith("http"));
                              if (googleImages.length === 0) return;

                              startTransition(async () => {
                                try {
                                  const response = await fetch("/api/upload-google-images", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      images: googleImages,
                                      slug: uploadSlug,
                                      type: "places",
                                    }),
                                  });

                                  if (!response.ok) {
                                    throw new Error("Erreur lors de l'upload");
                                  }

                                  const result = await response.json();

                                  // Remplacer les liens Google par les URLs uploadées
                                  setImages((prev) => [
                                    ...prev.filter((img) => !img.startsWith("http")),
                                    ...result.uploadedImages,
                                  ]);

                                  toast.success(
                                    `${result.uploadedCount}/${result.totalCount} images uploadées vers la galerie`
                                  );

                                  if (result.errors.length > 0) {
                                    console.warn("Erreurs upload:", result.errors);
                                  }
                                } catch (error) {
                                  console.error("Erreur upload Google images:", error);
                                  toast.error("Erreur lors de l'upload des images Google");
                                }
                              });
                            }}
                          >
                            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Uploader toutes les images Google
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Upload d'images pour la galerie */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">
                        Ajouter une image à la galerie
                      </h5>
                      <ImageUpload
                        value=""
                        onChange={(url) => setImages((prev) => [...prev, url])}
                        type="places"
                        slug={uploadSlug}
                        subFolder="gallery"
                        imageType="gallery"
                        showPreview={false}
                        aspectRatios={[
                          { label: "Paysage 16:9", value: 16 / 9 },
                          { label: "Paysage 4:3", value: 4 / 3 },
                          { label: "Carré 1:1", value: 1 },
                          { label: "Portrait 3:4", value: 3 / 4 },
                        ]}
                        className="max-w-md"
                      />
                    </div>

                    {/* Aperçu des images */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((src, i) => (
                          <div key={i} className="relative aspect-square">
                            <img
                              src={src}
                              alt={`Photo ${i + 1}`}
                              className="h-full w-full rounded-lg object-cover border"
                            />
                            {/* Indicateur du type d'image */}
                            <div className="absolute left-2 top-2">
                              <span
                                className={`px-1.5 py-0.5 text-xs rounded-full text-white font-medium ${
                                  src.startsWith("/uploads/") ? "bg-green-500" : "bg-orange-500"
                                }`}
                              >
                                {src.startsWith("/uploads/") ? "Uploadé" : "Google"}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute right-2 top-2 h-6 w-6"
                              disabled={isPending}
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const imageUrl = src;

                                // Si c'est une image uploadée, la supprimer physiquement
                                if (imageUrl.startsWith("/uploads/")) {
                                  try {
                                    const response = await fetch(
                                      `/api/upload?path=${encodeURIComponent(imageUrl)}`,
                                      {
                                        method: "DELETE",
                                      }
                                    );

                                    if (!response.ok) {
                                      toast.error("Erreur lors de la suppression du fichier");
                                      return;
                                    }
                                  } catch (error) {
                                    console.error("Erreur suppression fichier:", error);
                                    toast.error("Erreur lors de la suppression du fichier");
                                    return;
                                  }
                                }

                                // Retirer de l'état local
                                setImages((prev) => prev.filter((_, idx) => idx !== i));
                                toast.success("Image supprimée");
                              }}
                            >
                              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "×"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                        <FormLabel>
                          Titre SEO{" "}
                          <span className="text-xs text-muted-foreground">
                            ({metaTitle.length}/60)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Titre optimisé…" maxLength={60} {...field} />
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
                        <FormLabel>
                          Description SEO{" "}
                          <span className="text-xs text-muted-foreground">
                            ({metaDescription.length}/160)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description pour moteurs et réseaux sociaux…"
                            className="min-h-[80px]"
                            maxLength={160}
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
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Résumé pour partage{" "}
                          <span className="text-xs text-muted-foreground">
                            ({field.value?.length ?? 0}/280)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Résumé court pour réseaux (X, Facebook, etc.)"
                            className="min-h-[70px]"
                            maxLength={280}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Horaires (si disponibles) */}
              {openingHours.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Horaires d’ouverture</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2">
                      {[
                        "MONDAY",
                        "TUESDAY",
                        "WEDNESDAY",
                        "THURSDAY",
                        "FRIDAY",
                        "SATURDAY",
                        "SUNDAY",
                      ].map((DAY) => {
                        const slots = (grouped[DAY] || [])
                          .filter((s) => !s.isClosed)
                          .sort((a, b) => timeToMin(a.openTime) - timeToMin(b.openTime));

                        const isClosed = (grouped[DAY] || []).length === 0 || slots.length === 0;

                        return (
                          <div key={DAY} className="flex justify-between">
                            <span className="font-medium">
                              {DAY === "MONDAY"
                                ? "Lundi"
                                : DAY === "TUESDAY"
                                  ? "Mardi"
                                  : DAY === "WEDNESDAY"
                                    ? "Mercredi"
                                    : DAY === "THURSDAY"
                                      ? "Jeudi"
                                      : DAY === "FRIDAY"
                                        ? "Vendredi"
                                        : DAY === "SATURDAY"
                                          ? "Samedi"
                                          : "Dimanche"}
                            </span>

                            <span className="text-gray-600">
                              {isClosed
                                ? "Fermé"
                                : slots.map((s, i) => (
                                    <span key={`${DAY}-${s.openTime}-${s.closeTime}`}>
                                      {s.openTime} – {s.closeTime}
                                      {i < slots.length - 1 ? " • " : ""}
                                    </span>
                                  ))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Connexion Google */}
              {googlePlaceId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Connecté à Google Business</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-sm">ID : {googlePlaceId}</div>
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline"
                      >
                        Voir sur Google Maps →
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Button type="submit" disabled={isPending} className="w-full">
                      {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      {mode === "create" ? "Créer l’établissement" : "Mettre à jour"}
                    </Button>

                    {mode === "edit" && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowGoogleSearch(true)}
                          className="w-full"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Réimporter depuis Google
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            const placeId = (initialData as any)?.id;
                            console.log("🔍 Import avis - placeId:", placeId);

                            if (!placeId) {
                              toast.error("ID de place manquant");
                              return;
                            }

                            startTransition(async () => {
                              try {
                                console.log("📡 Appel API import avis...");
                                const response = await fetch(
                                  `/api/places/${placeId}/import-reviews`,
                                  {
                                    method: "POST",
                                  }
                                );

                                console.log(
                                  "📡 Réponse API:",
                                  response.status,
                                  response.statusText
                                );

                                if (!response.ok) {
                                  const errorData = await response.json();
                                  console.error("❌ Erreur API:", errorData);
                                  throw new Error(errorData.error || "Erreur lors de l'import");
                                }

                                const result = await response.json();
                                console.log("✅ Résultat import:", result);
                                toast.success(result.message);

                                if (result.errors && result.errors.length > 0) {
                                  console.warn("⚠️ Erreurs import:", result.errors);
                                }
                              } catch (error) {
                                console.error("❌ Erreur import avis:", error);
                                toast.error(
                                  "Erreur lors de l'import des avis: " +
                                    (error instanceof Error ? error.message : "Erreur inconnue")
                                );
                              }
                            });
                          }}
                          className="w-full"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Importer les avis Google
                        </Button>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Option admin : créer pour revendication */}
                  {userRole === "admin" && mode === "create" && (
                    <>
                      <div className="flex items-center justify-between">
                        <FormLabel htmlFor="createForClaim">Créer pour revendication</FormLabel>
                        <Switch
                          id="createForClaim"
                          checked={createForClaim}
                          onCheckedChange={setCreateForClaim}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        La fiche ne vous sera pas attribuée et pourra être revendiquée par un
                        utilisateur
                      </p>
                      <Separator />
                    </>
                  )}

                  <div className="flex items-center justify-between">
                    <FormLabel htmlFor="published">Publié</FormLabel>
                    <FormField
                      control={form.control}
                      name="published"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              id="published"
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => history.back()}
                      className="w-full"
                    >
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
