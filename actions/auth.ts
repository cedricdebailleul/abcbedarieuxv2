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

    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    if ("error" in result && result.error) {
      return {
        errors: { general: [(result.error as any).message] },
      };
    }

    redirect("/dashboard");
  } catch (error) {
    return {
      errors: { general: ["Erreur de connexion"] },
    };
  }
}
