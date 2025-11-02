import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, createVerificationEmailTemplate } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token de vérification requis" },
      { status: 400 }
    );
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

    // Rediriger vers la page de confirmation
    return NextResponse.redirect(new URL("/newsletter/confirmed", request.url));
  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la vérification de l'email",
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
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
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

    // Renvoyer l'email de vérification
    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      process.env.NEXTAUTH_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const verificationUrl = `${baseUrl}/api/newsletter/verify?token=${subscriber.verificationToken}`;

    const emailHtml = createVerificationEmailTemplate({
      verificationUrl,
      subscriberName: subscriber.firstName || undefined,
    });

    const emailResult = await sendEmail({
      to: subscriber.email,
      subject: "Confirmez votre abonnement à la newsletter ABC Bédarieux",
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error(
        "Erreur envoi email de re-vérification:",
        emailResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de l'envoi de l'email de vérification",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email de vérification renvoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du renvoi de l'email:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors du renvoi de l'email de vérification",
      },
      { status: 500 }
    );
  }
}
