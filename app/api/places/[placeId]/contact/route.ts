import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  subject: z.string().min(5, "L'objet doit faire au moins 5 caractères"),
  message: z.string().min(10, "Le message doit faire au moins 10 caractères"),
  placeName: z.string(),
  ownerEmail: z.string().email(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await context.params;
    const body = await request.json();

    // Validation des données
    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, email, subject, message, placeName } = validation.data;

    // Vérifier que la place existe et récupérer les informations du propriétaire
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      include: {
        owner: {
          select: {
            email: true,
            name: true,
            profile: {
              select: {
                firstname: true,
                lastname: true,
              },
            },
          },
        },
      },
    });

    if (!place) {
      return NextResponse.json({ error: "Lieu non trouvé" }, { status: 404 });
    }

    const contactEmail = place.owner?.email || place.email;
    if (!contactEmail) {
      return NextResponse.json(
        { error: "Aucun email de contact disponible pour ce lieu" },
        { status: 400 }
      );
    }

    // Créer le template d'email pour le contact
    const contactName =
      place.owner?.profile?.firstname && place.owner?.profile?.lastname
        ? `${place.owner.profile.firstname} ${place.owner.profile.lastname}`
        : place.owner?.name || `Responsable de ${place.name}`;

    const emailHtml = createContactEmailTemplate({
      ownerName: contactName,
      placeName,
      senderName: name,
      senderEmail: email,
      subject,
      message,
    });

    // Envoyer l'email au contact
    const emailResult = await sendEmail({
      to: contactEmail,
      subject: `[ABC Bédarieux] ${subject}`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error("Erreur envoi email:", emailResult.error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message envoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur API contact:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Template d'email pour les messages de contact
function createContactEmailTemplate({
  ownerName,
  placeName,
  senderName,
  senderEmail,
  subject,
  message,
}: {
  ownerName: string;
  placeName: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}) {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? process.env.NEXTAUTH_URL || "https://abc-bedarieux.fr"
      : "http://localhost:3001";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau message de contact - ${placeName}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px 20px;
        }
        .message-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
        }
        .sender-info {
            background: #ecfdf5;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 3px solid #10b981;
        }
        .message-content {
            background: #fefefe;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            margin: 20px 0;
            font-style: italic;
            line-height: 1.7;
        }
        .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        .reply-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 6px;
            font-weight: 600;
            margin: 15px 0;
        }
        .reply-button:hover {
            background: #2563eb;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .info-label {
            font-weight: 600;
            color: #475569;
        }
        .info-value {
            color: #1e293b;
        }
        @media (max-width: 480px) {
            .container { margin: 10px; }
            .header, .content { padding: 20px 15px; }
            .info-row {
                flex-direction: column;
                gap: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 Nouveau message de contact</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">ABC Bédarieux</p>
        </div>
        
        <div class="content">
            <p>Bonjour ${ownerName},</p>
            
            <p>Vous avez reçu un nouveau message de contact pour <strong>${placeName}</strong> via le site ABC Bédarieux.</p>
            
            <div class="message-info">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">📧 ${subject}</h3>
                
                <div class="sender-info">
                    <div class="info-row">
                        <span class="info-label">👤 Nom :</span>
                        <span class="info-value">${senderName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">✉️ Email :</span>
                        <span class="info-value">${senderEmail}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">🏪 Lieu concerné :</span>
                        <span class="info-value">${placeName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">📅 Date :</span>
                        <span class="info-value">${new Date().toLocaleDateString(
                          "fr-FR",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}</span>
                    </div>
                </div>
            </div>
            
            <div class="message-content">
                <h4 style="margin: 0 0 15px 0; color: #374151;">💬 Message :</h4>
                <div style="white-space: pre-wrap; color: #1f2937; font-size: 15px;">
${message.trim()}
                </div>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
                <a href="mailto:${senderEmail}?subject=Re: ${encodeURIComponent(subject)}" 
                   class="reply-button">
                    Répondre à ${senderName}
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
                💡 <strong>Conseil :</strong> Pour répondre à ce message, cliquez sur le bouton ci-dessus ou répondez directement à cet email. L'adresse de ${senderName} apparaîtra automatiquement comme destinataire.
            </p>
        </div>
        
        <div class="footer">
            <div style="font-weight: 600; color: #3b82f6; margin-bottom: 10px;">
                Association Bédaricienne des Commerçants
            </div>
            <p style="margin: 5px 0;">
                Ce message vous a été transmis automatiquement depuis votre fiche sur ABC Bédarieux.<br>
                Bédarieux, France
            </p>
            <p style="margin: 15px 0 5px 0;">
                <a href="${baseUrl}" style="color: #3b82f6; text-decoration: none;">
                    🌐 Visiter ABC Bédarieux
                </a>
            </p>
        </div>
    </div>
</body>
</html>`;
}
