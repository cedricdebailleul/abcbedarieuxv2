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
import { Tag, Save, Calendar, Percent } from "lucide-react";

const offerFormSchema = z
  .object({
    title: z
      .string()
      .min(1, "Le titre est requis")
      .max(100, "Maximum 100 caractères"),
    description: z.string().optional(),
    summary: z.string().max(280, "Maximum 280 caractères").optional(),
    type: z
      .enum([
        "DISCOUNT",
        "FREEBIE",
        "BUNDLE",
        "LOYALTY",
        "SEASONAL",
        "LIMITED_TIME",
      ])
      .default("DISCOUNT"),
    discountType: z
      .enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING", "BUY_X_GET_Y"])
      .default("PERCENTAGE"),
    discountValue: z.number().min(0, "La valeur doit être positive"),
    discountMaxAmount: z.number().min(0).optional(),
    minimumPurchase: z.number().min(0).optional(),
    status: z
      .enum(["DRAFT", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"])
      .default("DRAFT"),
    isActive: z.boolean().default(true),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    maxUses: z.number().int().min(1).optional(),
    maxUsesPerUser: z.number().int().min(1).default(1).optional(),
    code: z.string().optional(),
    requiresCode: z.boolean().default(false),
    metaTitle: z.string().optional(),
    metaDescription: z.string().max(160).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["endDate"],
    }
  );

type OfferFormData = z.infer<typeof offerFormSchema>;

const offerTypes = [
  { value: "DISCOUNT", label: "Réduction" },
  { value: "FREEBIE", label: "Produit gratuit" },
  { value: "BUNDLE", label: "Pack / Bundle" },
  { value: "LOYALTY", label: "Programme fidélité" },
  { value: "SEASONAL", label: "Offre saisonnière" },
  { value: "LIMITED_TIME", label: "Durée limitée" },
];

const discountTypes = [
  { value: "PERCENTAGE", label: "Pourcentage" },
  { value: "FIXED_AMOUNT", label: "Montant fixe" },
  { value: "FREE_SHIPPING", label: "Livraison gratuite" },
  { value: "BUY_X_GET_Y", label: "Achetez X obtenez Y" },
];

const statuses = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "En pause" },
  { value: "EXPIRED", label: "Expirée" },
  { value: "ARCHIVED", label: "Archivée" },
];

interface OfferFormProps {
  placeId: string;
  placeName?: string;
  initialData?: Partial<OfferFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OfferForm({
  placeId,
  placeName,
  initialData,
  onSuccess,
  onCancel,
}: OfferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(
      offerFormSchema
    ) as unknown as Resolver<OfferFormData>,
    defaultValues: {
      title: "",
      description: "",
      summary: "",
      type: "DISCOUNT",
      discountType: "PERCENTAGE",
      discountValue: 10,
      discountMaxAmount: undefined,
      minimumPurchase: undefined,
      status: "DRAFT",
      isActive: true,
      startDate: "",
      endDate: "",
      maxUses: undefined,
      maxUsesPerUser: 1,
      code: "",
      requiresCode: false,
      metaTitle: "",
      metaDescription: "",
      ...initialData,
    },
  });

  const discountType = form.watch("discountType");
  const requiresCode = form.watch("requiresCode");

  // Générer un code aléatoire
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("code", result);
  };

  async function onSubmit(data: OfferFormData) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/places/${placeId}/offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la création de l'offre"
        );
      }

      toast.success("Offre créée avec succès !");
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la création de l'offre:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de l'offre. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-orange-600" />
          Créer une offre
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
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre de l&apos;offre *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: -20% sur tous les produits"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d&apos;offre</FormLabel>
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
                          {offerTypes.map((type) => (
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
              </div>

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Résumé court</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Description courte de l'offre (280 caractères max)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Utilisé dans les listes et aperçus
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
                    <FormLabel>Description détaillée</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conditions d'utilisation, restrictions, détails de l'offre..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Configuration de la réduction */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Configuration de la réduction
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de réduction</FormLabel>
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
                          {discountTypes.map((type) => (
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

                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Valeur de réduction *
                        {discountType === "PERCENTAGE" && " (%)"}
                        {discountType === "FIXED_AMOUNT" && " (€)"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step={discountType === "PERCENTAGE" ? "1" : "0.01"}
                            min="0"
                            max={
                              discountType === "PERCENTAGE" ? "100" : undefined
                            }
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                          {discountType === "PERCENTAGE" && (
                            <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {discountType === "PERCENTAGE" && (
                <FormField
                  control={form.control}
                  name="discountMaxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant maximum de réduction (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Optionnel - Ex: 50 pour limiter à 50€ max"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              parseFloat(e.target.value) || undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Limite la réduction en pourcentage à un montant maximum
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="minimumPurchase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant minimum d&apos;achat (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Optionnel - Ex: 25 pour un panier minimum de 25€"
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
            </div>

            {/* Période de validité */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Période de validité
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>
                        Laisser vide pour commencer immédiatement
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
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>
                        Laisser vide pour une offre permanente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Limitations d'usage */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Limitations d&apos;usage</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxUses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre maximum d&apos;utilisations</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Optionnel - Ex: 100"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              parseInt(e.target.value) || undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Limite le nombre total d&apos;utilisations de
                        l&apos;offre
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxUsesPerUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Utilisations par utilisateur</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Nombre de fois qu&apos;un même utilisateur peut utiliser
                        l&apos;offre
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Code promotionnel */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Code promotionnel</h3>

              <FormField
                control={form.control}
                name="requiresCode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Code promotionnel requis
                      </FormLabel>
                      <FormDescription>
                        L&apos;utilisateur doit saisir un code pour bénéficier
                        de l&apos;offre
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

              {requiresCode && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code promotionnel</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ex: SOLDES2024"
                            className="uppercase"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateCode}
                          >
                            Générer
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Le code sera requis pour activer l&apos;offre
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Statut */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Statut</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut de l&apos;offre</FormLabel>
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

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Offre active</FormLabel>
                      <FormDescription>
                        L&apos;offre est visible et utilisable
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
                {isSubmitting ? "Création..." : "Créer l'offre"}
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
