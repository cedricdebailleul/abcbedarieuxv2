import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createGoogleDriveOAuth } from "@/lib/google-drive-oauth";

// Initier l'authentification Google Drive
export async function POST() {
  try {
    // Vérifier l'authentification et les permissions admin
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Permissions insuffisantes - admin requis" },
        { status: 403 }
      );
    }

    console.log("🚀 Initiation de l'authentification Google Drive...");

    // Créer le gestionnaire OAuth
    const oauth = createGoogleDriveOAuth();

    // Générer l'URL d'autorisation
    const authUrl = oauth.generateAuthUrl(session.user.id);

    return NextResponse.json({
      success: true,
      authUrl,
      message: "URL d'autorisation Google Drive générée",
    });

  } catch (error) {
    console.error("❌ Erreur génération URL auth Google Drive:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Configuration OAuth Google Drive")) {
        return NextResponse.json(
          { 
            error: "Configuration OAuth Google Drive manquante",
            details: "Vérifiez GOOGLE_OAUTH_CLIENT_ID et GOOGLE_OAUTH_CLIENT_SECRET dans .env"
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erreur interne lors de l'authentification Google Drive" },
      { status: 500 }
    );
  }
}