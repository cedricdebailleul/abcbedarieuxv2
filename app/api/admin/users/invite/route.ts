import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { z } from "zod";
import { headers } from "next/headers";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["user", "admin", "moderator", "dpo", "editor"]).default("user"),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Valider les données
    const body = await request.json();
    const { email, role, message } = inviteSchema.parse(body);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Générer un token d'invitation
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    // Créer l'invitation en base
    await prisma.verification.create({
      data: {
        identifier: email,
        value: inviteToken,
        type: "EMAIL",
        expiresAt,
        used: false,
      },
    });

    // Créer l'URL d'invitation
    const baseUrl = process.env.NODE_ENV === "production" 
      ? process.env.NEXTAUTH_URL || `https://${request.headers.get("host")}`
      : process.env.NEXTAUTH_URL || `http://${request.headers.get("host")}`;
    
    const inviteUrl = `${baseUrl}/auth/accept-invitation?token=${inviteToken}&email=${encodeURIComponent(email)}&role=${role}`;

    // Envoyer l'email d'invitation
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invitation à rejoindre ABC Bédarieux</h2>
        <p>Bonjour,</p>
        <p>Vous avez été invité(e) à rejoindre la plateforme ABC Bédarieux en tant que <strong>${role === "admin" ? "administrateur" : role}</strong>.</p>
        ${message ? `<p><em>Message de l'administrateur :</em><br>${message}</p>` : ""}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accepter l'invitation
          </a>
        </div>
        <p style="font-size: 12px; color: #666;">
          Cette invitation expire le ${expiresAt.toLocaleDateString("fr-FR")}.<br>
          Si vous n'arrivez pas à cliquer sur le bouton, copiez ce lien dans votre navigateur :<br>
          <a href="${inviteUrl}">${inviteUrl}</a>
        </p>
        <p style="font-size: 12px; color: #666;">
          Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Invitation à rejoindre ABC Bédarieux",
      html: emailHTML,
    });

    return NextResponse.json({
      success: true,
      message: "Invitation envoyée avec succès",
      inviteUrl, // Pour les tests en développement
    });

  } catch (error) {
    console.error("Erreur lors de l'invitation:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}