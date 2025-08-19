import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

// Créer le transporteur email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Template HTML pour le bulletin
const createEmailTemplate = (bulletin: any, member: any) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${bulletin.title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background-color: #2563eb; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
        }
        .content { 
            background-color: #f9fafb; 
            padding: 30px; 
            border-radius: 0 0 8px 8px; 
        }
        .bulletin-content { 
            background-color: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 12px; 
        }
        .meeting-info {
            background-color: #dbeafe;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ABC Bédarieux</h1>
            <h2>${bulletin.title}</h2>
        </div>
        
        <div class="content">
            <p>Bonjour ${member.user.name},</p>
            
            <div class="bulletin-content">
                ${bulletin.content.replace(/\n/g, '<br>')}
            </div>
            
            ${bulletin.meeting ? `
            <div class="meeting-info">
                <h3>📅 Réunion associée</h3>
                <p><strong>${bulletin.meeting.title}</strong></p>
                <p>Date : ${new Date(bulletin.meeting.scheduledAt).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
            </div>
            ` : ''}
            
            <p>Cordialement,<br>L'équipe ABC Bédarieux</p>
        </div>
        
        <div class="footer">
            <p>Vous recevez cet email car vous êtes membre de l'association ABC Bédarieux.</p>
            <p>Association ABC Bédarieux - Bédarieux, France</p>
        </div>
    </div>
</body>
</html>
  `;
};

// POST /api/admin/abc/bulletins/[bulletinId]/send - Envoyer le bulletin aux membres
export async function POST(
  request: Request,
  { params }: { params: { bulletinId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !session.user.role || !["admin", "moderator"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer le bulletin
    const bulletin = await prisma.abcBulletin.findUnique({
      where: { id: params.bulletinId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        meeting: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
          },
        },
      },
    });

    if (!bulletin) {
      return NextResponse.json(
        { error: "Bulletin non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le bulletin n'a pas déjà été envoyé
    if (bulletin.isPublished) {
      return NextResponse.json(
        { error: "Ce bulletin a déjà été publié" },
        { status: 400 }
      );
    }

    // Récupérer tous les membres actifs de l'association
    const members = await prisma.abcMember.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (members.length === 0) {
      return NextResponse.json(
        { error: "Aucun membre actif trouvé" },
        { status: 400 }
      );
    }

    // Créer le transporteur email
    const transporter = createTransporter();

    // Statistiques d'envoi
    let sentCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Envoyer l'email à chaque membre
    for (const member of members) {
      try {
        const emailTemplate = createEmailTemplate(bulletin, member);

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: member.user.email,
          subject: `[ABC Bédarieux] ${bulletin.title}`,
          html: emailTemplate,
        });

        sentCount++;
        console.log(`Email envoyé à ${member.user.email}`);

      } catch (emailError) {
        errorCount++;
        const errorMessage = `Erreur envoi à ${member.user.email}: ${emailError}`;
        errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    // Marquer le bulletin comme publié
    await prisma.abcBulletin.update({
      where: { id: params.bulletinId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    // Réponse avec statistiques
    const response = {
      message: `Bulletin envoyé avec succès`,
      stats: {
        totalMembers: members.length,
        sentCount,
        errorCount,
        errors: errors.slice(0, 5), // Limiter les erreurs affichées
      },
    };

    console.log(`Bulletin ${bulletin.title} envoyé:`, response.stats);

    return NextResponse.json(response);

  } catch (error) {
    console.error("Erreur lors de l'envoi du bulletin:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}