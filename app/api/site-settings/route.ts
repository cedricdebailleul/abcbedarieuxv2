import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les paramètres du site (endpoint public)
export async function GET() {
  try {
    let settings = await prisma.siteSettings.findFirst();

    // Si aucun paramètre n'existe, créer les valeurs par défaut
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          siteName: "ABC Bédarieux",
          siteDescription: "Annuaire des commerces et artisans de Bédarieux",
          siteUrl: process.env.NEXT_PUBLIC_URL || "https://abcbedarieux.com",
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
