import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'abonnement newsletter de l'utilisateur
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: session.user.email },
      include: { preferences: true },
    });

    return NextResponse.json({
      success: true,
      subscriber,
      isSubscribed: !!subscriber?.isActive,
    });

  } catch (error) {
    console.error("Erreur lors de la récupération de l'abonnement:", error);
    return NextResponse.json(
      { 
        success: true,
        subscriber: null,
        isSubscribed: false,
        migrationRequired: true 
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { action, preferences = {} } = body;

    if (action === "subscribe") {
      // Vérifier si l'utilisateur est déjà abonné
      const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
        where: { email: session.user.email },
      });

      if (existingSubscriber) {
        // Réactiver l'abonnement et mettre à jour les préférences
        const updatedSubscriber = await prisma.newsletterSubscriber.update({
          where: { id: existingSubscriber.id },
          data: {
            isActive: true,
            preferences: {
              upsert: {
                create: {
                  events: preferences.events ?? true,
                  places: preferences.places ?? true,
                  offers: preferences.offers ?? false,
                  news: preferences.news ?? true,
                  frequency: preferences.frequency ?? "WEEKLY",
                },
                update: {
                  events: preferences.events ?? true,
                  places: preferences.places ?? true,
                  offers: preferences.offers ?? false,
                  news: preferences.news ?? true,
                  frequency: preferences.frequency ?? "WEEKLY",
                },
              },
            },
          },
          include: { preferences: true },
        });

        return NextResponse.json({
          success: true,
          subscriber: updatedSubscriber,
          message: "Abonnement réactivé avec succès",
        });
      }

      // Créer un nouvel abonnement
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');

      // Récupérer les infos du profil utilisateur
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true },
      });

      const newSubscriber = await prisma.newsletterSubscriber.create({
        data: {
          email: session.user.email,
          firstName: user?.profile?.firstname || session.user.name.split(' ')[0],
          lastName: user?.profile?.lastname || session.user.name.split(' ')[1] || '',
          verificationToken,
          unsubscribeToken,
          isActive: true,
          isVerified: true, // Auto-vérifié pour les utilisateurs connectés
          preferences: {
            create: {
              events: preferences.events ?? true,
              places: preferences.places ?? true,
              offers: preferences.offers ?? false,
              news: preferences.news ?? true,
              frequency: preferences.frequency ?? "WEEKLY",
            },
          },
        },
        include: { preferences: true },
      });

      return NextResponse.json({
        success: true,
        subscriber: newSubscriber,
        message: "Abonnement créé avec succès",
      });

    } else if (action === "unsubscribe") {
      // Désactiver l'abonnement
      const subscriber = await prisma.newsletterSubscriber.updateMany({
        where: { 
          email: session.user.email,
          isActive: true,
        },
        data: { isActive: false },
      });

      if (subscriber.count === 0) {
        return NextResponse.json(
          { error: "Aucun abonnement actif trouvé" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Désabonnement effectué avec succès",
      });

    } else if (action === "updatePreferences") {
      // Mettre à jour les préférences
      const subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { email: session.user.email },
        include: { preferences: true },
      });

      if (!subscriber) {
        return NextResponse.json(
          { error: "Aucun abonnement trouvé" },
          { status: 404 }
        );
      }

      const updatedSubscriber = await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: {
          preferences: {
            update: {
              events: preferences.events ?? subscriber.preferences?.events ?? true,
              places: preferences.places ?? subscriber.preferences?.places ?? true,
              offers: preferences.offers ?? subscriber.preferences?.offers ?? false,
              news: preferences.news ?? subscriber.preferences?.news ?? true,
              frequency: preferences.frequency ?? subscriber.preferences?.frequency ?? "WEEKLY",
            },
          },
        },
        include: { preferences: true },
      });

      return NextResponse.json({
        success: true,
        subscriber: updatedSubscriber,
        message: "Préférences mises à jour avec succès",
      });
    }

    return NextResponse.json(
      { error: "Action non supportée" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Erreur lors de la gestion de l'abonnement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}