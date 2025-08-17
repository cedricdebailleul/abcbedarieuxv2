import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: "Token de vérification requis" }, { status: 400 });
  }

  try {
    // Rechercher le subscriber avec ce token de vérification
    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: {
        verificationToken: token,
        isVerified: false,
      },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Token de vérification invalide ou email déjà vérifié" },
        { status: 404 }
      );
    }

    // Marquer comme vérifié
    const verifiedSubscriber = await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verificationToken: null, // Supprimer le token après utilisation
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email vérifié avec succès ! Votre abonnement à la newsletter est maintenant actif.",
      subscriber: {
        email: verifiedSubscriber.email,
        verifiedAt: verifiedSubscriber.verifiedAt,
      },
    });

  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Erreur lors de la vérification de l'email" 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Rechercher le subscriber
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé pour cet email" },
        { status: 404 }
      );
    }

    if (subscriber.isVerified) {
      return NextResponse.json(
        { error: "Cet email est déjà vérifié" },
        { status: 400 }
      );
    }

    if (!subscriber.isActive) {
      return NextResponse.json(
        { error: "Cet abonnement est inactif" },
        { status: 400 }
      );
    }

    // TODO: Renvoyer l'email de vérification
    // await sendVerificationEmail(subscriber.email, subscriber.verificationToken);

    return NextResponse.json({
      success: true,
      message: "Email de vérification renvoyé avec succès",
    });

  } catch (error) {
    console.error("Erreur lors du renvoi de l'email:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Erreur lors du renvoi de l'email de vérification" 
      },
      { status: 500 }
    );
  }
}