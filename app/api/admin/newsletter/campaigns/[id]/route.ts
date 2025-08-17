import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    try {
      const { id } = await params;
      
      // Récupérer la campagne avec toutes les informations
      const campaign = await prisma.newsletterCampaign.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Campagne non trouvée" },
          { status: 404 }
        );
      }

      // Calculer le nombre de destinataires potentiels
      const totalRecipients = await prisma.newsletterSubscriber.count({
        where: {
          isActive: true,
          isVerified: true,
        },
      });

      return NextResponse.json({
        success: true,
        campaign: {
          ...campaign,
          totalRecipients,
          includedEvents: campaign.includedEvents || [],
          includedPlaces: campaign.includedPlaces || [],
          includedPosts: campaign.includedPosts || [],
        },
      });

    } catch (prismaError: any) {
      if (prismaError.message?.includes("newsletterCampaign")) {
        return NextResponse.json(
          { 
            error: "Les tables de newsletter ne sont pas encore créées.",
            migrationRequired: true
          },
          { status: 500 }
        );
      }
      throw prismaError;
    }

  } catch (error) {
    console.error("Erreur lors de la récupération de la campagne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      content, 
      type, 
      scheduledAt,
      includedEvents = [],
      includedPlaces = [],
      includedPosts = []
    } = body;

    try {
      const { id } = await params;
      
      // Vérifier que la campagne existe et peut être modifiée
      const existingCampaign = await prisma.newsletterCampaign.findUnique({
        where: { id },
      });

      if (!existingCampaign) {
        return NextResponse.json(
          { error: "Campagne non trouvée" },
          { status: 404 }
        );
      }

      if (existingCampaign.status !== "DRAFT") {
        return NextResponse.json(
          { error: "Seules les campagnes en brouillon peuvent être modifiées" },
          { status: 400 }
        );
      }

      // Mettre à jour la campagne
      const updatedCampaign = await prisma.newsletterCampaign.update({
        where: { id },
        data: {
          title,
          subject,
          content,
          type,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          includedEvents,
          includedPlaces,
          includedPosts,
          updatedAt: new Date(),
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        campaign: updatedCampaign,
        message: "Campagne mise à jour avec succès",
      });

    } catch (prismaError: any) {
      if (prismaError.message?.includes("newsletterCampaign")) {
        return NextResponse.json(
          { 
            error: "Les tables de newsletter ne sont pas encore créées.",
            migrationRequired: true
          },
          { status: 500 }
        );
      }
      throw prismaError;
    }

  } catch (error) {
    console.error("Erreur lors de la mise à jour de la campagne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    try {
      const { id } = await params;
      
      // Vérifier que la campagne existe et peut être supprimée
      const campaign = await prisma.newsletterCampaign.findUnique({
        where: { id },
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Campagne non trouvée" },
          { status: 404 }
        );
      }

      if (!["DRAFT", "CANCELLED"].includes(campaign.status)) {
        return NextResponse.json(
          { error: "Seules les campagnes en brouillon ou annulées peuvent être supprimées" },
          { status: 400 }
        );
      }

      // Supprimer la campagne
      await prisma.newsletterCampaign.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "Campagne supprimée avec succès",
      });

    } catch (prismaError: any) {
      if (prismaError.message?.includes("newsletterCampaign")) {
        return NextResponse.json(
          { 
            error: "Les tables de newsletter ne sont pas encore créées.",
            migrationRequired: true
          },
          { status: 500 }
        );
      }
      throw prismaError;
    }

  } catch (error) {
    console.error("Erreur lors de la suppression de la campagne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}