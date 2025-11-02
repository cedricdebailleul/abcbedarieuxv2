"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, X, Loader2, MapPin, Search } from "lucide-react";
import { ImageUpload } from "@/components/media/image-upload";
import {
  PartnerCreateSchema,
  PartnerFormData,
  PARTNER_TYPES,
  PARTNER_TYPE_LABELS,
  Partner,
  sanitizePartnerData
} from "@/lib/types/partners";
import { useGooglePlaces, type FormattedPlaceData } from "@/hooks/use-google-places";

interface PartnerFormProps {
  partner?: Partner;
  onSuccess?: () => void;
}

export function PartnerForm({ partner, onSuccess }: PartnerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleSearch, setShowGoogleSearch] = useState(false);

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(PartnerCreateSchema) as unknown as Resolver<PartnerFormData>,
    defaultValues: partner ? sanitizePartnerData(partner) : {
      name: "",
      slug: "",
      description: "",
      logo: "",
      website: "",
      email: "",
      phone: "",
      partnerType: "COMMERCIAL",
      category: "",
      priority: 0,
      isActive: true,
      isFeatured: false,
      startDate: "",
      endDate: "",
      // Geolocation fields
      street: "",
      streetNumber: "",
      postalCode: "",
      city: "",
      latitude: undefined,
      longitude: undefined,
      googlePlaceId: "",
      googleMapsUrl: "",
    },
  });

  // Hook Google Places
  const {
    isLoaded,
    predictions,
    inputValue,
    setInputValue,
    searchPlaces,
    getPlaceDetails,
    clearPredictions,
  } = useGooglePlaces({
    types: ["establishment"],
    onPlaceSelected: (place: FormattedPlaceData) => {
      // Remplir le formulaire avec les données Google
      form.setValue("street", place.street || "");
      form.setValue("streetNumber", place.streetNumber || "");
      form.setValue("postalCode", place.postalCode || "");
      form.setValue("city", place.city || "");
      form.setValue("latitude", place.latitude);
      form.setValue("longitude", place.longitude);
      form.setValue("googlePlaceId", place.googlePlaceId || "");
      form.setValue("googleMapsUrl", place.googleMapsUrl || "");

      // Remplir aussi les infos de contact si disponibles
      if (place.phone && !form.getValues("phone")) {
        form.setValue("phone", place.phone);
      }
      if (place.website && !form.getValues("website")) {
        form.setValue("website", place.website);
      }

      setShowGoogleSearch(false);
      clearPredictions();
      toast.success("Localisation importée depuis Google Business");
    },
  });

  // Debounce pour la recherche Google Places
  useEffect(() => {
    if (!showGoogleSearch || !inputValue || inputValue.length < 3) {
      return;
    }

    const timer = setTimeout(() => {
      searchPlaces(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [showGoogleSearch, inputValue, searchPlaces]);

  // Auto-génération du slug basé sur le nom
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
      .replace(/[^a-z0-9\s-]/g, "") // Supprimer les caractères spéciaux
      .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
      .replace(/-+/g, "-") // Supprimer les tirets multiples
      .replace(/^-|-$/g, ""); // Supprimer les tirets en début/fin

    form.setValue("slug", slug);
  };

  const onSubmit = async (data: PartnerFormData) => {
    setIsLoading(true);

    try {
      const url = partner
        ? `/api/admin/partners/${partner.id}`
        : "/api/admin/partners";

      const method = partner ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      toast.success(
        partner
          ? "Partenaire modifié avec succès"
          : "Partenaire créé avec succès"
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/admin/partners");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.back();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations principales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!partner) {
                              // Seulement en mode création
                              handleNameChange(e.target.value);
                            }
                          }}
                          placeholder="Nom du partenaire"
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
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="slug-du-partenaire" />
                      </FormControl>
                      <FormDescription>
                        Utilisé dans l&apos;URL. Doit contenir uniquement des
                        lettres minuscules, chiffres et tirets.
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Description du partenaire"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="ex: E-commerce, Finance..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorité</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="999"
                            placeholder="0"
                          />
                        </FormControl>
                        <FormDescription>
                          Plus le nombre est élevé, plus le partenaire apparaît
                          en haut
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact et liens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ""}
                          onChange={field.onChange}
                          onRemove={() => field.onChange("")}
                          type="partners"
                          slug={form.watch("slug") || "partner"}
                          imageType="logo"
                          maxSize={5}
                          showPreview={true}
                          showCrop={true}
                        />
                      </FormControl>
                      <FormDescription>
                        Téléchargez un logo pour le partenaire. Format
                        recommandé : carré, max 5MB
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site web</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="contact@..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="01 23 45 67 89" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Google Places Search */}
                {!showGoogleSearch ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowGoogleSearch(true)}
                    className="w-full"
                    disabled={!isLoaded}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Rechercher sur Google Business
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Rechercher un lieu..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowGoogleSearch(false);
                          setInputValue("");
                          clearPredictions();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {predictions.length > 0 && (
                      <div className="border rounded-md max-h-60 overflow-y-auto">
                        {predictions.map((prediction) => (
                          <button
                            key={prediction.place_id}
                            type="button"
                            onClick={() => {
                              getPlaceDetails(prediction.place_id);
                              setInputValue("");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-accent transition-colors border-b last:border-b-0"
                          >
                            <div className="font-medium text-sm">
                              {prediction.structured_formatting.main_text}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {prediction.structured_formatting.secondary_text}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Address Fields */}
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="streetNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>N°</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem className="col-span-3">
                        <FormLabel>Rue</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Rue de la Paix" />
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
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="34600" />
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
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Bédarieux" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Coordinates Display (read-only) */}
                {(form.watch("latitude") || form.watch("longitude")) && (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <div className="font-medium mb-1">Coordonnées GPS</div>
                    <div className="text-muted-foreground">
                      Lat: {form.watch("latitude")?.toFixed(6)}, Long:{" "}
                      {form.watch("longitude")?.toFixed(6)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de début</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormDescription>
                          Date à partir de laquelle le partenariat est actif
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de fin</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormDescription>
                          Date de fin du partenariat (optionnel)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Paramètres */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="partnerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PARTNER_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {PARTNER_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Actif</FormLabel>
                        <FormDescription>
                          Le partenaire est visible publiquement
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Mis en avant
                        </FormLabel>
                        <FormDescription>
                          Apparaît en premier dans les listes
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
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {partner ? "Modifier" : "Créer"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
