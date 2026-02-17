import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { headers } from "next/headers";
import crypto from "crypto";
import type { Prisma } from "@/lib/generated/prisma/client";

// Configuration WhatsApp Business API
const VERIFY_TOKEN = env.WHATSAPP_VERIFY_TOKEN;
const WEBHOOK_SECRET = env.WHATSAPP_WEBHOOK_SECRET;

// Vérification du webhook (required par WhatsApp)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  
  console.log("🔐 Webhook verification attempt:", { mode, token: token ? "***" : "none" });
  
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully");
    return new Response(challenge);
  } else {
    console.log("❌ Webhook verification failed");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

// Réception des messages WhatsApp
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get("x-hub-signature-256");
    
    if (!signature && WEBHOOK_SECRET) {
      return NextResponse.json({ error: "No signature" }, { status: 401 });
    }

    const body = await request.text();
    
    // Vérification de la signature (si configurée)
    if (WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(body, "utf8")
        .digest("hex");
      
      const receivedSignature = signature.replace("sha256=", "");
      
      if (expectedSignature !== receivedSignature) {
        console.log("❌ Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    console.log("📥 WhatsApp webhook received:", JSON.stringify(data, null, 2));

    // Traitement des messages entrants
    if (data?.entry?.[0]?.changes?.[0]?.value?.messages) {
      const messages = data.entry[0].changes[0].value.messages;
      const contacts = data.entry[0].changes[0].value.contacts || [];
      
      for (const message of messages) {
        await processIncomingMessage(message, contacts);
      }
    }

    // Traitement des statuts de messages
    if (data?.entry?.[0]?.changes?.[0]?.value?.statuses) {
      const statuses = data.entry[0].changes[0].value.statuses;
      
      for (const status of statuses) {
        await processMessageStatus(status);
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("❌ WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Types pour les messages WhatsApp
interface WhatsAppContact {
  wa_id: string;
  profile?: {
    name?: string;
  };
}

interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  text?: {
    body: string;
  };
  image?: {
    id: string;
    caption?: string;
  };
  audio?: {
    id: string;
  };
  video?: {
    id: string;
    caption?: string;
  };
  document?: {
    id: string;
    filename: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    name?: {
      formatted_name?: string;
    };
  }>;
}

interface WhatsAppStatus {
  id: string;
  status: string;
}

// Traitement d'un message entrant
async function processIncomingMessage(message: WhatsAppMessage, contacts: WhatsAppContact[]) {
  try {
    const phoneNumber = message.from;
    const messageId = message.id;
    const timestamp = new Date(parseInt(message.timestamp) * 1000);
    
    // Récupération du nom du contact
    const contact = contacts.find(c => c.wa_id === phoneNumber);
    const contactName = contact?.profile?.name || null;

    console.log(`📱 Processing message from ${phoneNumber} (${contactName || 'Unknown'})`);

    // Création ou mise à jour de la conversation
    const conversation = await prisma.whatsAppConversation.upsert({
      where: { phoneNumber },
      update: { 
        lastMessage: timestamp,
        name: contactName || undefined
      },
      create: {
        phoneNumber,
        name: contactName,
        lastMessage: timestamp
      }
    });

    // Extraction du contenu selon le type de message
    let content = "";
    let messageType = "TEXT";
    let metadata: Record<string, unknown> = {};

    if (message.text) {
      content = message.text.body;
      messageType = "TEXT";
    } else if (message.image) {
      content = message.image.caption || "Image reçue";
      messageType = "IMAGE";
      metadata = { mediaId: message.image.id };
    } else if (message.audio) {
      content = "Message vocal reçu";
      messageType = "AUDIO";
      metadata = { mediaId: message.audio.id };
    } else if (message.video) {
      content = message.video.caption || "Vidéo reçue";
      messageType = "VIDEO";
      metadata = { mediaId: message.video.id };
    } else if (message.document) {
      content = `Document reçu: ${message.document.filename}`;
      messageType = "DOCUMENT";
      metadata = { mediaId: message.document.id, filename: message.document.filename };
    } else if (message.location) {
      content = `Localisation: ${message.location.latitude}, ${message.location.longitude}`;
      messageType = "LOCATION";
      metadata = {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
        name: message.location.name,
        address: message.location.address
      };
    } else if (message.contacts) {
      content = `Contact partagé: ${message.contacts[0]?.name?.formatted_name}`;
      messageType = "CONTACT";
      metadata = { contacts: message.contacts };
    }

    // Sauvegarde du message
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        messageId,
        content,
        messageType: messageType as "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" | "LOCATION" | "CONTACT",
        isFromBot: false,
        status: "DELIVERED",
        metadata: metadata as Prisma.InputJsonValue,
        createdAt: timestamp
      }
    });

    console.log(`💾 Message saved: ${content.substring(0, 50)}...`);

    // Traitement du bot
    await processBotResponse(phoneNumber, content, messageType, metadata);

  } catch (error) {
    console.error("❌ Error processing incoming message:", error);
  }
}

// Traitement du statut d'un message
async function processMessageStatus(status: WhatsAppStatus) {
  try {
    const messageId = status.id;
    const newStatus = status.status.toUpperCase();
    
    await prisma.whatsAppMessage.updateMany({
      where: { messageId },
      data: { status: newStatus as "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED" | "EXPIRED" }
    });

    console.log(`📋 Message status updated: ${messageId} -> ${newStatus}`);
  } catch (error) {
    console.error("❌ Error processing message status:", error);
  }
}

// Types pour les sessions et configuration
interface BotSession {
  id: string;
  phoneNumber: string;
  currentFlow: string | null;
  currentStep: string | null;
  context: Record<string, unknown> | null;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface BotConfig {
  id: string;
  isEnabled: boolean;
  welcomeMessage: string;
  messages: Record<string, string>;
  flows: Record<string, unknown>;
  sessionTimeout: number;
  maxMessages: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

// Traitement de la réponse du bot
async function processBotResponse(phoneNumber: string, content: string, messageType: string, metadata: Record<string, unknown>) {
  try {
    // Récupération ou création de la session bot
    const session = await prisma.whatsAppBotSession.upsert({
      where: { phoneNumber },
      update: {
        expiresAt: new Date(Date.now() + 3600000), // 1 heure
        updatedAt: new Date()
      },
      create: {
        phoneNumber,
        expiresAt: new Date(Date.now() + 3600000)
      }
    });

    // Récupération de la configuration du bot
    const config = await prisma.whatsAppBotConfig.findFirst({
      where: { isEnabled: true }
    });

    if (!config) {
      console.log("🤖 Bot is disabled or not configured");
      return;
    }

    // Analyse du message et génération de la réponse
    const botSession: BotSession = {
      id: session.id,
      phoneNumber: session.phoneNumber,
      currentFlow: session.currentFlow,
      currentStep: session.currentStep,
      context: session.context as Record<string, unknown> | null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive
    };
    const botConfig: BotConfig = {
      id: config.id,
      isEnabled: config.isEnabled,
      welcomeMessage: config.welcomeMessage,
      messages: config.messages as Record<string, string>,
      flows: config.flows as Record<string, unknown>,
      sessionTimeout: config.sessionTimeout,
      maxMessages: config.maxMessages,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      updatedBy: config.updatedBy
    };
    const response = await generateBotResponse(content, messageType, metadata, botSession, botConfig);
    
    if (response) {
      await sendWhatsAppMessage(phoneNumber, response);
    }

  } catch (error) {
    console.error("❌ Error processing bot response:", error);
  }
}

// Génération de la réponse du bot
async function generateBotResponse(
  content: string, 
  messageType: string, 
  metadata: Record<string, unknown>, 
  session: BotSession, 
  config: BotConfig
): Promise<string | null> {
  
  const lowerContent = content.toLowerCase().trim();

  // Messages de bienvenue
  if (!session.currentFlow && (lowerContent.includes("bonjour") || lowerContent.includes("salut") || lowerContent.includes("hello"))) {
    return `${config.welcomeMessage}

🏢 Tapez "lieux" pour découvrir nos établissements
📅 Tapez "événements" pour voir les prochains événements  
🗺️ Tapez "carte" pour voir la carte interactive
ℹ️ Tapez "aide" pour plus d'options`;
  }

  // Navigation principale
  if (lowerContent.includes("lieu") || lowerContent.includes("établissement") || lowerContent.includes("commerce")) {
    await prisma.whatsAppBotSession.update({
      where: { phoneNumber: session.phoneNumber },
      data: { 
        currentFlow: "search_places",
        currentStep: "category_selection"
      }
    });

    return `🏢 Découvrez nos établissements !

Tapez le numéro de votre choix :
1️⃣ Restaurants & Bars
2️⃣ Commerces & Services  
3️⃣ Loisirs & Culture
4️⃣ Associations
5️⃣ Tous les établissements

Ou tapez le nom d'un établissement directement.`;
  }

  if (lowerContent.includes("événement") || lowerContent.includes("event")) {
    const upcomingEvents = await getUpcomingEvents();
    
    if (upcomingEvents.length === 0) {
      return "📅 Aucun événement programmé pour le moment. Suivez-nous pour être informé des prochaines actualités !";
    }

    let response = "📅 **Prochains événements :**\n\n";
    upcomingEvents.slice(0, 5).forEach((event, index) => {
      const date = new Date(event.startDate).toLocaleDateString('fr-FR');
      response += `${index + 1}️⃣ **${event.title}**\n`;
      response += `📍 ${event.locationName || 'Lieu à définir'}\n`;
      response += `📅 ${date}\n\n`;
    });

    response += "Tapez le numéro d'un événement pour plus d'infos.";
    return response;
  }

  if (lowerContent.includes("carte") || lowerContent.includes("map")) {
    return `🗺️ **Carte interactive d'ABC Bédarieux**

Découvrez tous nos partenaires sur la carte :
${process.env.NEXT_PUBLIC_URL || 'https://abcbedarieux.com'}/carte

Vous pouvez aussi partager votre localisation pour voir les établissements près de vous !`;
  }

  if (lowerContent.includes("aide") || lowerContent.includes("help")) {
    return `ℹ️ **Comment puis-je vous aider ?**

🏢 "lieux" - Découvrir nos établissements
📅 "événements" - Voir les prochains événements
🗺️ "carte" - Accéder à la carte interactive
🔍 Tapez directement le nom d'un lieu ou événement
📍 Partagez votre localisation pour des suggestions personnalisées

💬 Vous pouvez aussi poser vos questions naturellement, je ferai de mon mieux pour vous répondre !`;
  }

  // Gestion de la localisation
  if (messageType === "LOCATION") {
    const latitude = typeof metadata.latitude === 'number' ? metadata.latitude : 0;
    const longitude = typeof metadata.longitude === 'number' ? metadata.longitude : 0;
    const nearbyPlaces = await findNearbyPlaces(latitude, longitude);
    
    if (nearbyPlaces.length === 0) {
      return "📍 Merci pour votre localisation ! Je ne trouve pas d'établissements très proches, mais vous pouvez découvrir tous nos partenaires en tapant 'lieux'.";
    }

    let response = "📍 **Établissements près de vous :**\n\n";
    nearbyPlaces.slice(0, 3).forEach((place, index) => {
      response += `${index + 1}️⃣ **${place.name}**\n`;
      response += `📍 ${place.street}, ${place.city}\n`;
      if (place.phone) response += `📞 ${place.phone}\n`;
      response += `🚶 ${place.distance}km\n\n`;
    });

    return response;
  }

  // Recherche directe d'établissements
  const places = await searchPlaces(content);
  if (places.length > 0) {
    let response = `🔍 **Résultats pour "${content}" :**\n\n`;
    places.slice(0, 3).forEach((place, index) => {
      response += `${index + 1}️⃣ **${place.name}**\n`;
      response += `📍 ${place.street}, ${place.city}\n`;
      if (place.phone) response += `📞 ${place.phone}\n`;
      if (place.website) response += `🌐 Site web disponible\n`;
      response += `\n`;
    });
    return response;
  }

  // Réponse par défaut
  return `Je ne suis pas sûr de comprendre. 🤔

Essayez :
• "lieux" pour voir nos établissements
• "événements" pour les prochains événements  
• "aide" pour plus d'options

Ou tapez directement ce que vous cherchez !`;
}

// Fonctions utilitaires
async function getUpcomingEvents() {
  return await prisma.event.findMany({
    where: {
      startDate: {
        gte: new Date()
      },
      isPublished: true,
      status: "PUBLISHED"
    },
    orderBy: {
      startDate: "asc"
    },
    take: 10,
    select: {
      id: true,
      title: true,
      startDate: true,
      locationName: true
    }
  });
}

async function searchPlaces(query: string) {
  return await prisma.place.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } }
      ],
      isVerified: true,
      status: "ACTIVE"
    },
    select: {
      id: true,
      name: true,
      street: true,
      city: true,
      phone: true,
      website: true
    },
    take: 5
  });
}

