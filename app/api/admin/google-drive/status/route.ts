import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createGoogleDriveOAuth } from "@/lib/google-drive-oauth";

// Vérifier le statut de la connexion Google Drive
export async function GET() {
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

    // Créer le gestionnaire OAuth
    const oauth = createGoogleDriveOAuth();

    // Récupérer le statut de la connexion
    const status = await oauth.getConnectionStatus(session.user.id);

    return NextResponse.json({
      success: true,
      status,
      checkedBy: session.user.email,
      checkedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Erreur vérification statut Google Drive:", error);
    
    if (error instanceof Error && error.message.includes("Configuration OAuth")) {
      return NextResponse.json(
        { 
          error: "Configuration OAuth Google Drive manquante",
          details: "Vérifiez GOOGLE_OAUTH_CLIENT_ID et GOOGLE_OAUTH_CLIENT_SECRET"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne lors de la vérification du statut" },
      { status: 500 }
    );
  }
}

// Révoquer l'accès Google Drive
export async function DELETE() {
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

    console.log("🔄 Révocation de l'accès Google Drive...");

    // Créer le gestionnaire OAuth
    const oauth = createGoogleDriveOAuth();

    // Révoquer l'accès
    const revoked = await oauth.revokeAccess(session.user.id);

    if (!revoked) {
      throw new Error("Impossible de révoquer l'accès Google Drive");
    }

    return NextResponse.json({
      success: true,
      message: "Accès Google Drive révoqué avec succès",
      revokedBy: session.user.email,
      revokedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Erreur révocation Google Drive:", error);
    
    return NextResponse.json(
      { error: "Erreur interne lors de la révocation de l'accès" },
      { status: 500 }
    );
  }
}