"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { authClient } from "@/lib/auth-client";
import { AuthLayout } from "../_components/AuthLayout";

const formSchema = z.object({
  name: z.string().min(2, "Prénom requis"),
  surname: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
  rgpd: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les conditions RGPD.",
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      rgpd: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        callbackURL: "/dashboard",
      });

      toast.success("Compte créé. Vérifiez votre email et vous serez redirigé.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        `Erreur lors de l'inscription: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Rejoignez notre communauté"
      description="Créez votre compte pour accéder à tous les services de l'annuaire local."
      image="https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=1920&auto=format&fit=crop"
    >
      <Card className="border-0 shadow-none sm:border sm:shadow-lg">
        <CardHeader className="space-y-1 px-0 pb-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl text-center">Créer un compte</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            Remplissez le formulaire ci-dessous
          </p>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Jean" className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Dupont" className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jean@example.com" className="text-sm" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="text-sm" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rgpd"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="mt-1"
                          onChange={(e) => field.onChange(e.target.checked)}
                          checked={field.value}
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-xs sm:text-sm leading-relaxed">
                        J&apos;accepte la{" "}
                        <Link href="/privacy2" className="underline text-primary">
                          politique de confidentialité
                        </Link>{" "}
                        et les{" "}
                        <Link href="/privacy2" className="underline text-primary">
                          conditions d&apos;utilisation
                        </Link>
                        .
                      </FormLabel>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Création en cours..." : "Créer mon compte"}
              </Button>
            </form>
          </Form>

          <div className="text-center pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
