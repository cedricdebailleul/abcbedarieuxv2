"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Clock,
  FileText,
  Globe,
  ImageIcon,
  RefreshCw,
  Settings,
  Upload,
  MapPin,
  Loader2} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  FormProvider,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  Resolver,
  useWatch,
} from "react-hook-form";
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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  type FormattedPlaceData,
  useGooglePlaces,
} from "@/hooks/use-google-places";
import { OpeningHoursForm } from "./opening-hours-form";
import { PlaceFormMap as PlaceFormMapUltraSimple } from "./place-form-map-ultra-simple";
import { generateSlug } from "@/lib/validations/post";
import { getPlaceCategoriesAction } from "@/actions/place-category";
import Image from "next/image";

/* -------------------- Types horaires unifiés -------------------- */
// Si OpeningHoursForm exporte ces types, importe-les au lieu de redéclarer.
export type OpeningSlot = { openTime: string; closeTime: string };
export type DaySchedule = {
  dayOfWeek: string;
  isClosed: boolean;
  slots: OpeningSlot[];
};

// Ancien/variantes entrées brutes (Google/legacy)
type RawOpeningSlot = { openTime?: string | null; closeTime?: string | null };
type RawHour = {
  dayOfWeek: string;
  isClosed?: boolean;
  openTime?: string | null; // legacy à plat
  closeTime?: string | null; // legacy à plat
  slots?: RawOpeningSlot[]; // version en créneaux
};

/* -------------------- Normalisation horaires -------------------- */
function toDaySchedule(raw: RawHour[]): DaySchedule[] {
  console.log("toDaySchedule - Raw input:", raw);
  
  return (raw ?? []).map((h) => {
    console.log("toDaySchedule - Processing hour:", h);
    
    // slots depuis tableau
    const slotsFromArray: OpeningSlot[] = (h.slots ?? [])
      .map((s) => ({
        openTime: s.openTime ?? "",
        closeTime: s.closeTime ?? "",
      }))
      .filter((s) => s.openTime && s.closeTime);

    // slot unique depuis champs à plat (seulement si pas de slots dans le tableau)
    const slotFromFlat: OpeningSlot[] =
      slotsFromArray.length === 0 && h.openTime && h.closeTime
        ? [{ openTime: h.openTime, closeTime: h.closeTime }]
        : [];

    const slots = [...slotsFromArray, ...slotFromFlat];
    
    // Dédupliquer les slots au cas où il y aurait des doublons
    const uniqueSlots = slots.filter((slot, index, arr) => 
      arr.findIndex(s => s.openTime === slot.openTime && s.closeTime === slot.closeTime) === index
    );
    
    // Ne pas marquer comme fermé si on a des créneaux valides
    const isClosed = h.isClosed === true ? true : uniqueSlots.length === 0;
    
    console.log("toDaySchedule - Result for", h.dayOfWeek, ":", { isClosed, slots: uniqueSlots });

    return {
      dayOfWeek: String(h.dayOfWeek).toUpperCase(),
      isClosed,
      slots: uniqueSlots,
    };
  });
}

/* ----------------------------- Zod ------------------------------ */

const urlOrEmpty = z
  .string()
  .trim()
  .optional()
  .transform((v) => v ?? "")
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "URL invalide");

const numOpt = z.preprocess(
  (v) => (v === null || v === "" ? undefined : v),
  z.coerce.number().finite().optional()
);

const placeSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),

  category: z.string().optional(), // Legacy
  categories: z.array(z.string()).optional(),

  description: z.string().optional(),
  summary: z.string().max(280).optional(),

  // Adresse
  street: z.string().min(1, "La rue est requise"),
  streetNumber: z.string().optional(),
  postalCode: z.string().min(1, "Le code postal est requis"),
  city: z.string().min(1, "La ville est requise"),
  latitude: numOpt,
  longitude: numOpt,

  // Média
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  photos: z.array(z.string()).optional(),

  // Contact
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: urlOrEmpty,
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  tiktok: z.string().optional(),

  // Google
  googlePlaceId: z.string().optional(),
  googleMapsUrl: z.string().optional(),

  // SEO
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),

  // Publication
  published: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type PlaceFormData = z.infer<typeof placeSchema> & {
  // on tolère l’ancienne forme côté initialData
  openingHours?: RawHour[];
};

type PlaceFormProps = {
  initialData?: Partial<PlaceFormData & { id?: string; images?: string[]; ownerId?: string | null }>;
  onSubmit: (
    data: PlaceFormData & {
      openingHours?: RawHour[];
      images?: string[];
      createForClaim?: boolean;
    }
  ) => Promise<void>;
  mode?: "create" | "edit";
  userRole?: string;
};

