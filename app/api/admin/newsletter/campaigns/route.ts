import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user?.role || !["admin", "moderator", "editor"].includes(user.role)) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      subject,
      type = "NEWSLETTER",
      content = "",
      includedEvents = [],
      includedPlaces = [],
      includedPosts = [],
      attachments = [],
      status = "DRAFT",
      scheduledAt
    } = body;

    // Validation des données requises
    if (!title || !subject) {
      return NextResponse.json(
        { error: "Le titre et l'objet sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si les modèles newsletter existent
    try {
      await prisma.newsletterCampaign.findFirst({ take: 1 });
    } catch (error) {
      return NextResponse.json(
        { 
          error: "Les tables de newsletter ne sont pas encore créées. Veuillez exécuter 'pnpm db:push' pour migrer la base de données.",
          migrationRequired: true
        },
        { status: 500 }
      );
    }

    // Créer la campagne avec les pièces jointes dans une transaction
    const campaign = await prisma.$transaction(async (tx) => {
      // Créer la campagne
      const newCampaign = await tx.newsletterCampaign.create({
        data: {
          title,
          subject,
          content,
          type,
          status,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          includedEvents,
          includedPlaces,
          includedPosts,
          createdById: session.user.id,
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      // Créer les pièces jointes si présentes
      if (attachments && attachments.length > 0) {
        const attachmentData = attachments.map((attachment: any) => ({
          campaignId: newCampaign.id,
          fileName: attachment.id || `file-${Date.now()}`, // Utilise l'ID généré comme nom de fichier
          originalName: attachment.name,
          fileType: attachment.type,
          fileSize: attachment.size,
          filePath: attachment.url, // URL du fichier uploadé
          uploadedBy: session.user.id,
        }));

        await tx.newsletterAttachment.createMany({
          data: attachmentData
        });
      }

      // Retourner la campagne avec les pièces jointes
      return await tx.newsletterCampaign.findUnique({
        where: { id: newCampaign.id },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true
            }
          },
          attachments: true,
        }
      });
    });

    return NextResponse.json({
      success: true,
      campaign,
      message: status === "SCHEDULED" ? "Campagne programmée avec succès" : "Campagne créée avec succès"
    });

  } catch (error) {
    console.error("Erreur lors de la création de la campagne:", error);
    
    // Gérer l'erreur de modèle non trouvé
    if (error.message?.includes("Unknown arg `type`") || error.message?.includes("newsletterCampaign")) {
      return NextResponse.json(
        { 
          error: "Les tables de newsletter ne sont pas encore créées. Veuillez exécuter la migration de la base de données.",
          migrationRequired: true
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user?.role || !["admin", "moderator", "editor"].includes(user.role)) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    try {
      // Récupérer les campagnes
      const [campaigns, totalCount] = await Promise.all([
        prisma.newsletterCampaign.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.newsletterCampaign.count()
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        success: true,
        campaigns,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      // Si les modèles n'existent pas encore
      return NextResponse.json({
        success: true,
        campaigns: [],
        pagination: {
          page: 1,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        migrationRequired: true
      });
    }

  } catch (error) {
    console.error("Erreur lors de la récupération des campagnes:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}