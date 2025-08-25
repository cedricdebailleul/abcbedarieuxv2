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
import { Package, Plus, X, Save } from "lucide-react";
import { ImageUpload } from "@/components/media/image-upload";
import Image from "next/image";

const productFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Maximum 100 caractères"),
  description: z.string().optional(),
  summary: z.string().max(280, "Maximum 280 caractères").optional(),
  price: z.number().min(0, "Le prix doit être positif").optional(),
  priceType: z.enum(['FIXED', 'VARIABLE', 'ON_REQUEST', 'FREE']).default('FIXED'),
  currency: z.string().default('EUR'),
  unit: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'DISCONTINUED', 'ARCHIVED']).default('DRAFT'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  stock: z.number().int().min(0).optional(),
  minQuantity: z.number().int().min(1).default(1).optional(),
  maxQuantity: z.number().int().min(1).optional(),
  category: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

const priceTypes = [
  { value: 'FIXED', label: 'Prix fixe' },
  { value: 'VARIABLE', label: 'Prix variable' },
  { value: 'ON_REQUEST', label: 'Sur demande' },
  { value: 'FREE', label: 'Gratuit' },
];

const statuses = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'PUBLISHED', label: 'Publié' },
  { value: 'OUT_OF_STOCK', label: 'Rupture de stock' },
  { value: 'DISCONTINUED', label: 'Arrêté' },
  { value: 'ARCHIVED', label: 'Archivé' },
];

interface ProductFormProps {
  placeId: string;
  placeName?: string;
  initialData?: Partial<ProductFormData & { id?: string }>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export function ProductForm({
  placeId,
  placeName,
  initialData,
  onSuccess,
  onCancel,
  isEditing = false,
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>(
    initialData?.tags ? initialData.tags.split(',').map(tag => tag.trim()) : []
  );
  const [newTag, setNewTag] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>(() => {
    const imgs = initialData?.images as unknown;
    if (typeof imgs === "string") {
      try {
        return JSON.parse(imgs) as string[];
      } catch {
        return [];
      }
    }
    if (Array.isArray(imgs)) {
      return imgs as string[];
    }
    return [];
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormData, unknown>,
    defaultValues: {
      name: '',
      description: '',
      summary: '',
      price: undefined,
      priceType: 'FIXED',
      currency: 'EUR',
      unit: '',
      status: 'DRAFT',
      isActive: true,
      isFeatured: false,
      isAvailable: true,
      stock: undefined,
      minQuantity: 1,
      maxQuantity: undefined,
      category: '',
      tags: '',
      coverImage: '',
      images: [],
      metaTitle: '',
      metaDescription: '',
      ...initialData,
    },
  });

  const priceType = form.watch('priceType');
  const showPrice = priceType !== 'FREE' && priceType !== 'ON_REQUEST';

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      form.setValue('tags', updatedTags.join(', '));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    form.setValue('tags', updatedTags.join(', '));
  };

  async function onSubmit(data: ProductFormData) {
    setIsSubmitting(true);

    try {
      const url = isEditing 
        ? `/api/products/${initialData?.id}`
        : `/api/places/${placeId}/products`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tags: tags.length > 0 ? tags : undefined,
          images: galleryImages.length > 0 ? JSON.stringify(galleryImages) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur lors de ${isEditing ? 'la modification' : 'la création'} du produit`);
      }

      toast.success(`Produit ${isEditing ? 'modifié' : 'créé'} avec succès !`);
      
      if (!isEditing) {
        form.reset();
        setTags([]);
        setGalleryImages([]);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la création du produit. Veuillez réessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Ajouter un produit
          {placeName && (
            <Badge variant="outline" className="ml-2">
              {placeName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12 pb-8">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations générales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du produit *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: T-shirt ABC Bédarieux" {...field} />
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
                        <Input placeholder="Ex: Vêtements, Accessoires..." {...field} />
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
                        placeholder="Description détaillée du produit, ses caractéristiques, son utilisation..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Images</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel>Image de couverture</FormLabel>
                      <FormControl>
                        <div className="w-full">
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            onRemove={() => field.onChange('')}
                            type="places"
                            slug={placeName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'default'}
                            subFolder="produits"
                            imageType="cover"
                            showPreview
                            showCrop
                            aspectRatios={[
                              { label: "16:9", value: 16/9 },
                              { label: "4:3", value: 4/3 },
                              { label: "1:1", value: 1 },
                            ]}
                            maxSize={5}
                            className="w-full"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Image principale qui apparaîtra en premier sur la fiche produit (max 5MB)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel>Galerie d&apos;images</FormLabel>
                  
                  {/* Images existantes */}
                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {galleryImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={image}
                            alt={`Galerie ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md border"
                            width={300}
                            height={100}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newImages = galleryImages.filter((_, i) => i !== index);
                              setGalleryImages(newImages);
                              form.setValue('images', newImages);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Bouton d'ajout d'image */}
                  <div className="w-full">
                    <ImageUpload
                      value=""
                      onChange={(url) => {
                        const newImages = [...galleryImages, url];
                        setGalleryImages(newImages);
                        form.setValue('images', newImages);
                      }}
                      type="places"
                      slug={placeName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'default'}
                      subFolder="produits"
                      imageType="gallery"
                      showPreview={false}
                      className="w-full min-h-[6rem] border-dashed border-2 border-muted-foreground/25 rounded-md flex items-center justify-center hover:border-muted-foreground/50 transition-colors"
                      maxSize={5}
                    />
                  </div>
                  
                  <FormDescription>
                    Ajoutez plusieurs images pour montrer différents angles du produit (max 5MB par image)
                  </FormDescription>
                </div>
              </div>
            </div>

            <div className="border-t pt-6" />

            {/* Prix et disponibilité */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Prix et disponibilité</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="priceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de prix</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
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
                        <Input placeholder="Ex: /pièce, /kg, /m²" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock disponible</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Quantité en stock"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantité minimum</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantité maximum</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Optionnel"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-6" />

            {/* Tags et catégorisation */}
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
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t pt-6" />

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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          Le produit est visible et disponible
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
                        <FormLabel className="text-base">Produit vedette</FormLabel>
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
                          Le produit peut être commandé
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

            <div className="border-t pt-6" />

            {/* SEO (Optionnel) */}
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Création...' : 'Créer le produit'}
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