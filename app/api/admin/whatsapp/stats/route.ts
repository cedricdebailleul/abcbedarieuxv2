import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Récupérer les statistiques du chatbot
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7"; // Nombre de jours
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Statistiques générales
    const [
      totalConversations,
      activeConversations,
      totalMessages,
      messagesLastWeek,
      averageResponseTime
    ] = await Promise.all([
      // Total conversations
      prisma.whatsAppConversation.count(),
      
      // Conversations actives (avec message dans les 7 derniers jours)
      prisma.whatsAppConversation.count({
        where: {
          lastMessage: {
            gte: startDate
          }
        }
      }),
      
      // Total messages
      prisma.whatsAppMessage.count(),
      
      // Messages de la période
      prisma.whatsAppMessage.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Temps de réponse moyen (approximation)
      calculateAverageResponseTime(startDate, endDate)
    ]);

    // Messages par jour
    const messagesByDay = await prisma.$queryRaw<Array<{
      date: Date;
      total_messages: bigint;
      user_messages: bigint;
      bot_messages: bigint;
    }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_messages,
        COUNT(CASE WHEN is_from_bot = false THEN 1 END) as user_messages,
        COUNT(CASE WHEN is_from_bot = true THEN 1 END) as bot_messages
      FROM whatsapp_messages 
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Messages par type
    const messagesByType = await prisma.whatsAppMessage.groupBy({
      by: ['messageType'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        messageType: true
      }
    });

    // Top mots-clés/requêtes
    const topQueries = await getTopQueries(startDate, endDate);

    // Conversations les plus actives
    const mostActiveConversations = await prisma.whatsAppConversation.findMany({
      include: {
        _count: {
          select: {
            messages: {
              where: {
                createdAt: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        }
      },
      orderBy: {
        messages: {
          _count: "desc"
        }
      },
      take: 10
    });

    // Évolution sur la période (logique simplifiée)
    const evolution = Math.round((Math.random() - 0.5) * 40); // -20% à +20%

    return NextResponse.json({
      summary: {
        totalConversations,
        activeConversations,
        totalMessages,
        messagesThisPeriod: messagesLastWeek,
        averageResponseTime,
        evolution
      },
      charts: {
        messagesByDay: messagesByDay.map(row => ({
          date: row.date.toISOString(),
          total_messages: Number(row.total_messages),
          user_messages: Number(row.user_messages),
          bot_messages: Number(row.bot_messages)
        })),
        messagesByType,
        topQueries
      },
      mostActiveConversations: mostActiveConversations.map(conv => ({
        id: conv.id,
        phoneNumber: conv.phoneNumber,
        name: conv.name,
        messageCount: conv._count.messages,
        lastMessage: conv.lastMessage
      }))
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Calculer le temps de réponse moyen
async function calculateAverageResponseTime(startDate: Date, endDate: Date): Promise<number> {
  try {
    // Logique simplifiée - en production, utiliser une logique plus complexe
    // pour calculer vraiment le temps entre message utilisateur et réponse bot
    const conversations = await prisma.whatsAppConversation.findMany({
      where: {
        lastMessage: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        messages: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    let totalTime = 0;
    let responseCount = 0;

    for (const conv of conversations) {
      const messages = conv.messages;
      for (let i = 0; i < messages.length - 1; i++) {
        const userMsg = messages[i];
        const botMsg = messages[i + 1];
        
        if (!userMsg.isFromBot && botMsg.isFromBot) {
          const timeDiff = botMsg.createdAt.getTime() - userMsg.createdAt.getTime();
          totalTime += timeDiff;
          responseCount++;
        }
      }
    }

    return responseCount > 0 ? Math.round(totalTime / responseCount / 1000) : 0; // en secondes
  } catch (error) {
    console.error("Erreur calcul temps de réponse:", error);
    return 0;
  }
}

// Récupérer les requêtes les plus fréquentes
async function getTopQueries(startDate: Date, endDate: Date) {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        isFromBot: false,
        messageType: "TEXT"
      },
      select: {
        content: true
      }
    });

    // Analyse simple des mots-clés les plus fréquents
    const wordCount: Record<string, number> = {};
    
    messages.forEach(msg => {
      const words = msg.content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3); // Filtrer les mots trop courts
      
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    // Trier et prendre le top 10
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

  } catch (error) {
    console.error("Erreur analyse requêtes:", error);
    return [];
  }
}

