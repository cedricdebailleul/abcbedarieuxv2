import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST() {
  try {
    // Vérifier l'authentification et les permissions admin
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Permissions insuffisantes - admin requis" }, { status: 403 });
    }

    const timestamp = new Date().toISOString();

    // Sauvegarde complète de toutes les données avec toutes les relations
    console.log("🚀 Début de la sauvegarde complète...");

    const backupData = {
      metadata: {
        exportDate: timestamp,
        exportedBy: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        },
        version: "1.0.0",
        type: "FULL_BACKUP"
      },
      data: {} as Record<string, unknown>
    };

    // 1. Sauvegarder les utilisateurs avec toutes leurs relations
    console.log("👥 Export des utilisateurs...");
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        accounts: true,
        badges: {
          include: {
            badge: true
          }
        },
        consent: true,
        places: true,
        events: true,
        posts: true
      }
    });

    // Nettoyer les données sensibles
    backupData.data.users = users.map(user => ({
      ...user,
      // Exclure les données sensibles
      accounts: user.accounts.map(account => ({
        ...account,
        accessToken: undefined,
        refreshToken: undefined,
        idToken: undefined,
        password: undefined
      }))
    }));

    // 2. Sauvegarder les catégories de places
    console.log("🏷️ Export des catégories de places...");
    backupData.data.placeCategories = await prisma.placeCategory.findMany({
      include: {
        places: true,
        parent: true,
        children: true
      }
    });

    // 3. Sauvegarder les places avec toutes leurs relations
    console.log("🏢 Export des places...");
    backupData.data.places = await prisma.place.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        },
        openingHours: true,
        reviews: true,
        googleReviews: true,
        favorites: true,
        claims: true,
        events: true,
        posts: true,
        products: true,
        services: true,
        offers: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // 4. Sauvegarder les événements
    console.log("📅 Export des événements...");
    backupData.data.events = await prisma.event.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        place: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        participants: true,
        reminders: true
      }
    });

    // 5. Sauvegarder les posts
    console.log("📝 Export des posts...");
    backupData.data.posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        place: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // 6. Sauvegarder les badges
    console.log("🏆 Export des badges...");
    backupData.data.badges = await prisma.badge.findMany({
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // 7. Sauvegarder les données de newsletter
    console.log("📧 Export de la newsletter...");
    const newsletterSubscribers = await prisma.newsletterSubscriber.findMany({
      include: {
        preferences: true,
        campaigns: true
      }
    });

    const newsletterCampaigns = await prisma.newsletterCampaign.findMany({
      include: {
        attachments: true,
        sentCampaigns: {
          include: {
            subscriber: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      }
    });

    backupData.data.newsletter = {
      subscribers: newsletterSubscribers,
      campaigns: newsletterCampaigns
    };

    // 8. Sauvegarder les reviews et avis Google
    console.log("⭐ Export des avis...");
    backupData.data.reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        place: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    backupData.data.googleReviews = await prisma.googleReview.findMany({
      include: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // 9. Sauvegarder les relations place-to-category
    console.log("🔗 Export des relations place-catégorie...");
    backupData.data.placeToCategories = await prisma.placeToCategory.findMany({
      include: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // 10. Sauvegarder les données ABC (Association)
    console.log("🏛️ Export des données ABC...");
    backupData.data.abcMembers = await prisma.abcMember.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    backupData.data.abcRegistrations = await prisma.abcRegistration.findMany({
      include: {
        processorUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    backupData.data.abcPayments = await prisma.abcPayment.findMany({
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    backupData.data.abcMeetings = await prisma.abcMeeting.findMany();
    backupData.data.abcDocuments = await prisma.abcDocument.findMany();
    backupData.data.abcBulletins = await prisma.abcBulletin.findMany();

    // 11. Sauvegarder les produits, services et offres
    console.log("🛍️ Export des produits et services...");
    backupData.data.products = await prisma.product.findMany({
      include: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    backupData.data.services = await prisma.service.findMany({
      include: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    backupData.data.offers = await prisma.offer.findMany({
      include: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // 12. Sauvegarder les partenaires
    console.log("🤝 Export des partenaires...");
    backupData.data.partners = await prisma.partner.findMany();

    // 13. Sauvegarder les données d'historique du site
    console.log("📜 Export de l'historique du site...");
    backupData.data.historyConfigs = await prisma.historyConfig.findMany({
      include: {
        milestones: true,
        timelineEvents: true,
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // 14. Sauvegarder les conversations WhatsApp
    console.log("💬 Export des conversations WhatsApp...");
    backupData.data.whatsappConversations = await prisma.whatsAppConversation.findMany({
      include: {
        messages: true
      }
    });

    backupData.data.whatsappBotConfigs = await prisma.whatsAppBotConfig.findMany();
    backupData.data.whatsappBotStats = await prisma.whatsAppBotStats.findMany();

    // 15. Sauvegarder les actions et campagnes
    console.log("⚡ Export des actions...");
    backupData.data.actions = await prisma.action.findMany();

    // 16. Sauvegarder les tags et catégories de contenu
    console.log("🏷️ Export des tags et catégories...");
    backupData.data.tags = await prisma.tag.findMany({
      include: {
        posts: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      }
    });

    backupData.data.categories = await prisma.category.findMany({
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    // 17. Sauvegarder les vues et statistiques
    console.log("📊 Export des statistiques...");
    backupData.data.postViews = await prisma.postView.findMany();

    // 18. Sauvegarder les rappels d'événements et participants
    console.log("🔔 Export des rappels et participations...");
    backupData.data.eventParticipants = await prisma.eventParticipant.findMany({
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    backupData.data.eventReminders = await prisma.eventReminder.findMany();
    backupData.data.recurrenceRules = await prisma.recurrenceRule.findMany();

    // 19. Sauvegarder les notifications utilisateur
    console.log("📧 Export des notifications...");
    backupData.data.userNotificationStatus = await prisma.userNotificationStatus.findMany();

    console.log("✅ Sauvegarde complète terminée avec TOUTES les tables");

    // Retourner le fichier JSON
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="abc-bedarieux-backup-complet-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde complète:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur lors de la sauvegarde" }, 
      { status: 500 }
    );
  }
}