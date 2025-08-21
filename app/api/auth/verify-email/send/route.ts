import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, emailVerified: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email déjà vérifié" },
        { status: 400 }
      );
    }

    // Supprimer les anciens tokens de vérification
    await prisma.verification.deleteMany({
      where: {
        identifier: user.email,
        type: "EMAIL",
      },
    });

    // Générer un code OTP à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Créer le token de vérification
    await prisma.verification.create({
      data: {
        identifier: user.email,
        value: otpCode,
        type: "EMAIL",
        expiresAt,
      },
    });

    // Envoyer l'email avec le code OTP
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🔐 Vérification de votre email - ABC Bédarieux</h2>
        <p>Bonjour ${user.name || ""},</p>
        <p>Voici votre code de vérification pour valider votre adresse email :</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3B82F6; font-family: monospace;">
            ${otpCode}
          </div>
        </div>
        
        <p>Ce code expire dans <strong>15 minutes</strong>.</p>
        
        <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #dc2626;">
            ⚠️ Ne partagez jamais ce code avec quelqu'un d'autre.
          </p>
        </div>
        
        <p style="font-size: 12px; color: #666;">
          Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.
        </p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "🔐 Code de vérification - ABC Bédarieux",
      html: emailHTML,
    });

    return NextResponse.json({
      success: true,
      message: "Code de vérification envoyé par email",
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi du code de vérification:", error);

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
