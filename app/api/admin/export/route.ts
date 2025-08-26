import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
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

    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const { categories, format, fullBackup } = await request.json();

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ error: "Catégories manquantes" }, { status: 400 });
    }

    const exportData: Record<string, unknown> = {};
    const timestamp = new Date().toISOString();

    // Export des utilisateurs
    if (categories.includes("users")) {
      const includeOptions = fullBackup ? {
        profile: true,
        accounts: {
          select: {
            id: true,
            providerId: true,
            accountId: true,
            accessToken: false, // Exclure les tokens sensibles
            refreshToken: false,
            idToken: false,
            scope: true,
            createdAt: true,
            updatedAt: true,
            firstLoginAt: true,
            lastUsedAt: true
          }
        },
        badges: {
          include: {
            badge: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                color: true,
                iconUrl: true
              }
            }
          }
        },
        consent: true,
        _count: {
          select: {
            places: true,
            events: true,
            posts: true,
            reviews: true
          }
        }
      } : {
        profile: true,
        accounts: {
          select: {
            providerId: true,
            accountId: true,
            createdAt: true
          }
        },
        badges: {
          include: {
            badge: {
              select: {
                title: true,
                description: true,
                category: true
              }
            }
          }
        },
        _count: {
          select: {
            places: true,
            events: true,
            posts: true,
            reviews: true
          }
        }
      };

      const users = await prisma.user.findMany({
        include: includeOptions
      });

      // Retirer les données sensibles
      exportData.users = users.map(user => ({
        ...user,
        // Retirer le hash du mot de passe et autres infos sensibles
        password: undefined,
        emailVerificationToken: undefined
      }));
    }

    // Export des lieux
    if (categories.includes("places")) {
      const includeOptions = fullBackup ? {
        categories: {
          include: {
            category: true
          }
        },
        openingHours: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        googleReviews: true,
        products: true,
        services: true,
        offers: true,
        events: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        posts: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        favorites: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        claims: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            reviews: true,
            googleReviews: true,
            events: true,
            posts: true,
            favorites: true
          }
        }
      } : {
        categories: {
          include: {
            category: true
          }
        },
        openingHours: true,
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            userId: true
          }
        },
        googleReviews: true,
        products: true,
        services: true,
        offers: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            reviews: true,
            googleReviews: true
          }
        }
      };

      const places = await prisma.place.findMany({
        include: includeOptions
      });

      exportData.places = places;
    }

    // Export des événements
    if (categories.includes("events")) {
      const events = await prisma.event.findMany({
        include: {
          place: {
            select: {
              id: true,
              name: true,
              street: true,
              city: true
            }
          },
          organizer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          participants: {
            select: {
              id: true,
              status: true,
              registeredAt: true
            }
          },
          reminders: true
        }
      });

      exportData.events = events;
    }

    // Export des articles/posts
    if (categories.includes("posts")) {
      const posts = await prisma.post.findMany({
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
              city: true
            }
          }
        }
      });

      exportData.posts = posts;
    }

    // Export de la newsletter
    if (categories.includes("newsletter")) {
      const newsletterData = await Promise.all([
        prisma.newsletterSubscriber.findMany(),
        prisma.newsletterCampaign.findMany({
          include: {
            attachments: true
          }
        }),
        prisma.newsletterCampaignSent.findMany({
          include: {
            campaign: {
              select: {
                id: true,
                subject: true,
                type: true
              }
            },
            subscriber: {
              select: {
                id: true,
                email: true
              }
            }
          }
        })
      ]);

      exportData.newsletter = {
        subscribers: newsletterData[0],
        campaigns: newsletterData[1],
        campaignsSent: newsletterData[2]
      };
    }

    // Ajouter les métadonnées de l'export
    const metadata = {
      exportDate: timestamp,
      exportedBy: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      },
      categories: categories,
      format: format,
      version: "1.0.0"
    };

    if (format === "json") {
      // Créer un seul fichier JSON avec toutes les données
      const fullExport = {
        metadata,
        data: exportData
      };
      
      return new NextResponse(JSON.stringify(fullExport, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="abc-bedarieux-export-${new Date().toISOString().split('T')[0]}.json"`
        }
      });

    } else if (format === "csv") {
      // Pour CSV, on prend la première catégorie sélectionnée et on la convertit
      const firstCategory = categories[0];
      const data = exportData[firstCategory];
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return NextResponse.json({ error: "Aucune donnée à exporter" }, { status: 400 });
      }

      // Convertir en CSV (simple implémentation)
      const headers = Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object' || data[0][key] === null);
      const csvContent = [
        headers.join(","),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return "";
            if (typeof value === "string" && value.includes(",")) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value);
          }).join(",")
        )
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="abc-bedarieux-${firstCategory}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json({ error: "Format non supporté" }, { status: 400 });

  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" }, 
      { status: 500 }
    );
  }
}