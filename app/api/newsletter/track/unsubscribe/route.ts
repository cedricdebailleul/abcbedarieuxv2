import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = body;

    if (!token && !email) {
      return NextResponse.json(
        { error: "Token de désinscription ou email requis" },
        { status: 400 }
      );
    }

    try {
      let subscriber;

      if (token) {
        // Désabonnement par token (depuis un email)
        subscriber = await prisma.newsletterSubscriber.findFirst({
          where: {
            unsubscribeToken: token,
            isActive: true,
          },
        });

        if (!subscriber) {
          return NextResponse.json(
            { error: "Token de désinscription invalide ou expiré" },
            { status: 404 }
          );
        }
      } else if (email) {
        // Désabonnement par email (depuis le profil ou formulaire)
        subscriber = await prisma.newsletterSubscriber.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (!subscriber || !subscriber.isActive) {
          return NextResponse.json(
            { error: "Aucun abonnement actif trouvé pour cet email" },
            { status: 404 }
          );
        }
      }

      if (!subscriber) {
        return NextResponse.json(
          { error: "Abonnement non trouvé" },
          { status: 404 }
        );
      }

      // Marquer comme inactif au lieu de supprimer (conformité RGPD)
      const updatedSubscriber = await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: {
          isActive: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Vous avez été désabonné avec succès de notre newsletter.",
        subscriber: {
          email: updatedSubscriber.email,
          isActive: updatedSubscriber.isActive,
        },
      });
    } catch (prismaError: unknown) {
      if (
        prismaError instanceof Error &&
        prismaError.message.includes("newsletterSubscriber")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Le service de newsletter n'est pas encore disponible.",
            migrationRequired: true,
          },
          { status: 503 }
        );
      }
      throw prismaError;
    }
  } catch (error) {
    console.error("Erreur lors du désabonnement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Endpoint pour vérifier un token de désinscription
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: {
        unsubscribeToken: token,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        subscribedAt: true,
      },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Token de désinscription invalide" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriber: {
        email: subscriber.email,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        isActive: subscriber.isActive,
        subscribedAt: subscriber.subscribedAt,
      },
      isValid: true,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la vérification",
      },
      { status: 500 }
    );
  }
}
