import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

import { z } from "zod";

import { headers } from "next/headers";
import { updateProfile } from "@/actions/profile";

const schema = z.object({
  firstname: z
    .string()
    .min(2, "Prénom requis")
    .regex(/^[A-Za-zÀ-ÿ\-\s]+$/, "Caractères non valides dans le prénom"),
  lastname: z
    .string()
    .min(2, "Nom requis")
    .regex(/^[A-Za-zÀ-ÿ\-\s]+$/, "Caractères non valides dans le nom"),
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateProfile(session.user.id, parsed.data);

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Erreur update profile:", error);
    return NextResponse.json(
      { error: "Erreur interne serveur" },
      { status: 500 }
    );
  }
}
