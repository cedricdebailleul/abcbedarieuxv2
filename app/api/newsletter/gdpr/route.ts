import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, action } = body;

    if (!email || !action) {
      return NextResponse.json(
        { error: "Email et action requis" },
        { status: 400 }
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }

    try {
      const subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { preferences: true },
      });

      if (!subscriber) {
        return NextResponse.json(
          { error: "Aucune donnée trouvée pour cet email" },
          { status: 404 }
        );
      }

      switch (action) {
        case "export":
          // Exporter toutes les données de l'utilisateur
          const userData = {
            email: subscriber.email,
            firstName: subscriber.firstName,
            lastName: subscriber.lastName,
            isActive: subscriber.isActive,
            subscribedAt: subscriber.subscribedAt,
            isVerified: subscriber.isVerified,
            lastEmailSent: subscriber.lastEmailSent,
            preferences: subscriber.preferences
              ? {
                  events: subscriber.preferences.events,
                  places: subscriber.preferences.places,
                  offers: subscriber.preferences.offers,
                  news: subscriber.preferences.news,
                  frequency: subscriber.preferences.frequency,
                }
              : null,
          };

          return NextResponse.json({
            success: true,
            message: "Données exportées avec succès",
            data: userData,
            exportedAt: new Date().toISOString(),
          });

        case "delete":
          // Supprimer définitivement toutes les données
          // D'abord supprimer les préférences
          if (subscriber.preferences) {
            await prisma.newsletterPreferences.delete({
              where: { subscriberId: subscriber.id },
            });
          }

          // Puis supprimer l'abonné
          await prisma.newsletterSubscriber.delete({
            where: { id: subscriber.id },
          });

          return NextResponse.json({
            success: true,
            message: "Toutes vos données ont été supprimées définitivement",
            deletedAt: new Date().toISOString(),
          });

        case "anonymize":
          // Anonymiser les données en gardant seulement les statistiques
          await prisma.newsletterSubscriber.update({
            where: { id: subscriber.id },
            data: {
              email: `anonymized_${subscriber.id}@deleted.local`,
              firstName: null,
              lastName: null,
              isActive: false,
              verificationToken: null,
              unsubscribeToken: null,
            },
          });

          return NextResponse.json({
            success: true,
            message: "Vos données personnelles ont été anonymisées",
            anonymizedAt: new Date().toISOString(),
          });

        default:
          return NextResponse.json(
            {
              error:
                "Action non supportée. Actions disponibles: export, delete, anonymize",
            },
            { status: 400 }
          );
      }
    } catch (prismaError: unknown) {
      if (
        typeof prismaError === "object" &&
        prismaError !== null &&
        "message" in prismaError &&
        typeof (prismaError as { message?: string }).message === "string" &&
        (prismaError as { message: string }).message.includes(
          "newsletterSubscriber"
        )
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
    console.error("Erreur lors de la demande RGPD:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Endpoint pour récupérer les informations de conformité RGPD
  return NextResponse.json({
    success: true,
    info: {
      dataController: "Association Bédaricienne des Commerçants (ABC)",
      purpose: "Envoi de newsletters et communication commerciale",
      legalBasis: "Consentement (Art. 6(1)(a) RGPD)",
      retention:
        "Les données sont conservées tant que l'abonnement est actif. Après désinscription, les données sont conservées 3 ans puis supprimées automatiquement.",
      rights: [
        "Droit d'accès à vos données",
        "Droit de rectification",
        "Droit à l'effacement (droit à l'oubli)",
        "Droit à la portabilité des données",
        "Droit d'opposition au traitement",
        "Droit de retrait du consentement",
      ],
      contact: {
        email: "dpo@abc-bedarieux.fr",
        address: "Association ABC, Bédarieux, France",
      },
      availableActions: [
        {
          action: "export",
          description:
            "Exporter toutes vos données personnelles au format JSON",
        },
        {
          action: "delete",
          description: "Supprimer définitivement toutes vos données",
        },
        {
          action: "anonymize",
          description:
            "Anonymiser vos données personnelles (conserve les statistiques anonymes)",
        },
      ],
    },
  });
}
