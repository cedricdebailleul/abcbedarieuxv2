import { NextRequest, NextResponse } from "next/server";
import { createGoogleDriveOAuth } from "@/lib/google-drive-oauth";
import { prisma } from "@/lib/prisma";

// Callback OAuth Google Drive
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // userId
    const error = url.searchParams.get('error');

    // Vérifier les erreurs OAuth
    if (error) {
      console.error('Erreur OAuth Google:', error);
      return NextResponse.redirect(
        `${url.origin}/dashboard/admin/export?google_drive_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${url.origin}/dashboard/admin/export?google_drive_error=missing_parameters`
      );
    }

    const userId = state;

    // Vérifier que l'utilisateur existe et est admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(
        `${url.origin}/dashboard/admin/export?google_drive_error=invalid_user`
      );
    }

    console.log("🔄 Traitement du callback OAuth Google Drive...");

    // Créer le gestionnaire OAuth
    const oauth = createGoogleDriveOAuth();

    // Échanger le code contre les tokens
    const tokenData = await oauth.exchangeCodeForTokens(code, userId);

    // Sauvegarder les tokens
    await oauth.saveTokens(userId, tokenData);

    console.log(`✅ Authentification Google Drive réussie pour ${user.email}`);

    // Rediriger vers une page de succès qui fermera la popup
    return NextResponse.redirect(
      `${url.origin}/dashboard/admin/export/oauth-success?google_email=${encodeURIComponent(tokenData.userInfo.googleEmail)}`
    );

  } catch (error) {
    console.error("❌ Erreur callback Google Drive:", error);
    
    const url = new URL(request.url);
    let errorMessage = "unknown_error";
    
    if (error instanceof Error) {
      if (error.message.includes("Configuration OAuth")) {
        errorMessage = "config_error";
      } else if (error.message.includes("access_denied")) {
        errorMessage = "access_denied";
      } else if (error.message.includes("invalid_grant")) {
        errorMessage = "invalid_grant";
      }
    }

    return NextResponse.redirect(
      `${url.origin}/dashboard/admin/export/oauth-error?error=${errorMessage}`
    );
  }
}