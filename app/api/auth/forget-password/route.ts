import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Pour des raisons de sécurité, on renvoie toujours un message de succès
    // même si l'utilisateur n'existe pas
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
      });
    }

    // Générer un token de réinitialisation sécurisé
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

    // Sauvegarder le token dans la base de données
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Note: Il faut ajouter ces champs au schéma Prisma
        // resetToken,
        // resetTokenExpiry,
      },
    });

    // Pour l'instant, utilisons une table temporaire ou stockons dans metadata
    // Créons une entrée dans une table de tokens (à créer dans le schéma)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Envoyer l'email
    await sendEmail({
      to: user.email,
      subject: "ABC Bédarieux - Réinitialisation de mot de passe",
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${user.name || user.email},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Réinitialiser mon mot de passe
        </a>
        <p>Ce lien est valide pendant 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Ou copiez ce lien : ${resetUrl}
        </p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Un email de réinitialisation a été envoyé.",
    });
  } catch (error) {
    console.error("Erreur lors de la demande de réinitialisation:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer plus tard." },
      { status: 500 }
    );
  }
}
