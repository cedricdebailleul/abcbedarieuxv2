import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail, createVerificationEmailTemplate } from "@/lib/email";
import { checkRateLimit, createRateLimitResponse, getClientIP, newsletterSubscribeLimit } from "@/lib/rate-limit";
import { validateAndSanitize, subscribeSchema } from "@/lib/validation";
import { NewsletterFrequency } from "@/lib/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    // Vérifier le rate limiting en premier
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(newsletterSubscribeLimit, clientIP);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }
    
    const body = await request.json();
    
    // Validation et sanitisation des données
    let validatedData;
    try {
      validatedData = validateAndSanitize(subscribeSchema, body);
    } catch (error) {
      return NextResponse.json(
        { error: `Données invalides: ${error instanceof Error ? error.message : 'Erreur de validation'}` },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, preferences } = validatedData;

    try {
      // Vérifier si l'email existe déjà
      const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingSubscriber) {
        if (existingSubscriber.isActive) {
          return NextResponse.json(
            {
              error: "Cet email est déjà abonné à la newsletter",
              isAlreadySubscribed: true,
            },
            { status: 400 }
          );
        } else {
          // Réactiver l'abonnement existant
          const updatedSubscriber = await prisma.newsletterSubscriber.update({
            where: { id: existingSubscriber.id },
            data: {
              isActive: true,
              subscribedAt: new Date(),
              firstName: firstName?.trim() || existingSubscriber.firstName,
              lastName: lastName?.trim() || existingSubscriber.lastName,
              verificationToken: crypto.randomBytes(32).toString("hex"),
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
            include: { preferences: true },
          });

          return NextResponse.json({
            success: true,
            subscriber: updatedSubscriber,
            message: "Votre abonnement a été réactivé avec succès !",
          });
        }
      }

      // Créer les tokens de sécurité
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const unsubscribeToken = crypto.randomBytes(32).toString("hex");

      // Créer un nouvel abonnement
      const newSubscriber = await prisma.newsletterSubscriber.create({
        data: {
          email: email.toLowerCase().trim(),
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          verificationToken,
          unsubscribeToken,
          isActive: true,
          isVerified: false, // Nécessite une vérification email
          preferences: {
            create: {
              events: preferences.events,
              places: preferences.places,
              offers: preferences.offers,
              news: preferences.news,
              frequency: preferences.frequency as NewsletterFrequency,
            },
          },
        },
        include: { preferences: true },
      });

      // Envoyer un email de vérification
      const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
      const verificationUrl = `${baseUrl}/api/newsletter/verify?token=${verificationToken}`;
      
      const emailHtml = createVerificationEmailTemplate({
        verificationUrl,
        subscriberName: newSubscriber.firstName || undefined,
      });

      const emailResult = await sendEmail({
        to: newSubscriber.email,
        subject: "Confirmez votre abonnement à la newsletter ABC Bédarieux",
        html: emailHtml,
      });

      if (!emailResult.success) {
        console.error("Erreur envoi email de vérification:", emailResult.error);
        // Ne pas faire échouer l'inscription si l'email ne part pas
        // L'utilisateur peut toujours demander un renvoi
      }

      return NextResponse.json({
        success: true,
        subscriber: newSubscriber,
        message:
          "Inscription réussie ! Vous allez recevoir un email de confirmation.",
        requiresVerification: true,
      });
    } catch (prismaError: unknown) {
      // Si les tables n'existent pas encore (migration non effectuée)
      if (
        prismaError instanceof Error &&
        (prismaError.message?.includes("newsletterSubscriber") ||
          "code" in prismaError && prismaError.code === "P2021")
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Le service de newsletter n'est pas encore disponible. Veuillez réessayer plus tard.",
            migrationRequired: true,
          },
          { status: 503 }
        );
      }
      throw prismaError;
    }
  } catch (error) {
    console.error("Erreur lors de l'inscription à la newsletter:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur. Veuillez réessayer plus tard.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Endpoint pour vérifier le statut d'un email
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        isActive: true,
        isVerified: true,
        subscribedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      isSubscribed: !!subscriber?.isActive,
      isVerified: subscriber?.isVerified || false,
      subscribedAt: subscriber?.subscribedAt || null,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    return NextResponse.json(
      {
        success: false,
        isSubscribed: false,
        error: "Erreur lors de la vérification",
      },
      { status: 500 }
    );
  }
}
