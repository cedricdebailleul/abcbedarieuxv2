import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Récupérer la configuration du chatbot
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const config = await prisma.whatsAppBotConfig.findFirst({
      include: {
        updatedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!config) {
      // Créer une configuration par défaut
      const defaultConfig = await prisma.whatsAppBotConfig.create({
        data: {
          isEnabled: false,
          welcomeMessage: "Bonjour ! Je suis l'assistant d'ABC Bédarieux. Comment puis-je vous aider ?",
          messages: {
            notFound: "Je n'ai pas trouvé ce que vous cherchez. Tapez 'aide' pour voir les options disponibles.",
            error: "Une erreur s'est produite. Veuillez réessayer plus tard.",
            maintenance: "Le service est temporairement indisponible. Veuillez réessayer plus tard."
          },
          flows: {
            welcome: {
              enabled: true,
              triggers: ["bonjour", "salut", "hello", "hi"],
              response: "default_welcome"
            },
            places: {
              enabled: true,
              triggers: ["lieux", "établissements", "commerces"],
              response: "places_menu"
            },
            events: {
              enabled: true,
              triggers: ["événements", "events"],
              response: "events_list"
            }
          },
          updatedBy: session.user.id
        },
        include: {
          updatedByUser: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      return NextResponse.json(defaultConfig);
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erreur lors de la récupération de la configuration:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour la configuration
export async function PUT(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Permissions administrateur requises" }, { status: 403 });
    }

    const body = await request.json();
    const { isEnabled, welcomeMessage, messages, flows, sessionTimeout, maxMessages } = body;

    // Validation des données
    if (typeof isEnabled !== "boolean") {
      return NextResponse.json({ error: "isEnabled doit être un booléen" }, { status: 400 });
    }

    if (!welcomeMessage || typeof welcomeMessage !== "string") {
      return NextResponse.json({ error: "Message de bienvenue requis" }, { status: 400 });
    }

    // Mise à jour de la configuration
    const existingConfig = await prisma.whatsAppBotConfig.findFirst();

    if (existingConfig) {
      const updatedConfig = await prisma.whatsAppBotConfig.update({
        where: { id: existingConfig.id },
        data: {
          isEnabled,
          welcomeMessage,
          messages: messages || existingConfig.messages,
          flows: flows || existingConfig.flows,
          sessionTimeout: sessionTimeout || existingConfig.sessionTimeout,
          maxMessages: maxMessages || existingConfig.maxMessages,
          updatedBy: session.user.id
        },
        include: {
          updatedByUser: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      return NextResponse.json(updatedConfig);
    } else {
      // Créer nouvelle configuration
      const newConfig = await prisma.whatsAppBotConfig.create({
        data: {
          isEnabled,
          welcomeMessage,
          messages: messages || {},
          flows: flows || {},
          sessionTimeout: sessionTimeout || 3600,
          maxMessages: maxMessages || 100,
          updatedBy: session.user.id
        },
        include: {
          updatedByUser: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      return NextResponse.json(newConfig);
    }

  } catch (error) {
    console.error("Erreur lors de la mise à jour de la configuration:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}