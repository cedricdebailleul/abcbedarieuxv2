"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreateUserSchema, LoginSchema } from "@/types";

export async function signUpAction(formData: FormData) {
  const validatedFields = CreateUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    consentGiven: formData.get("consentGiven") === "on",
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { email, name, password } = validatedFields.data;

    const result = await auth.api.signUpEmail({
      body: {
        email,
        name,
        password,
      },
    });

    if ("error" in result && result.error) {
      return {
        errors: { general: [(result.error as any).message] },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      errors: { general: ["Une erreur est survenue"] },
    };
  }
}

export async function signInAction(formData: FormData) {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { email, password } = validatedFields.data;

    console.log("Tentative de connexion pour:", email);

    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    console.log("Résultat signInEmail:", {
      hasError: "error" in result && !!result.error,
      error: "error" in result ? result.error : null
    });

    if ("error" in result && result.error) {
      console.log("Erreur de connexion:", result.error);
      return {
        errors: { general: [(result.error as any).message || "Identifiants incorrects"] },
      };
    }

    console.log("Connexion réussie - Better Auth signInEmail terminé");
    
    // Retourner le succès au lieu de rediriger - laisser le client gérer
    return { success: true, redirect: "/dashboard" };
  } catch (error) {
    // Si c'est une redirection Next.js (connexion réussie), la relancer
    if ((error as any).message === "NEXT_REDIRECT") {
      throw error;
    }
    
    console.error("Erreur lors de la connexion:", error);
    return {
      errors: { general: ["Erreur de connexion"] },
    };
  }
}
