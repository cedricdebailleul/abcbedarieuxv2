"use client";

import React, { useState } from "react";
import {
  useForm,
  type UseFormReturn,
  type Control,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Save, Loader2 } from "lucide-react";
import {
  HistoryTimelineEvent,
  HistoryTimelineEventFormData,
  HistoryTimelineEventCreateSchema,
  LUCIDE_ICONS,
  COLOR_CLASSES,
} from "@/lib/types/history";

interface TimelineEventFormProps {
  event: HistoryTimelineEvent | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: HistoryTimelineEventFormData) => Promise<void>;
}

export function TimelineEventForm({
  event,
  open,
  onClose,
  onSave,
}: TimelineEventFormProps) {
  const [saving, setSaving] = useState(false);

  const form = useForm<HistoryTimelineEventFormData>({
    resolver: zodResolver(
      HistoryTimelineEventCreateSchema
    ) as unknown as Resolver<HistoryTimelineEventFormData>,
    defaultValues: {
      year: event?.year || "",
      title: event?.title || "",
      description: event?.description || "",
      icon: event?.icon || "Calendar",
      color: event?.color || "bg-blue-100 text-blue-600",
      order: event?.order || 0,
      isActive: event?.isActive ?? true,
    },
  });

  // Réinitialiser le formulaire quand l'événement change
  React.useEffect(() => {
    if (event) {
      form.reset({
        year: event.year,
        title: event.title,
        description: event.description,
        icon: event.icon,
        color: event.color,
        order: event.order,
        isActive: event.isActive,
      });
    } else {
      form.reset({
        year: "",
        title: "",
        description: "",
        icon: "Calendar",
        color: "bg-blue-100 text-blue-600",
        order: 0,
        isActive: true,
      });
    }
  }, [event, form]);

  const onSubmit = async (data: HistoryTimelineEventFormData) => {
    setSaving(true);
    try {
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const getColorPreview = (colorClass: string) => {
    const bgColor = colorClass.split(" ")[0].replace("bg-", "");
    const colorMap: Record<string, string> = {
      "blue-100": "#dbeafe",
      "green-100": "#dcfce7",
      "purple-100": "#f3e8ff",
      "orange-100": "#fed7aa",
      "red-100": "#fee2e2",
      "pink-100": "#fce7f3",
      "yellow-100": "#fef3c7",
      "indigo-100": "#e0e7ff",
      "teal-100": "#ccfbf1",
      "gray-100": "#f3f4f6",
      "emerald-100": "#d1fae5",
      "cyan-100": "#cffafe",
      "rose-100": "#ffe4e6",
      "violet-100": "#ede9fe",
      "amber-100": "#fef3c7",
    };
    return colorMap[bgColor] || "#dbeafe";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {event ? "Modifier l'événement" : "Ajouter un événement"}
          </DialogTitle>
          <DialogDescription>
            {event
              ? "Modifiez les informations de cet événement de la chronologie"
              : "Créez un nouvel événement pour la chronologie"}
          </DialogDescription>
        </DialogHeader>

        <Form
          {...(form as unknown as UseFormReturn<HistoryTimelineEventFormData>)}
        >
          <form
            onSubmit={form.handleSubmit((data) =>
              onSubmit(data as unknown as HistoryTimelineEventFormData)
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={
                  form.control as unknown as Control<HistoryTimelineEventFormData>
                }
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année</FormLabel>
                    <FormControl>
                      <Input placeholder="2019" {...field} />
                    </FormControl>
                    <FormDescription>Année de l&apos;événement</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={
                  form.control as unknown as Control<HistoryTimelineEventFormData>
                }
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordre</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>Position d&apos;affichage</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={
                form.control as unknown as Control<HistoryTimelineEventFormData>
              }
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="L'idée prend forme" {...field} />
                  </FormControl>
                  <FormDescription>Titre de l&apos;événement</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={
                form.control as unknown as Control<HistoryTimelineEventFormData>
              }
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez l'événement marquant..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Description détaillée de l&apos;événement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={
                  form.control as unknown as Control<HistoryTimelineEventFormData>
                }
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icône</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une icône" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {LUCIDE_ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={
                  form.control as unknown as Control<HistoryTimelineEventFormData>
                }
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{
                                  backgroundColor: getColorPreview(
                                    field.value || ""
                                  ),
                                }}
                              />
                              <span className="capitalize">
                                {field.value
                                  ?.split("-")[0]
                                  ?.replace("bg-", "") || "Sélectionnez"}
                              </span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {COLOR_CLASSES.map((colorClass) => {
                          const colorName = colorClass
                            .split("-")[0]
                            .replace("bg-", "");
                          return (
                            <SelectItem key={colorClass} value={colorClass}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{
                                    backgroundColor:
                                      getColorPreview(colorClass),
                                  }}
                                />
                                <span className="capitalize">{colorName}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={
                form.control as unknown as Control<HistoryTimelineEventFormData>
              }
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Actif</FormLabel>
                    <FormDescription className="text-xs">
                      Afficher cet événement sur la page publique
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

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {event ? "Modifier" : "Créer"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
