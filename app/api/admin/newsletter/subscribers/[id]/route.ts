import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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

    const { id } = await params;
    const body = await request.json();

    // Vérifier que l'abonné existe
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Abonné introuvable" },
        { status: 404 }
      );
    }

    // Mettre à jour l'abonné
    const updatedSubscriber = await prisma.newsletterSubscriber.update({
      where: { id },
      data: body,
      include: {
        preferences: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscriber: updatedSubscriber,
      message: "Abonné mis à jour avec succès",
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'abonné:", error);
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

    const { id } = await params;

    // Vérifier que l'abonné existe
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Abonné introuvable" },
        { status: 404 }
      );
    }

    // Supprimer d'abord les préférences liées
    await prisma.newsletterPreferences.deleteMany({
      where: { subscriberId: id },
    });

    // Supprimer les envois de campagne liés
    await prisma.newsletterCampaignSent.deleteMany({
      where: { subscriberId: id },
    });

    // Supprimer l'abonné
    await prisma.newsletterSubscriber.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Abonné supprimé avec succès",
    });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'abonné:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}