"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Save, Loader2 } from "lucide-react";
import {
  HistoryConfig,
  HistoryConfigFormData,
  HistoryConfigCreateSchema,
} from "@/lib/types/history";

interface HistoryConfigFormProps {
  config: HistoryConfig | null;
  onSave: (data: HistoryConfigFormData) => Promise<void>;
  saving: boolean;
}

export function HistoryConfigForm({
  config,
  onSave,
  saving,
}: HistoryConfigFormProps) {
  const form = useForm<HistoryConfigFormData>({
    resolver: zodResolver(
      HistoryConfigCreateSchema
    ) as Resolver<HistoryConfigFormData>,
    defaultValues: {
      title: config?.title || "Notre Histoire",
      subtitle: config?.subtitle || "",
      description: config?.description || "",
      heroImage: config?.heroImage || "",
      visionTitle: config?.visionTitle || "Et demain ?",
      visionDescription: config?.visionDescription || "",
      visionImage: config?.visionImage || "",
      primaryButtonText:
        config?.primaryButtonText || "Découvrir nos partenaires",
      primaryButtonUrl: config?.primaryButtonUrl || "/places",
      secondaryButtonText: config?.secondaryButtonText || "Nous rejoindre",
      secondaryButtonUrl: config?.secondaryButtonUrl || "/contact",
      isActive: config?.isActive ?? true,
    },
  });

  // Réinitialiser le formulaire quand la config change
  useEffect(() => {
    if (config) {
      form.reset({
        title: config.title,
        subtitle: config.subtitle || "",
        description: config.description || "",
        heroImage: config.heroImage || "",
        visionTitle: config.visionTitle || "Et demain ?",
        visionDescription: config.visionDescription || "",
        visionImage: config.visionImage || "",
        primaryButtonText:
          config.primaryButtonText || "Découvrir nos partenaires",
        primaryButtonUrl: config.primaryButtonUrl || "/places",
        secondaryButtonText: config.secondaryButtonText || "Nous rejoindre",
        secondaryButtonUrl: config.secondaryButtonUrl || "/contact",
        isActive: config.isActive,
      });
    }
  }, [config, form]);

  const onSubmit = async (data: HistoryConfigFormData) => {
    await onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section Hero */}
          <Card>
            <CardHeader>
              <CardTitle>Section principale</CardTitle>
              <CardDescription>
                Configuration du titre et de la présentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre principal</FormLabel>
                    <FormControl>
                      <Input placeholder="Notre Histoire" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sous-titre (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Notre parcours"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
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
                        placeholder="De l'idée initiale à la plateforme d'aujourd'hui..."
                        className="min-h-20"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Description qui apparaît sous le titre principal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heroImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image hero (URL)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://..."
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Image de fond pour la section principale
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section Vision */}
          <Card>
            <CardHeader>
              <CardTitle>Section vision</CardTitle>
              <CardDescription>
                &quot;Et demain ?&quot; - Vision pour l&apos;avenir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="visionTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre de la vision</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Et demain ?"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visionDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description de la vision</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ABC Bédarieux continue d'évoluer..."
                        className="min-h-20"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visionImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image vision (URL)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Image pour la section vision
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Section Boutons d'action */}
        <Card>
          <CardHeader>
            <CardTitle>Boutons d&apos;action</CardTitle>
            <CardDescription>
              Liens vers d&apos;autres pages depuis la page histoire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Bouton principal</h4>
                <FormField
                  control={form.control}
                  name="primaryButtonText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texte du bouton</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Découvrir nos partenaires"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryButtonUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL du bouton</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="/places"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Bouton secondaire</h4>
                <FormField
                  control={form.control}
                  name="secondaryButtonText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texte du bouton</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nous rejoindre"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryButtonUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL du bouton</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="/contact"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
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

        {/* Section Paramètres */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Configuration active
                    </FormLabel>
                    <FormDescription>
                      Activer cette configuration pour l&apos;affichage public
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

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-32">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
