import nodemailer from 'nodemailer';
import { env } from '@/lib/env';

// Configuration du transporteur email
const createTransporter = () => {
  if (env.NODE_ENV === 'development' || !env.SMTP_HOST) {
    // Pour le développement, utiliser un transporteur qui log seulement
    console.log('📧 Mode développement: Les emails seront loggés mais pas envoyés');
    return nodemailer.createTransporter({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  // Pour la production, utiliser les vraies configurations SMTP
  return nodemailer.createTransporter({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_SECURE || false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, text, from }: EmailOptions) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: from || env.SMTP_FROM || 'ABC Bédarieux <noreply@abc-bedarieux.fr>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback texte sans HTML
    };

    const result = await transporter.sendMail(mailOptions);
    
    // En mode développement, extraire et logger le contenu
    if (env.NODE_ENV === 'development' || !env.SMTP_HOST) {
      const emailContent = result.message?.toString() || '';
      console.log('📧 Email simulé envoyé:', {
        to,
        subject,
        preview: emailContent.substring(0, 200) + '...',
      });
      
      return {
        success: true,
        messageId: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        accepted: [to],
        rejected: [],
        development: true,
      };
    }

    console.log('📧 Email envoyé en production:', {
      messageId: result.messageId,
      to,
      subject,
      accepted: result.accepted,
      rejected: result.rejected,
    });

    return {
      success: true,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      development: false,
    };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Templates d'emails pour la newsletter
export function createNewsletterEmailTemplate({
  campaignTitle,
  subject,
  content,
  unsubscribeUrl,
  trackingPixelUrl,
  subscriberName,
}: {
  campaignTitle: string;
  subject: string;
  content: string;
  unsubscribeUrl: string;
  trackingPixelUrl: string;
  subscriberName?: string;
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
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
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #4b5563;
        }
        .main-content {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
        }
        .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        .unsubscribe-link {
            color: #6b7280;
            text-decoration: none;
            margin-top: 10px;
            display: inline-block;
        }
        .unsubscribe-link:hover {
            color: #374151;
        }
        .branding {
            margin-top: 15px;
            font-weight: 600;
            color: #3b82f6;
        }
        @media (max-width: 480px) {
            .container { margin: 10px; }
            .header, .content { padding: 20px 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ABC Bédarieux</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Association Bédaricienne des Commerçants</p>
        </div>
        
        <div class="content">
            ${subscriberName ? `<div class="greeting">Bonjour ${subscriberName},</div>` : ''}
            
            <h2 style="color: #1f2937; margin-bottom: 15px;">${campaignTitle}</h2>
            
            <div class="main-content">
                ${content.replace(/\n/g, '<br>')}
            </div>
            
            <p style="margin-top: 25px; color: #6b7280; font-size: 14px;">
                Merci de votre fidélité à l'association ABC Bédarieux !
            </p>
        </div>
        
        <div class="footer">
            <div class="branding">
                Association Bédaricienne des Commerçants
            </div>
            <p style="margin: 10px 0;">
                Bédarieux, France<br>
                Cette newsletter vous est envoyée car vous êtes abonné à nos actualités.
            </p>
            <a href="${unsubscribeUrl}" class="unsubscribe-link">
                Se désabonner de cette newsletter
            </a>
            
            <!-- Pixel de tracking pour les ouvertures -->
            <img src="${trackingPixelUrl}" width="1" height="1" style="display: none;" alt="">
        </div>
    </div>
</body>
</html>`;
}

// Template pour l'email de vérification d'abonnement
export function createVerificationEmailTemplate({
  verificationUrl,
  subscriberName,
}: {
  verificationUrl: string;
  subscriberName?: string;
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmez votre abonnement - ABC Bédarieux</title>
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
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .content {
            padding: 30px 20px;
            text-align: center;
        }
        .verify-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: background-color 0.2s;
        }
        .verify-button:hover {
            background: #2563eb;
        }
        .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bienvenue !</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">ABC Bédarieux</p>
        </div>
        
        <div class="content">
            ${subscriberName ? `<p>Bonjour ${subscriberName},</p>` : ''}
            
            <p>Merci de vous être abonné à notre newsletter !</p>
            
            <p>Pour confirmer votre abonnement et commencer à recevoir nos actualités, veuillez cliquer sur le bouton ci-dessous :</p>
            
            <a href="${verificationUrl}" class="verify-button">
                Confirmer mon abonnement
            </a>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
                Si vous n'avez pas demandé cet abonnement, vous pouvez ignorer cet email.
            </p>
        </div>
        
        <div class="footer">
            <p>Association Bédaricienne des Commerçants<br>Bédarieux, France</p>
        </div>
    </div>
</body>
</html>`;
}