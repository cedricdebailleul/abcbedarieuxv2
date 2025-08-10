"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  firstname: z
    .string()
    .min(2, "Prénom requis")
    .regex(/^[A-Za-zÀ-ÿ\-\s]+$/, "Caractères non valides dans le prénom"),
  lastname: z
    .string()
    .min(2, "Nom requis")
    .regex(/^[A-Za-zÀ-ÿ\-\s]+$/, "Caractères non valides dans le nom"),
});

type FormData = z.infer<typeof formSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstname: "", lastname: "" },
  });

  useEffect(() => {
    authClient.getSession().then(async (session) => {
      if (!session?.data?.user?.id) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/profile/me");
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.firstname && data.profile?.lastname) {
            router.push("/dashboard");
            return;
          }
        }
      } catch {
        toast.error("Erreur lors de la vérification du profil.");
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Profil mis à jour !");
        router.push("/dashboard");
      } else {
        throw new Error("Échec de la mise à jour du profil");
      }
    } catch {
      toast.error(
        "Erreur lors de la mise à jour du profil. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4">Complétons votre profil</h1>
      <p className="text-sm text-gray-500 mb-6">
        Pour finaliser votre inscription, merci d’indiquer votre prénom et nom
        de famille.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="firstname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Jean"
                    {...field}
                    autoComplete="given-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de famille</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Dupont"
                    {...field}
                    autoComplete="family-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Valider
          </Button>
        </form>
      </Form>
    </div>
  );
}