/* ----------------------- Constantes UI -------------------------- */

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

/* ============================ Component ============================ */

export function PlaceForm({
  initialData,
  onSubmit,
  mode = "create",
  userRole,
}: PlaceFormProps) {
  const [isPending, startTransition] = useTransition();

  // Horaires normalisés pour OpeningHoursForm
  const [openingHours, setOpeningHours] = useState<DaySchedule[]>([]);
  // Galerie d’images
  const [images, setImages] = useState<string[]>([]);
  // Google search box
  const [showGoogleSearch, setShowGoogleSearch] = useState(mode === "create");
  const isSelectingPrediction = useRef(false);
  // Admin: fiche non attribuée (peut être revendiquée)
  // En mode édition, initialiser à true si pas de propriétaire
  const [createForClaim, setCreateForClaim] = useState(
    mode === "edit" ? !initialData?.ownerId : false
  );

  const [placeCategories, setPlaceCategories] = useState<
    { value: string; label: string; level: number }[]
  >([]);

  const form = useForm<PlaceFormData>({
    resolver: zodResolver(placeSchema) as Resolver<PlaceFormData, unknown>,
    defaultValues: {
      name: "",
      type: "OTHER", // Type par défaut (correspond au @default(OTHER) de Prisma)
      category: "",
      categories: [],
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
      published: userRole === "admin" ? true : false, // Auto-publier pour les admins
      isFeatured: false,
    },
  });

  // watch (évite les warnings de deps complexes dans useEffect)
  const streetW = useWatch({ control: form.control, name: "street" });
  const streetNumberW = useWatch({ control: form.control, name: "streetNumber" });
  const cityW = useWatch({ control: form.control, name: "city" });
  const postalCodeW = useWatch({ control: form.control, name: "postalCode" });

  // Google Places hook
  const {
    isLoaded,
    isSearching,
    predictions,
    inputValue,
    searchPlaces,
    getPlaceDetails,
    fetchOpeningHours,
    geocodeAddress,
    setInputValue,
    clearPredictions,
  } = useGooglePlaces({
    onPlaceSelected: (place: FormattedPlaceData) => {
      void fillFormWithGoogleData(place);
    },
  });

  // États auxiliaires
  const [isFetchingHours, setIsFetchingHours] = useState(false);
  const [hoursMode, setHoursMode] = useState<"google" | "manual">("google");
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Slug pour upload (temp en création)
  const [tempSlug] = useState(() =>
    mode === "create"
      ? `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      : ""
  );

  // Reset le formulaire quand initialData change
  useEffect(() => {
    if (initialData && mode === "edit") {
      console.log("PlaceForm - Raw initialData:", initialData);
      
      // Map the data explicitly to ensure proper field matching
      // Générer automatiquement les métadonnées si manquantes
      const placeName = initialData.name || "";
      const placeCity = initialData.city || "";
      const placeType = initialData.type || "COMMERCE";
      
      console.log("PlaceForm - initialData.type:", initialData.type);
      console.log("PlaceForm - placeType after fallback:", placeType);
      
      const autoMetaTitle = placeName 
        ? `${placeName} - ${placeCity} | ABC Bédarieux`
        : "Commerce - ABC Bédarieux";
      
      const autoMetaDescription = placeName
        ? `Découvrez ${placeName} à ${placeCity}. ${initialData.description ? initialData.description.substring(0, 120) + '...' : `${placeType.toLowerCase()} situé à ${placeCity}.`}`
        : `Découvrez ce ${placeType.toLowerCase()} à ${placeCity}.`;
        
      const autoSummary = placeName && initialData.description
        ? initialData.description.length > 200 
          ? initialData.description.substring(0, 197) + '...'
          : initialData.description
        : `${placeName} - ${placeType.toLowerCase()} à ${placeCity}`;

      const formData = {
        name: placeName,
        type: initialData.type || "COMMERCE",
        category: initialData.category || "",
        categories: initialData.categories || [],
        description: initialData.description || "",
        summary: initialData.summary || autoSummary,
        street: initialData.street || "",
        streetNumber: initialData.streetNumber || "",
        postalCode: initialData.postalCode || "",
        city: placeCity,
        latitude: initialData.latitude,
        longitude: initialData.longitude,
        logo: initialData.logo || "",
        coverImage: initialData.coverImage || "",
        photos: initialData.images || [],
        email: initialData.email || "",
        phone: initialData.phone || "",
        website: initialData.website || "",
        facebook: initialData.facebook || "",
        instagram: initialData.instagram || "",
        twitter: initialData.twitter || "",
        linkedin: initialData.linkedin || "",
        tiktok: initialData.tiktok || "",
        googlePlaceId: initialData.googlePlaceId || "",
        googleMapsUrl: initialData.googleMapsUrl || "",
        metaTitle: initialData.metaTitle || autoMetaTitle,
        metaDescription: initialData.metaDescription || autoMetaDescription,
        published: initialData.published ?? (userRole === "admin" ? true : false), // Conserver la valeur existante
        isFeatured: initialData.isFeatured ?? false, // Conserver la valeur existante
      };
      
      console.log("PlaceForm - Mapped formData:", formData);
      console.log("PlaceForm - formData.type specifically:", formData.type);
      console.log("PlaceForm - Current form values before reset:", form.getValues());
      
      form.reset(formData);
      
      console.log("PlaceForm - Form values after reset:", form.getValues());
    }
  }, [initialData, mode, form, userRole]);

  // Forcer le type par défaut si vide
  useEffect(() => {
    const currentType = form.getValues("type");
    if (!currentType || currentType === "") {
      console.log("PlaceForm - Type is empty, setting default COMMERCE");
      form.setValue("type", "COMMERCE");
    }
  }, [form, initialData]);

  // Préremplir images & horaires en EDIT (une seule fois au montage)
  useEffect(() => {
    if (mode === "edit" && images.length === 0) {
      // Charger uniquement si le state est vide (évite de réinitialiser après suppression)
      if (Array.isArray(initialData?.images) && initialData.images.length > 0) {
        const uniqueImages = Array.from(new Set(initialData.images));
        console.log("PlaceForm EDIT - Initial load of images:", uniqueImages.length);
        setImages(uniqueImages);
      }
    }

    if (mode === "edit" && openingHours.length === 0) {
      if (initialData?.openingHours) {
        setOpeningHours(toDaySchedule(initialData.openingHours as RawHour[]));
      }
    }

  }, [mode]); // Retirer initialData des dépendances pour éviter la réinitialisation

  // Charger catégories
  useEffect(() => {
    (async () => {
      try {
        const result = await getPlaceCategoriesAction({
          page: 1,
          limit: 100,
          sortBy: "sortOrder",
          sortOrder: "asc",
        });
        if (result.success && result.data) {
          const all: { value: string; label: string; level: number }[] = [];
          result.data.categories.forEach(
            (cat: {
              id: string;
              name: string;
              children?: { id: string; name: string }[];
            }) => {
              all.push({ value: cat.id, label: cat.name, level: 0 });
              (cat.children ?? []).forEach((c) =>
                all.push({ value: c.id, label: `└ ${c.name}`, level: 1 })
              );
            }
          );
          setPlaceCategories(all);
        }
      } catch (e) {
        console.error("Erreur catégories:", e);
      }
    })();
  }, []);

  // Géocodage adresse (memo + deps OK)
  const handleGeocodeAddress = useCallback(async () => {
    const street = form.getValues("street");
    const city = form.getValues("city");
    const postalCode = form.getValues("postalCode");
    if (!street || !city) {
      toast.error(
        "Adresse incomplète. Veuillez renseigner au minimum la rue et la ville."
      );
      return;
    }
    const address = `${street}, ${postalCode} ${city}, France`;
    try {
      setIsGeocoding(true);
      const coords = await geocodeAddress(address);
      form.setValue("latitude", coords.lat);
      form.setValue("longitude", coords.lng);
      toast.success("Coordonnées récupérées avec succès !");
    } catch (err) {
      console.error("Erreur géocodage:", err);
      toast.error("Impossible de géocoder l'adresse. Vérifiez l'adresse.");
    } finally {
      setIsGeocoding(false);
    }
  }, [form, geocodeAddress]);

  // Gérer les changements de coordonnées depuis la carte
  const handleMapCoordinatesChange = useCallback((lat: number, lng: number) => {
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);
    toast.success("Position mise à jour depuis la carte");
  }, [form]);

  // Géocodage automatique en création
  useEffect(() => {
    if (mode !== "create") return;
    const haveCoords =
      !!form.getValues("latitude") || !!form.getValues("longitude");
    if (haveCoords) return;
    if (streetW && cityW && postalCodeW) {
      const t = setTimeout(() => {
        void handleGeocodeAddress();
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [mode, streetW, cityW, postalCodeW, form, handleGeocodeAddress]);

  // Debounce recherche Google
  // Note: searchPlaces et clearPredictions sont exclus des dépendances car ce sont
  // des fonctions stables (useCallback) et les inclure causerait une boucle infinie
  useEffect(() => {
    if (!showGoogleSearch) return;
    if (isSelectingPrediction.current) {
      isSelectingPrediction.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (inputValue && inputValue.length >= 3) {
        searchPlaces(inputValue);
      } else {
        clearPredictions();
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGoogleSearch, inputValue]);

  // Import Google → upload sélectif du logo
  const uploadGoogleImage = useCallback(
    async (
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
        if (!response.ok) throw new Error("Erreur lors de l'upload");
        const result = await response.json();
        return result.uploadedImages?.[0] || null;
      } catch (e) {
        console.error(`Erreur upload ${imageType}:`, e);
        return null;
      }
    },
    // uploadSlug calculé plus bas
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const fillFormWithGoogleData = useCallback(
    async (place: FormattedPlaceData) => {
      // Base - préserver les valeurs existantes si Google n'en fournit pas
      form.setValue("name", place.name ?? "");
      
      // Type : utiliser Google si disponible, sinon garder la valeur existante ou "OTHER" par défaut
      if (place.type && place.type.trim() !== "") {
        form.setValue("type", place.type);
      } else {
        // Si pas de type Google et pas de type existant, utiliser "OTHER" par défaut
        const currentType = form.getValues("type");
        if (!currentType || currentType === "") {
          form.setValue("type", "OTHER");
        }
      }
      
      form.setValue("category", place.category ?? "");

      // Adresse
      form.setValue("street", place.street ?? "");
      form.setValue("streetNumber", place.streetNumber ?? "");
      form.setValue("postalCode", place.postalCode ?? "");
      form.setValue("city", place.city ?? "");
      form.setValue("latitude", place.latitude);
      form.setValue("longitude", place.longitude);

      // Logo (upload auto) - ne pas écraser si on a déjà un logo local
      const currentLogo = form.getValues("logo");
      if (place.logo?.startsWith("http") && (!currentLogo || currentLogo.startsWith("http"))) {
        const uploadedLogo = await uploadGoogleImage(place.logo, "logo");
        form.setValue("logo", uploadedLogo || place.logo);
      } else if (place.logo && !currentLogo) {
        form.setValue("logo", place.logo);
      }
      // Couverture : proposer la première photo Google comme couverture potentielle
      if (place.photos && place.photos.length > 0) {
        // Prendre la première photo comme suggestion de couverture
        const suggestedCover = place.photos[0];
        // Ne définir que si on n'a pas déjà une couverture
        const currentCover = form.getValues("coverImage");
        if (!currentCover || currentCover === "") {
          form.setValue("coverImage", suggestedCover);
        }
      }

      // Galerie - en mode édition, conserver les images existantes et ajouter les nouvelles
      if (mode === "create") {
        // En création, remplacer complètement
        setImages(place.photos ?? []);
      } else {
        // En édition, ajouter seulement les nouvelles photos Google qui ne sont pas déjà présentes
        const existingImages = images;
        const newGooglePhotos = place.photos ?? [];
        
        // Filtrer les nouvelles photos Google pour éviter les doublons
        const uniqueNewPhotos = newGooglePhotos.filter((photo) => {
          // Exclure si l'URL est déjà présente
          if (existingImages.includes(photo)) return false;
          
          // Extraire l'ID de la photo Google pour une détection plus robuste
          const photoId = photo.match(/CmRaAAAA[\w-]+/)?.[0] || 
                          photo.match(/\/([^\/]+)(?:\?|$)/)?.[1] ||
                          photo.match(/photo-(\d+)/)?.[1];
          
          if (photoId) {
            // Vérifier si on a déjà une version uploadée de cette photo
            const hasUploadedVersion = existingImages.some(img => {
              // Vérifier les images uploadées qui contiennent l'ID
              return img.startsWith('/uploads/') && img.includes(photoId);
            });
            if (hasUploadedVersion) return false;
          }
          
          // Vérifier aussi par nom de fichier pour les cas où l'ID n'est pas détecté
          const fileName = photo.split('/').pop()?.split('?')[0];
          if (fileName) {
            const hasSimilarFile = existingImages.some(img => 
              img.includes(fileName.substring(0, 10)) // Comparer les 10 premiers caractères
            );
            if (hasSimilarFile) return false;
          }
          
          return true;
        });
        
        if (uniqueNewPhotos.length > 0) {
          setImages([...existingImages, ...uniqueNewPhotos]);
          toast.success(`${uniqueNewPhotos.length} nouvelles images ajoutées depuis Google`);
        } else {
          const totalGooglePhotos = newGooglePhotos.length;
          if (totalGooglePhotos > 0) {
            toast.info(`${totalGooglePhotos} images Google détectées mais déjà présentes`);
          } else {
            toast.info("Aucune image trouvée depuis Google");
          }
        }
      }

      // Contact
      form.setValue("phone", place.phone ?? "");
      form.setValue("website", place.website ?? "");

      // Google
      form.setValue("googlePlaceId", place.googlePlaceId ?? "");
      form.setValue("googleMapsUrl", place.googleMapsUrl ?? "");

      // SEO
      form.setValue("metaDescription", place.metaDescription ?? "");

      // Horaires normalisés
      setOpeningHours(toDaySchedule((place.openingHours ?? []) as RawHour[]));

      setShowGoogleSearch(false);
      toast.success("Les informations ont été importées depuis Google");
    },
    [form, uploadGoogleImage, images, mode]
  );

  const handleFetchOpeningHours = useCallback(async () => {
    const gpid = form.getValues("googlePlaceId");
    if (!gpid) {
      toast.error(
        "Aucun ID Google Place trouvé. Importez d'abord depuis Google."
      );
      return;
    }
    try {
      setIsFetchingHours(true);
      const raw = (await fetchOpeningHours(gpid)) as RawHour[] | undefined;
      if (raw) {
        setOpeningHours(toDaySchedule(raw));
        toast.success("Horaires récupérées depuis Google !");
      }
    } catch (e) {
      console.error("Erreur récupération horaires:", e);
      toast.error("Impossible de récupérer les horaires depuis Google");
    } finally {
      setIsFetchingHours(false);
    }
  }, [form, fetchOpeningHours]);

  const onSubmitForm: SubmitHandler<PlaceFormData> = (data) => {
    console.log("PlaceForm - Submitting data:", data);
    console.log("PlaceForm - data.type specifically:", data.type);
    
    startTransition(async () => {
      try {
        // Convertit l’état DaySchedule -> RawHour pour l’API (slots only)
        const openingRaw: RawHour[] = openingHours.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          isClosed: d.isClosed,
          slots: d.slots.map((s) => ({
            openTime: s.openTime,
            closeTime: s.closeTime,
          })),
        }));

        await onSubmit({
          ...data,
          photos: (data.photos || []).filter(Boolean),
          openingHours: openingRaw,
          images,
          createForClaim: userRole === "admin" ? createForClaim : undefined,
        });

        toast.success(
          mode === "create"
            ? "Établissement créé avec succès"
            : "Établissement mis à jour"
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

  const onInvalid: SubmitErrorHandler<PlaceFormData> = (errors) => {
    const first = Object.entries(errors)[0];
    if (first) {
      const [name, err] = first as [string, { message?: string }];
      const msg = err?.message || `Champ invalide: ${name}`;
      const el = document.querySelector(
        `[name="${name}"]`
      ) as HTMLElement | null;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus?.();
      toast.error(msg);
    } else {
      toast.error("Formulaire invalide");
    }
  };

  const nameVal = useWatch({ control: form.control, name: "name" }) ?? "";
  const metaTitle =
    useWatch({ control: form.control, name: "metaTitle" }) ?? "";
  const metaDescription =
    useWatch({ control: form.control, name: "metaDescription" }) ?? "";
  const lat = useWatch({ control: form.control, name: "latitude" });
  const lng = useWatch({ control: form.control, name: "longitude" });
  const googlePlaceId = useWatch({
    control: form.control,
    name: "googlePlaceId",
  });
  const googleMapsUrl = useWatch({
    control: form.control,
    name: "googleMapsUrl",
  });

  const computedSlug = useMemo(() => generateSlug(nameVal || ""), [nameVal]);
  const uploadSlug = mode === "create" ? tempSlug : computedSlug || "general";

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            void form.handleSubmit(onSubmitForm, onInvalid)(e);
          }}
          className="space-y-6"
        >
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

                      {predictions.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow">
                          {predictions.map((p) => (
                            <Button
                              key={p.place_id}
                              type="button"
                              variant="ghost"
                              className="w-full justify-start gap-2"
                              onClick={() => {
                                isSelectingPrediction.current = true;
                                setInputValue(p.description);
                                getPlaceDetails(p.place_id);
                                clearPredictions();
                              }}
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
                        {nameVal && (
                          <p className="text-xs text-muted-foreground">
                            Slug prévisionnel :{" "}
                            <code className="bg-muted px-1 rounded">
                              {computedSlug}
                            </code>
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => {
                        // S'assurer que la valeur est toujours définie
                        const currentValue = field.value || "COMMERCE";

                        // Si field.value est vide mais qu'on a une valeur par défaut, la définir
                        if (!field.value && currentValue) {
                          field.onChange(currentValue);
                        }

                        return (
                          <FormItem>
                            <FormLabel>Type *</FormLabel>
                            <FormControl>
                              <Select
                                value={currentValue}
                                onValueChange={field.onChange}
                                defaultValue={currentValue}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un type…" />
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
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégories (optionnel)</FormLabel>
                          <FormControl>
                            <MultiSelect
                              options={placeCategories}
                              value={field.value || []}
                              onValueChange={field.onChange}
                              placeholder="Sélectionnez des catégories"
                            />
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
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="latitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-muted-foreground">
                                Latitude
                              </FormLabel>
                              <FormControl>
                                <Input
                                  value={field.value?.toString() || ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || undefined
                                    )
                                  }
                                  readOnly
                                  className="bg-muted"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="longitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-muted-foreground">
                                Longitude
                              </FormLabel>
                              <FormControl>
                                <Input
                                  value={field.value?.toString() || ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || undefined
                                    )
                                  }
                                  readOnly
                                  className="bg-muted"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {mode === "edit" && (
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGeocodeAddress}
                            disabled={isGeocoding || !isLoaded}
                            className="gap-2"
                          >
                            {isGeocoding ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            {isGeocoding
                              ? "Actualisation..."
                              : "Actualiser les coordonnées GPS"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {!lat && !lng && (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGeocodeAddress}
                        disabled={isGeocoding || !isLoaded}
                        className="gap-2"
                      >
                        {isGeocoding ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                        {isGeocoding
                          ? "Géocodage..."
                          : "Obtenir les coordonnées GPS"}
                      </Button>
                    </div>
                  )}

                  {/* Carte interactive pour ajustement de position */}
                  <div className="space-y-3">
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Ajustement de position
                      </h4>
                      <PlaceFormMapUltraSimple
                        latitude={lat || 43.6284}
                        longitude={lng || 3.1631}
                        onCoordinatesChange={handleMapCoordinatesChange}
                        address={`${streetW} ${streetNumberW}, ${postalCodeW} ${cityW}`.trim().replace(/^,\s*/, '')}
                      />
                    </div>
                  </div>
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
                  {(
                    [
                      "facebook",
                      "instagram",
                      "twitter",
                      "linkedin",
                      "tiktok",
                    ] as const
                  ).map((fieldName) => (
                    <FormField
                      key={fieldName}
                      control={form.control}
                      name={fieldName}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize">
                            {fieldName}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="URL ou @handle" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
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
                        <p className="text-sm text-muted-foreground mb-2">
                          Format Facebook (1.91:1) recommandé. Le recadrage
                          s&apos;ouvrira automatiquement.
                        </p>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ""}
                            onChange={field.onChange}
                            onRemove={() => field.onChange("")}
                            type="places"
                            slug={uploadSlug}
                            imageType="cover"
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
                        <p className="text-sm text-muted-foreground mb-2">
                          Format carré (1:1) recommandé. Utilisez le bouton
                          &quot;Recadrer&quot; pour ajuster si besoin.
                        </p>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ""}
                            onChange={field.onChange}
                            onRemove={() => field.onChange("")}
                            type="places"
                            slug={uploadSlug}
                            imageType="logo"
                            className="max-w-md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Galerie */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Galerie d&apos;images</h4>
                      <span className="text-sm text-muted-foreground">
                        {images.length} image{images.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Bouton upload groupé images Google */}
                    {images.some((img) => img.startsWith("http")) && (
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
                            const googleImages = images.filter((i) =>
                              i.startsWith("http")
                            );
                            
                            // Éviter les doublons dans les URLs Google elles-mêmes
                            const uniqueGoogleImages = googleImages.filter((img, index, arr) => 
                              arr.indexOf(img) === index
                            );
                            
                            if (uniqueGoogleImages.length === 0) return;
                            startTransition(async () => {
                              try {
                                const response = await fetch(
                                  "/api/upload-google-images",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      images: uniqueGoogleImages,
                                      slug: uploadSlug,
                                      type: "places",
                                    }),
                                  }
                                );
                                if (!response.ok)
                                  throw new Error("Erreur lors de l'upload");
                                const result = await response.json();
                                setImages((prev) => {
                                  // Conserver les images non-Google existantes
                                  const nonGoogleImages = prev.filter(
                                    (img) => !img.startsWith("http")
                                  );
                                  
                                  // Ajouter les nouvelles images uploadées en évitant les doublons
                                  const newUploadedImages = result.uploadedImages.filter((newImg: string) =>
                                    !nonGoogleImages.includes(newImg)
                                  );
                                  
                                  return [...nonGoogleImages, ...newUploadedImages];
                                });
                                toast.success(
                                  `${result.uploadedCount}/${result.totalCount} images uploadées`
                                );
                              } catch (err) {
                                console.error("Erreur upload:", err);
                                toast.error(
                                  "Erreur lors de l'upload des images Google"
                                );
                              }
                            });
                          }}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Uploader toutes les images Google
                        </Button>
                      </div>
                    )}

                    {/* Upload multiple */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-muted-foreground">
                          Upload multiple d&apos;images
                        </h5>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Créer un input file multiple
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.accept = 'image/*';
                            input.onchange = async (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (files && files.length > 0) {
                                toast.info(`Upload de ${files.length} image(s) en cours...`);
                                for (const file of files) {
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('type', 'places');
                                    formData.append('slug', uploadSlug);
                                    formData.append('subFolder', 'gallery');
                                    formData.append('imageType', 'gallery');
                                    
                                    const response = await fetch('/api/upload', {
                                      method: 'POST',
                                      body: formData,
                                    });
                                    
                                    if (response.ok) {
                                      const result = await response.json();
                                      setImages(prev => [...prev, result.url]);
                                    }
                                  } catch (error) {
                                    console.error('Erreur upload:', error);
                                  }
                                }
                                toast.success('Images uploadées !');
                              }
                            };
                            input.click();
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Sélectionner plusieurs images
                        </Button>
                      </div>
                    </div>

                    {/* Upload unité galerie */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">
                        Ajouter une image à la galerie
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        Format carré 1080x1080px (Instagram). Le recadrage
                        s&apos;ouvrira automatiquement.
                      </p>
                      <ImageUpload
                        value=""
                        onChange={(url) => setImages((prev) => [...prev, url])}
                        type="places"
                        slug={uploadSlug}
                        subFolder="gallery"
                        imageType="gallery"
                        showPreview={false}
                        className="max-w-md"
                      />
                    </div>

                    {/* Aperçu */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((src, i) => (
                          <div key={i} className="relative aspect-square">
                            <Image
                              src={src}
                              alt={`Photo ${i + 1}`}
                              className="h-full w-full rounded-lg object-cover border"
                              fill
                            />
                            <div className="absolute left-2 top-2">
                              <span
                                className={`px-1.5 py-0.5 text-xs rounded-full text-white font-medium ${
                                  src.startsWith("/uploads/")
                                    ? "bg-green-500"
                                    : "bg-orange-500"
                                }`}
                              >
                                {src.startsWith("/uploads/")
                                  ? "Uploadé"
                                  : "Google"}
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
                                if (imageUrl.startsWith("/uploads/")) {
                                  try {
                                    const response = await fetch(
                                      `/api/upload?path=${encodeURIComponent(imageUrl)}`,
                                      { method: "DELETE" }
                                    );
                                    if (!response.ok) {
                                      toast.error(
                                        "Erreur lors de la suppression du fichier"
                                      );
                                      return;
                                    }
                                  } catch (err) {
                                    console.error(
                                      "Erreur suppression fichier:",
                                      err
                                    );
                                    toast.error(
                                      "Erreur lors de la suppression du fichier"
                                    );
                                    return;
                                  }
                                }
                                setImages((prev) =>
                                  prev.filter((_, idx) => idx !== i)
                                );
                                toast.success("Image supprimée");
                              }}
                            >
                              {isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "×"
                              )}
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
                          <Input
                            placeholder="Titre optimisé…"
                            maxLength={60}
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

              {/* Horaires */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Horaires d&apos;ouverture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={hoursMode === "google" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHoursMode("google")}
                        disabled={isPending}
                      >
                        Horaires Google
                      </Button>
                      <Button
                        type="button"
                        variant={hoursMode === "manual" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHoursMode("manual")}
                        disabled={isPending}
                      >
                        Saisie manuelle
                      </Button>
                    </div>
                  </div>

                  {hoursMode === "google" && (
                    <div className="space-y-4">
                      {googlePlaceId ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div>
                              <p className="text-sm font-medium text-blue-900">
                                Place connectée à Google Business
                              </p>
                              <p className="text-xs text-blue-700">
                                Les horaires sont synchronisées automatiquement
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleFetchOpeningHours}
                              disabled={isFetchingHours || !isLoaded}
                              className="gap-2"
                            >
                              {isFetchingHours ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              Actualiser
                            </Button>
                          </div>

                          {/* Lecture seule des horaires */}
                          {openingHours.length > 0 && (
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
                                const d = openingHours.find(
                                  (h) => h.dayOfWeek === DAY
                                );
                                const isClosed =
                                  !d ||
                                  d.isClosed ||
                                  (d.slots?.length ?? 0) === 0;
                                return (
                                  <div
                                    key={DAY}
                                    className="flex justify-between py-1"
                                  >
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
                                    <span className="text-muted-foreground text-sm">
                                      {isClosed
                                        ? "Fermé"
                                        : d!.slots.map((s, i) => (
                                            <span key={i}>
                                              {s.openTime} – {s.closeTime}
                                              {i < d!.slots.length - 1
                                                ? " • "
                                                : ""}
                                            </span>
                                          ))}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Clock className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                                Aucune fiche Google Business trouvée
                              </h4>
                              <p className="text-xs text-yellow-800 mb-3">
                                Pour synchroniser automatiquement les horaires,
                                créez d&apos;abord une fiche Google Business
                                puis importez-la via la recherche Google.
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setHoursMode("manual")}
                                className="text-xs"
                              >
                                Saisir manuellement
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {hoursMode === "manual" && (
                    <div className="space-y-4">
                      {googlePlaceId && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800">
                            <strong>Recommandation :</strong> Modifiez plutôt
                            vos horaires directement sur{" "}
                            <a
                              href={`https://business.google.com/manage/places?q=${googlePlaceId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:no-underline"
                            >
                              Google Business Profile
                            </a>{" "}
                            puis utilisez le bouton &quot;Actualiser&quot; pour
                            éviter les incohérences.
                          </p>
                        </div>
                      )}

                      <OpeningHoursForm
                        value={openingHours}
                        onChange={setOpeningHours}
                        disabled={isPending}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

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
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      {mode === "create"
                        ? "Créer l’établissement"
                        : "Mettre à jour"}
                    </Button>

                    {mode === "edit" && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const googlePlaceId = form.getValues("googlePlaceId");
                            if (googlePlaceId) {
                              // Réimporter les données de l'établissement Google existant
                              startTransition(async () => {
                                try {
                                  toast.info("Réimportation des données Google en cours...");
                                  await getPlaceDetails(googlePlaceId);
                                } catch (error) {
                                  console.error("Erreur réimportation:", error);
                                  toast.error("Erreur lors de la réimportation des données Google");
                                }
                              });
                            } else {
                              // Pas d'établissement Google existant, afficher la recherche
                              setShowGoogleSearch(true);
                              toast.info("💡 Sélectionnez un établissement, puis réimportez les avis", {
                                duration: 5000
                              });
                            }
                          }}
                          className="w-full"
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Réimporter depuis Google
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => {
                            const placeId = (initialData as { id?: string })
                              ?.id;
                            if (!placeId) {
                              toast.error("ID de place manquant");
                              return;
                            }
                            startTransition(async () => {
                              try {
                                const response = await fetch(
                                  `/api/places/${placeId}/import-reviews`,
                                  { method: "POST" }
                                );
                                if (!response.ok) {
                                  let errorMessage = "Erreur lors de l'import";
                                  try {
                                    const err = await response.json();
                                    errorMessage = err.error || errorMessage;
                                  } catch {
                                    // réponse non-JSON (page d'erreur proxy)
                                  }
                                  throw new Error(errorMessage);
                                }
                                const result = await response.json();
                                toast.success(result.message);
                              } catch (error) {
                                console.error("Erreur import avis:", error);
                                toast.error(
                                  "Erreur lors de l'import des avis: " +
                                    (error instanceof Error
                                      ? error.message
                                      : "Erreur inconnue")
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

                  {/* Option admin : peut être revendiquée */}
                  {userRole === "admin" && (
                    <>
                      <div className="flex items-center justify-between">
                        <FormLabel htmlFor="createForClaim">
                          {mode === "create" ? "Créer pour revendication" : "Peut être revendiquée"}
                        </FormLabel>
                        <Switch
                          id="createForClaim"
                          checked={createForClaim}
                          onCheckedChange={setCreateForClaim}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {mode === "create"
                          ? "La fiche ne vous sera pas attribuée et pourra être revendiquée par un utilisateur"
                          : "Cocher pour retirer le propriétaire et permettre la revendication"
                        }
                      </p>
                      <Separator />
                    </>
                  )}

                  {/* Publication controls - Admin only */}
                  {userRole === "admin" && (
                    <>
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

                      <div className="flex items-center justify-between">
                        <FormLabel htmlFor="isFeatured">En vedette</FormLabel>
                        <FormField
                          control={form.control}
                          name="isFeatured"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  id="isFeatured"
                                  checked={!!field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Afficher cet établissement en vedette sur la page
                        d&apos;accueil
                      </p>
                    </>
                  )}

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
