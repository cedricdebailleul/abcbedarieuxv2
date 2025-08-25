"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { signUpAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { fadeInUp } from "@/lib/animations";
import { authClient } from "@/lib/auth-client";
import { CreateUserSchema, LoginSchema } from "@/types";
import { FormFieldWrapper } from "../ui/form-field";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof CreateUserSchema>>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      consentGiven: false,
    },
  });

  async function onSubmit(data: z.infer<typeof CreateUserSchema>) {
    setIsLoading(true);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    const result = await signUpAction(formData);

    if (result.errors) {
      Object.entries(result.errors).forEach(([field, messages]) => {
        if (field === "general") {
          toast.error(messages[0]);
        } else {
          form.setError(field as keyof z.infer<typeof CreateUserSchema>, {
            message: messages[0],
          });
        }
      });
    } else {
      toast.success(
        "Compte créé. Vérifiez votre email pour activer votre compte."
      );
    }

    setIsLoading(false);
  }

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormFieldWrapper form={form} name="name" label="Nom complet">
            <Input placeholder="John Doe" />
          </FormFieldWrapper>

          <FormFieldWrapper form={form} name="email" label="Email">
            <Input type="email" placeholder="john@example.com" />
          </FormFieldWrapper>

          <FormFieldWrapper form={form} name="password" label="Mot de passe">
            <Input type="password" placeholder="••••••••" />
          </FormFieldWrapper>

          <FormFieldWrapper
            form={form}
            name="consentGiven"
            label="Accepter les conditions"
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={form.watch("consentGiven")}
                onCheckedChange={(checked) =>
                  form.setValue("consentGiven", checked as boolean)
                }
              />
              <label className="text-sm">
                J&apos;accepte les{" "}
                <a href="/terms" className="underline">
                  conditions d&apos;utilisation
                </a>{" "}
                et la{" "}
                <a href="/privacy" className="underline">
                  politique de confidentialité
                </a>
              </label>
            </div>
          </FormFieldWrapper>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Création..." : "Créer un compte"}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof LoginSchema>) {
    setIsLoading(true);

    try {
      // Utiliser le client Better Auth directement
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        toast.error("Email ou mot de passe incorrect");
      } else {
        toast.success("Connexion réussie");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("LoginForm - Erreur lors de la connexion:", error);
      toast.error("Erreur lors de la connexion");
    }

    setIsLoading(false);
  }

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}
