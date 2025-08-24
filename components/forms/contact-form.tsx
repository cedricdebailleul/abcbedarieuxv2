"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const contactFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Le sujet est requis"),
  company: z.string().optional(),
  message: z.string().min(10, "Le message doit faire au moins 10 caractères"),
  consent: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter la politique de confidentialité",
  }),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      consent: false,
    },
  });

  const consentValue = watch("consent");

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Message envoyé avec succès !", {
          description: "Nous vous répondrons dans les plus brefs délais.",
        });
        reset();
      } else {
        const errorData = await response.json();
        toast.error("Erreur lors de l'envoi", {
          description: errorData.error || "Une erreur est survenue",
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur de connexion", {
        description: "Impossible d'envoyer le message. Réessayez plus tard.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input
            id="firstName"
            {...register("firstName")}
            placeholder="Votre prénom"
            className={errors.firstName ? "border-red-500" : ""}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            {...register("lastName")}
            placeholder="Votre nom"
            className={errors.lastName ? "border-red-500" : ""}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="votre.email@example.com"
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="06 12 34 56 78"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Sujet *</Label>
        <Input
          id="subject"
          {...register("subject")}
          placeholder="Objet de votre message"
          className={errors.subject ? "border-red-500" : ""}
        />
        {errors.subject && (
          <p className="text-sm text-red-500">{errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Entreprise / Établissement</Label>
        <Input
          id="company"
          {...register("company")}
          placeholder="Nom de votre entreprise (optionnel)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          {...register("message")}
          placeholder="Décrivez votre demande en détail..."
          className={`min-h-32 ${errors.message ? "border-red-500" : ""}`}
        />
        {errors.message && (
          <p className="text-sm text-red-500">{errors.message.message}</p>
        )}
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="consent"
          checked={consentValue}
          onCheckedChange={(checked) => setValue("consent", checked === true)}
          className={errors.consent ? "border-red-500" : ""}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="consent" className="text-sm font-normal cursor-pointer">
            J&apos;accepte que mes données personnelles soient utilisées pour
            répondre à ma demande conformément à notre{" "}
            <a
              href="/privacy2"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              politique de confidentialité
            </a>
            .
          </Label>
          {errors.consent && (
            <p className="text-sm text-red-500">{errors.consent.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          "Envoyer le message"
        )}
      </Button>
    </form>
  );
}