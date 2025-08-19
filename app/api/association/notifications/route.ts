import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/association/notifications - Récupérer les notifications de bulletins pour l'utilisateur
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication requise" },
        { status: 401 }
      );
    }

    // Récupérer les bulletins publiés récemment (dans les 30 derniers jours)
    const recentBulletins = await prisma.abcBulletin.findMany({
      where: {
        isPublished: true,
        publishedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
        }
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 10, // Augmenté pour plus de notifications
    });

    // Récupérer le statut de lecture pour l'utilisateur
    const notificationStatuses = await prisma.userNotificationStatus.findMany({
      where: {
        userId: session.user.id,
        notificationId: {
          in: recentBulletins.map(b => `bulletin-${b.id}`)
        }
      }
    });

    // Créer un map pour un accès rapide aux statuts
    const statusMap = new Map(
      notificationStatuses.map(status => [status.notificationId, status])
    );

    // Créer des objets de notification avec statut de lecture
    const notifications = recentBulletins.map(bulletin => {
      const notificationId = `bulletin-${bulletin.id}`;
      const status = statusMap.get(notificationId);
      
      return {
        id: notificationId,
        type: "NEW_BULLETIN",
        title: "Nouveau bulletin disponible",
        message: `"${bulletin.title}" publié par ${bulletin.createdBy.name}`,
        createdAt: bulletin.publishedAt,
        bulletinId: bulletin.id,
        isRead: status?.isRead ?? false,
        readAt: status?.readAt,
      };
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/association/notifications - Marquer/Démarquer une notification comme lue
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication requise" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId, action } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId requis" },
        { status: 400 }
      );
    }

    // Rechercher le statut existant
    const existingStatus = await prisma.userNotificationStatus.findUnique({
      where: {
        userId_notificationId: {
          userId: session.user.id,
          notificationId: notificationId,
        }
      }
    });

    let newIsRead: boolean;
    
    if (action === "toggle") {
      // Basculer le statut
      newIsRead = existingStatus ? !existingStatus.isRead : true;
    } else if (action === "mark_read") {
      newIsRead = true;
    } else if (action === "mark_unread") {
      newIsRead = false;
    } else {
      return NextResponse.json(
        { error: "Action non supportée. Utilisez 'toggle', 'mark_read' ou 'mark_unread'" },
        { status: 400 }
      );
    }

    // Déterminer le type de notification
    const notificationType = notificationId.startsWith("bulletin-") ? "NEW_BULLETIN" : "UNKNOWN";

    // Upsert le statut de notification
    const updatedStatus = await prisma.userNotificationStatus.upsert({
      where: {
        userId_notificationId: {
          userId: session.user.id,
          notificationId: notificationId,
        }
      },
      update: {
        isRead: newIsRead,
        readAt: newIsRead ? new Date() : null,
      },
      create: {
        userId: session.user.id,
        notificationId: notificationId,
        type: notificationType,
        isRead: newIsRead,
        readAt: newIsRead ? new Date() : null,
      }
    });

    return NextResponse.json({ 
      message: newIsRead ? "Notification marquée comme lue" : "Notification marquée comme non lue",
      notificationId,
      isRead: updatedStatus.isRead,
      readAt: updatedStatus.readAt,
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}