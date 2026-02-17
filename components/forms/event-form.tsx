"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Users,
  Euro,
  Globe,
  Image as ImageIcon,
  Repeat,
  Plus,
  X,
  MapPin,
  Search,
} from "lucide-react";
import { useGooglePlaces, type FormattedPlaceData } from "@/hooks/use-google-places";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/media/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { createEventAction, updateEventAction } from "@/actions/event";
import {
  eventWithRecurrenceSchema,
  type EventWithRecurrenceData,
  EVENT_CATEGORIES_LABELS,
  RECURRENCE_FREQUENCY_OPTIONS,
} from "@/lib/validations/event";
import { EventStatus, RecurrenceFrequency } from "@/lib/generated/prisma/browser";

interface EventFormProps {
  initialData?: Partial<EventWithRecurrenceData & { id: string }>;
  places?: Array<{ id: string; name: string; city: string }>;
}

const STATUS_OPTIONS = [
  { value: EventStatus.DRAFT, label: "Brouillon" },
  { value: EventStatus.PENDING_REVIEW, label: "En attente de validation" },
  { value: EventStatus.PUBLISHED, label: "Publié" },
];

const TIMEZONE_OPTIONS = [
  { value: "Europe/Paris", label: "Europe/Paris (France)" },
  { value: "Europe/London", label: "Europe/London (Royaume-Uni)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
];

const WEEKDAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

function formatDateTimeLocal(date: string | Date): string {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  d.setMinutes(d.getMinutes() - offset);
  return d.toISOString().slice(0, 16);
}

export function EventForm({ initialData, places = [] }: EventFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(
    initialData?.isRecurring || false
  );
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [videos, setVideos] = useState<string[]>(initialData?.videos || []);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [showGoogleSearch, setShowGoogleSearch] = useState(false);

  // Hook Google Places pour la géolocalisation
  const {
    isLoaded,
    predictions,
    inputValue,
    setInputValue,
    searchPlaces,
    getPlaceDetails,
    clearPredictions,
  } = useGooglePlaces({
    types: ["establishment", "point_of_interest"],
    onPlaceSelected: (place: FormattedPlaceData) => {
      // Remplir le formulaire avec les données Google
      form.setValue("locationName", place.name || "");
      form.setValue("locationStreet", place.street || "");
      form.setValue("locationStreetNumber", place.streetNumber || "");
      form.setValue("locationPostalCode", place.postalCode || "");
      form.setValue("locationCity", place.city || "");
      form.setValue("locationAddress", place.formatted_address || "");
      form.setValue("locationLatitude", place.latitude);
      form.setValue("locationLongitude", place.longitude);
      form.setValue("googlePlaceId", place.googlePlaceId || "");
      form.setValue("googleMapsUrl", place.googleMapsUrl || "");

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
  const [newTag, setNewTag] = useState("");

  const form = useForm<EventWithRecurrenceData>({
    resolver: zodResolver(eventWithRecurrenceSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      summary: initialData?.summary || "",
      status: initialData?.status || EventStatus.DRAFT,
      isFeatured: initialData?.isFeatured || false,
      placeId: initialData?.placeId || "none",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      website: initialData?.website || "",
      ticketUrl: initialData?.ticketUrl || "",
      startDate: initialData?.startDate
        ? formatDateTimeLocal(initialData.startDate)
        : "",
      endDate: initialData?.endDate
        ? formatDateTimeLocal(initialData.endDate)
        : "",
      isAllDay: initialData?.isAllDay || false,
      timezone: initialData?.timezone || "Europe/Paris",
      locationName: initialData?.locationName || "",
      locationAddress: initialData?.locationAddress || "",
      locationStreet: initialData?.locationStreet || "",
      locationStreetNumber: initialData?.locationStreetNumber || "",
      locationPostalCode: initialData?.locationPostalCode || "",
      locationCity: initialData?.locationCity || "",
      locationLatitude: initialData?.locationLatitude || undefined,
      locationLongitude: initialData?.locationLongitude || undefined,
      googlePlaceId: initialData?.googlePlaceId || "",
      googleMapsUrl: initialData?.googleMapsUrl || "",
      maxParticipants: initialData?.maxParticipants || undefined,
      isFree: initialData?.isFree ?? true,
      price: initialData?.price || undefined,
      priceDetails: initialData?.priceDetails || "",
      currency: initialData?.currency || "EUR",
      coverImage: initialData?.coverImage || "",
      images: images,
      videos: videos,
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
      ogImage: initialData?.ogImage || "",
      facebook: initialData?.facebook || "",
      instagram: initialData?.instagram || "",
      twitter: initialData?.twitter || "",
      linkedin: initialData?.linkedin || "",
      tiktok: initialData?.tiktok || "",
      tags: tags,
      category: initialData?.category || undefined,
      isRecurring: initialData?.isRecurring || false,
      recurrence: initialData?.recurrence || undefined,
    },
  });

  const onSubmit = async (data: EventWithRecurrenceData) => {
    try {
      setIsSubmitting(true);

      // Ajouter les médias et tags, traiter les valeurs spéciales
      const formData = {
        ...data,
        images,
        videos,
        tags,
        placeId: data.placeId === "none" ? undefined : data.placeId,
      };

      let result;
      if (isEditing) {
        result = await updateEventAction(initialData!.id!, formData);
      } else {
        result = await createEventAction(formData);
      }

      if (result.success) {
        toast.success(
          `Événement ${isEditing ? "modifié" : "créé"} avec succès`
        );
        router.push(`/dashboard/events`);
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addImage = () => {
    // Ajouter un slot vide pour un nouveau composant ImageUpload
    setImages([...images, ""]);
    form.setValue("images", [...images, ""]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    form.setValue("images", newImages);
  };

  const addVideo = () => {
    const url = prompt("URL de la vidéo (YouTube, Vimeo, etc.):");
    if (url && url.trim()) {
      setVideos([...videos, url.trim()]);
      form.setValue("videos", [...videos, url.trim()]);
    }
  };

  const removeVideo = (index: number) => {
    const newVideos = videos.filter((_, i) => i !== index);
    setVideos(newVideos);
    form.setValue("videos", newVideos);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      form.setValue("tags", updatedTags);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "Modifier l'événement" : "Créer un événement"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing
              ? "Modifiez les informations de votre événement"
              : "Créez un nouvel événement pour votre communauté"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Informations de base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Titre de l&apos;événement *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Concert de jazz au parc..."
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(EVENT_CATEGORIES_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Textarea
                        placeholder="Décrivez votre événement en quelques mots (max 280 caractères)..."
                        className="max-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Résumé qui apparaîtra dans les partages sur les réseaux
                      sociaux
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
                        placeholder="Description détaillée de votre événement..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                        Événement à la une
                      </FormLabel>
                      <FormDescription>
                        Mettre en avant cet événement sur la page d&apos;accueil
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

          {/* Dates et récurrence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Dates et horaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date et heure de début *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date et heure de fin *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuseau horaire</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
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
                  name="isAllDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Toute la journée
                        </FormLabel>
                        <FormDescription>
                          Événement sur toute la journée
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

              {/* Récurrence */}
              <Collapsible
                open={showRecurrence}
                onOpenChange={setShowRecurrence}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className="flex items-center gap-2"
                  >
                    <Repeat className="w-4 h-4" />
                    Événement récurrent
                    {showRecurrence ? "↑" : "↓"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Activer la récurrence
                          </FormLabel>
                          <FormDescription>
                            Créer des occurrences répétées de cet événement
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked && !form.getValues("recurrence")) {
                                // Initialiser avec des valeurs par défaut quand récurrence activée
                                form.setValue("recurrence", {
                                  frequency: RecurrenceFrequency.WEEKLY,
                                  interval: 1,
                                  count: 5,
                                  workdaysOnly: false,
                                });
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("isRecurring") && (
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="recurrence.frequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fréquence</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choisir..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {RECURRENCE_FREQUENCY_OPTIONS.map(
                                      (option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="recurrence.interval"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Intervalle</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormDescription>
                                  Tous les X{" "}
                                  {form.watch("recurrence.frequency") ===
                                  RecurrenceFrequency.WEEKLY
                                    ? "semaines"
                                    : ""}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="recurrence.count"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre d&apos;occurrences</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="10"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value
                                          ? parseInt(e.target.value)
                                          : undefined
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="recurrence.until"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ou jusqu&apos;au</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch("recurrence.frequency") ===
                          RecurrenceFrequency.WEEKLY && (
                          <FormItem>
                            <FormLabel>Jours de la semaine</FormLabel>
                            <div className="flex flex-wrap gap-2">
                              {WEEKDAYS.map((day) => (
                                <Button
                                  key={day.value}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => {
                                    const current =
                                      form.getValues("recurrence.byWeekDay") ||
                                      [];
                                    const newValue = current.includes(day.value)
                                      ? current.filter((d) => d !== day.value)
                                      : [...current, day.value];
                                    form.setValue(
                                      "recurrence.byWeekDay",
                                      newValue
                                    );
                                  }}
                                >
                                  {day.label}
                                </Button>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Lieu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Lieu de l&apos;événement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="placeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Place référencée</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une place..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          Aucune place sélectionnée
                        </SelectItem>
                        {places.map((place) => (
                          <SelectItem key={place.id} value={place.id}>
                            {place.name} • {place.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Sélectionnez une place existante ou renseignez les
                      informations ci-dessous
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Google Places Search */}
              <div className="space-y-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="locationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du lieu</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Parc municipal, Salle des fêtes..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationStreetNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>N°</FormLabel>
                      <FormControl>
                        <Input placeholder="12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rue</FormLabel>
                      <FormControl>
                        <Input placeholder="Rue de la Paix" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationPostalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code postal</FormLabel>
                      <FormControl>
                        <Input placeholder="34600" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input placeholder="Bédarieux" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Adresse complète (optionnel)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Avenue de la République, 34600 Bédarieux"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Rempli automatiquement depuis Google ou peut être modifié manuellement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationLatitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="43.6532"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationLongitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="3.1645"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Participants et tarification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants et tarifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre maximum de participants</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="100"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Laissez vide pour un événement sans limite de participants
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Événement gratuit
                      </FormLabel>
                      <FormDescription>
                        Cochez si l&apos;événement est gratuit
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

              {!form.watch("isFree") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix *</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="15.00"
                              className="pr-8"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                          <Euro className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Détails tarifaires</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Adulte: 15€, Enfant: 8€"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact et liens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Contact et liens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de contact</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@example.com"
                          {...field}
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
                        <Input placeholder="06 12 34 56 78" {...field} />
                      </FormControl>
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
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ticketUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lien billetterie</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://billetterie.example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Réseaux sociaux</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://facebook.com/..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://instagram.com/..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://twitter.com/..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://linkedin.com/..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Médias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Images et médias
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
                        type="events"
                        slug={
                          form.getValues("title")
                            ? form
                                .getValues("title")
                                .toLowerCase()
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "")
                                .replace(/[^a-z0-9\s-]/g, "")
                                .replace(/\s+/g, "-")
                                .replace(/-+/g, "-")
                                .trim()
                                .replace(/^-|-$/g, "") || "new-event"
                            : "new-event"
                        }
                        imageType="cover"
                        aspectRatios={[
                          { label: "16:9 (Recommandé)", value: 16 / 9 },
                          { label: "4:3", value: 4 / 3 },
                          { label: "Libre", value: undefined },
                        ]}
                        showPreview={true}
                        showCrop={true}
                      />
                    </FormControl>
                    <FormDescription>
                      Image principale qui apparaîtra en tête de
                      l&apos;événement (recommandé: 1200x675px)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Galerie d'images */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Galerie d&apos;images</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addImage}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une image
                  </Button>
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <ImageUpload
                          value={image}
                          onChange={(url) => {
                            const newImages = [...images];
                            newImages[index] = url;
                            setImages(newImages);
                            form.setValue("images", newImages);
                          }}
                          onRemove={() => removeImage(index)}
                          type="events"
                          slug={
                            form.getValues("title")
                              ? form
                                  .getValues("title")
                                  .toLowerCase()
                                  .normalize("NFD")
                                  .replace(/[\u0300-\u036f]/g, "")
                                  .replace(/[^a-z0-9\s-]/g, "")
                                  .replace(/\s+/g, "-")
                                  .replace(/-+/g, "-")
                                  .trim()
                                  .replace(/^-|-$/g, "") || "new-event"
                              : "new-event"
                          }
                          subFolder="gallery"
                          imageType="gallery"
                          showPreview={true}
                          showCrop={true}
                          className="min-h-[200px]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vidéos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Vidéos</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVideo}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une vidéo
                  </Button>
                </div>
                <FormDescription>
                  Ajoutez des liens YouTube, Vimeo ou autres plateformes vidéo
                </FormDescription>
                {videos.length > 0 && (
                  <div className="space-y-2">
                    {videos.map((video, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 border rounded"
                      >
                        <Input value={video} readOnly className="flex-1" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeVideo(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags et SEO */}
          <Card>
            <CardHeader>
              <CardTitle>Tags et référencement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tags */}
              <div className="space-y-4">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        #{tag}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* SEO */}
              <div className="space-y-4">
                <h4 className="font-medium">Référencement (SEO)</h4>
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre SEO</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Titre pour les moteurs de recherche (max 60 caractères)"
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
                            placeholder="Description pour les moteurs de recherche (max 160 caractères)"
                            className="max-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image de partage social</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ""}
                            onChange={field.onChange}
                            onRemove={() => field.onChange("")}
                            type="events"
                            slug={
                              form.getValues("title")
                                ? form
                                    .getValues("title")
                                    .toLowerCase()
                                    .normalize("NFD")
                                    .replace(/[\u0300-\u036f]/g, "")
                                    .replace(/[^a-z0-9\s-]/g, "")
                                    .replace(/\s+/g, "-")
                                    .replace(/-+/g, "-")
                                    .trim()
                                    .replace(/^-|-$/g, "") || "new-event"
                                : "new-event"
                            }
                            imageType="social"
                            aspectRatios={[
                              {
                                label: "1.91:1 (Recommandé Facebook/Twitter)",
                                value: 1.91,
                              },
                              { label: "16:9", value: 16 / 9 },
                              { label: "Libre", value: undefined },
                            ]}
                            showPreview={true}
                            showCrop={true}
                          />
                        </FormControl>
                        <FormDescription>
                          Image utilisée lors du partage sur les réseaux sociaux
                          (recommandé: 1200x630px)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Enregistrement..."
                : isEditing
                  ? "Modifier"
                  : "Créer l'événement"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
