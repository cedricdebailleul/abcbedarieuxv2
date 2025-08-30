"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Save, Loader2} from "lucide-react";
import {
  HistoryMilestone,
  HistoryMilestoneFormData,
  HistoryMilestoneCreateSchema,
  LUCIDE_ICONS,
} from "@/lib/types/history";

interface MilestoneFormProps {
  milestone: HistoryMilestone | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: HistoryMilestoneFormData) => Promise<void>;
}

export function MilestoneForm({
  milestone,
  open,
  onClose,
  onSave,
}: MilestoneFormProps) {
  const [saving, setSaving] = useState(false);
  const form = useForm({
    resolver: zodResolver(HistoryMilestoneCreateSchema),
    defaultValues: {
      number: milestone?.number || "",
      label: milestone?.label || "",
      icon: milestone?.icon || "Calendar",
      order: milestone?.order || 0,
      isActive: milestone?.isActive ?? true,
    },
  });
  // Réinitialiser le formulaire quand le milestone change
  React.useEffect(() => {
    if (milestone) {
      form.reset({
        number: milestone.number,
        label: milestone.label,
        icon: milestone.icon,
        order: milestone.order,
        isActive: milestone.isActive,
      });
    } else {
      form.reset({
        number: "",
        label: "",
        icon: "Calendar",
        order: 0,
        isActive: true,
      });
    }
  }, [milestone, form]);

  const onSubmit = async (data: HistoryMilestoneFormData) => {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {milestone ? "Modifier l'étape clé" : "Ajouter une étape clé"}
          </DialogTitle>
          <DialogDescription>
            {milestone
              ? "Modifiez les informations de cette étape clé"
              : "Créez une nouvelle étape clé avec un chiffre marquant"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chiffre</FormLabel>
                    <FormControl>
                      <Input placeholder="2019, 200+, etc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Le chiffre affiché (ex: &quot;2019&quot;,
                      &quot;200+&quot;)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Libellé</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Année de création, Établissements partenaires, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Description du chiffre</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
                  <FormDescription>Icône Lucide à afficher</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Actif</FormLabel>
                    <FormDescription className="text-xs">
                      Afficher cette étape sur la page publique
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
                    {milestone ? "Modifier" : "Créer"}
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
