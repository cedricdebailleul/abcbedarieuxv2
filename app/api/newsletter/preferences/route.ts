import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NewsletterFrequency } from "@/lib/generated/prisma/client";

const preferencesSchema = z.object({
  email: z.string().email("Email invalide"),
  preferences: z.object({
    events: z.boolean(),
    places: z.boolean(),
    offers: z.boolean(),
    news: z.boolean(),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  }),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, preferences } = preferencesSchema.parse(body);

    // Vérifier que l'abonné existe et est actif
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { preferences: true },
    });

    if (!subscriber || !subscriber.isActive) {
      return NextResponse.json(
        { error: "Abonnement non trouvé ou inactif" },
        { status: 404 }
      );
    }

    // Mettre à jour les préférences
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        preferences: {
          upsert: {
            create: {
              events: preferences.events,
              places: preferences.places,
              offers: preferences.offers,
              news: preferences.news,
              frequency: preferences.frequency as NewsletterFrequency,
            },
            update: {
              events: preferences.events,
              places: preferences.places,
              offers: preferences.offers,
              news: preferences.news,
              frequency: preferences.frequency as NewsletterFrequency,
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Préférences mises à jour avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la mise à jour des préférences:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