async function findNearbyPlaces(latitude: number, longitude: number) {
  // Simple distance calculation - en production, utiliser PostGIS ou service géographique
  const places = await prisma.place.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      isVerified: true,
      status: "ACTIVE"
    },
    select: {
      id: true,
      name: true,
      street: true,
      city: true,
      phone: true,
      latitude: true,
      longitude: true
    }
  });

  return places
    .map(place => ({
      ...place,
      distance: calculateDistance(latitude, longitude, place.latitude!, place.longitude!)
    }))
    .filter(place => place.distance <= 5) // 5km max
    .sort((a, b) => a.distance - b.distance);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 100) / 100; // Arrondi à 2 décimales
}

// Envoi de message WhatsApp
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    console.log("⚠️ WhatsApp credentials not configured - message not sent");
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          text: { body: message },
          type: "text"
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Failed to send WhatsApp message:", data);
      return;
    }

    // Sauvegarde du message envoyé
    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { phoneNumber }
    });

    if (conversation) {
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          messageId: data.messages?.[0]?.id,
          content: message,
          messageType: "TEXT",
          isFromBot: true,
          status: "SENT"
        }
      });

      console.log(`✅ Message sent to ${phoneNumber}`);
    }

  } catch (error) {
    console.error("❌ Error sending WhatsApp message:", error);
  }
}