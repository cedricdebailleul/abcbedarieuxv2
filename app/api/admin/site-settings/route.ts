import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les paramètres du site
export async function GET() {
  try {
    // Les paramètres du site sont publics, pas besoin d'auth
    let settings = await prisma.siteSettings.findFirst();

    // Si aucun paramètre n'existe, créer les valeurs par défaut
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          siteName: "ABC Bédarieux",
          siteDescription: "Annuaire des commerces et artisans de Bédarieux",
          siteUrl: process.env.NEXT_PUBLIC_URL || "https://abc-bedarieux.fr",
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Erreur lors de la récupération des paramètres:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des paramètres" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour les paramètres du site (admin uniquement)
export async function PUT(req: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle admin
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentification requise" },
        { status: 401 }
      );
    }

    const user = safeUserCast(session.user);
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Récupérer ou créer les paramètres
    let settings = await prisma.siteSettings.findFirst();

    if (settings) {
      // Mettre à jour les paramètres existants
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: {
          siteName: body.siteName,
          siteDescription: body.siteDescription,
          siteUrl: body.siteUrl,
          contactEmail: body.contactEmail,
          contactPhone: body.contactPhone,
          facebookUrl: body.facebookUrl || null,
          instagramUrl: body.instagramUrl || null,
          twitterUrl: body.twitterUrl || null,
          linkedinUrl: body.linkedinUrl || null,
          youtubeUrl: body.youtubeUrl || null,
          tiktokUrl: body.tiktokUrl || null,
          addressStreet: body.addressStreet,
          addressCity: body.addressCity,
          addressZip: body.addressZip,
          openingHours: body.openingHours,
        },
      });
    } else {
      // Créer de nouveaux paramètres
      settings = await prisma.siteSettings.create({
        data: {
          siteName: body.siteName || "ABC Bédarieux",
          siteDescription: body.siteDescription,
          siteUrl: body.siteUrl,
          contactEmail: body.contactEmail,
          contactPhone: body.contactPhone,
          facebookUrl: body.facebookUrl || null,
          instagramUrl: body.instagramUrl || null,
          twitterUrl: body.twitterUrl || null,
          linkedinUrl: body.linkedinUrl || null,
          youtubeUrl: body.youtubeUrl || null,
          tiktokUrl: body.tiktokUrl || null,
          addressStreet: body.addressStreet,
          addressCity: body.addressCity,
          addressZip: body.addressZip,
          openingHours: body.openingHours,
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des paramètres:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour des paramètres" },
      { status: 500 }
    );
  }
}
