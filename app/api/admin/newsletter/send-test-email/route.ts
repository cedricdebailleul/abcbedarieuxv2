import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, createNewsletterEmailTemplate } from "@/lib/email";

export async function POST(request: NextRequest) {
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
    const { subscriberId, email, firstName } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'abonné existe
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id: subscriberId },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Abonné introuvable" },
        { status: 404 }
      );
    }

    // Créer un email de test
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?token=${subscriber.unsubscribeToken || 'test'}`;
    const trackingPixelUrl = `${baseUrl}/api/newsletter/track/open?c=test&s=${subscriber.id}&t=test`;

    const emailHtml = createNewsletterEmailTemplate({
      campaignTitle: "Email de Test",
      subject: "Test d'envoi depuis l'administration ABC Bédarieux",
      content: `
        <h3>Bonjour ${firstName || 'cher abonné'} !</h3>
        
        <p>Ceci est un <strong>email de test</strong> envoyé depuis l'interface d'administration d'ABC Bédarieux.</p>
        
        <p>Si vous recevez cet email, cela signifie que :</p>
        <ul>
          <li>✅ Le système d'envoi d'emails fonctionne correctement</li>
          <li>✅ Votre adresse email est bien configurée</li>
          <li>✅ La communication avec notre serveur SMTP est opérationnelle</li>
        </ul>
        
        <p><em>Envoyé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</em></p>
        
        <hr>
        
        <p><small>Cet email a été envoyé à des fins de test par un administrateur d'ABC Bédarieux.</small></p>
      `,
      unsubscribeUrl,
      trackingPixelUrl,
      subscriberName: firstName,
    });

    // Envoyer l'email
    const emailResult = await sendEmail({
      to: email,
      subject: "Test d'envoi depuis l'administration ABC Bédarieux",
      html: emailHtml,
    });

    if (emailResult.success) {
      // Mettre à jour la date du dernier email envoyé
      await prisma.newsletterSubscriber.update({
        where: { id: subscriberId },
        data: { lastEmailSent: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: emailResult.development 
          ? "Email de test loggé en mode développement"
          : "Email de test envoyé avec succès",
        development: emailResult.development,
        messageId: emailResult.messageId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "Erreur lors de l'envoi de l'email",
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de test:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}