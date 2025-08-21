import nodemailer from 'nodemailer';
import { env } from '@/lib/env';
import DOMPurify from 'isomorphic-dompurify';

// Configuration du transporteur email
const createTransporter = () => {
  if (!env.SMTP_HOST) {
    // Pour le développement, utiliser un transporteur qui log seulement
    console.log('📧 Mode développement: Les emails seront loggés mais pas envoyés');
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  // Pour la production, utiliser les vraies configurations SMTP
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 465,
    secure: env.SMTP_SECURE || true, // true for port 465 (SSL)
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
};

// Configuration pour la sanitisation HTML
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'a', 'b', 'strong', 'i', 'em', 'u', 'br', 'p', 'div', 'span', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'img',
    'table', 'thead', 'tbody', 'tr', 'td', 'th'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'style', 'class', 'id',
    'width', 'height', 'target', 'rel'
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input']
};

// Fonction pour sanitiser le contenu HTML
export function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  try {
    return DOMPurify.sanitize(html, SANITIZE_CONFIG);
  } catch (error) {
    console.error('Erreur lors de la sanitisation HTML:', error);
    // En cas d'erreur, retourner le texte sans HTML
    return html.replace(/<[^>]*>/g, '');
  }
}

// Fonction pour sanitiser les en-têtes d'email
export function sanitizeEmailHeader(header: string): string {
  if (!header || typeof header !== 'string') {
    return '';
  }
  
  // Supprimer les caractères dangereux pour les en-têtes
  return header
    .replace(/[\r\n]/g, '') // Supprimer les retours à la ligne
    .replace(/[<>]/g, '') // Supprimer les chevrons
    .trim()
    .substring(0, 255); // Limiter la longueur
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
}

export async function sendEmail({ to, subject, html, text, from, attachments }: EmailOptions) {
  try {
    const transporter = createTransporter();
    
    // Sanitiser le contenu HTML et les en-têtes
    const sanitizedHtml = sanitizeHtmlContent(html);
    const sanitizedSubject = sanitizeEmailHeader(subject);
    const sanitizedTo = sanitizeEmailHeader(to);
    
    const mailOptions = {
      from: from || env.SMTP_FROM || 'ABC Bédarieux <noreply@abc-bedarieux.fr>',
      to: sanitizedTo,
      subject: sanitizedSubject,
      html: sanitizedHtml,
      text: text || sanitizedHtml.replace(/<[^>]*>/g, ''), // Fallback texte sans HTML
      attachments: attachments || undefined,
    };

    const result = await (transporter as nodemailer.Transporter).sendMail(mailOptions);
    
    // En mode développement, extraire et logger le contenu
    if (!env.SMTP_HOST) {
      const emailContent = result.messageId || '';
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
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue',
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
  places = [],
  posts = [],
  events = [],
  attachments = [],
  campaignId,
  subscriberId,
}: {
  campaignTitle: string;
  subject: string;
  content: string;
  unsubscribeUrl: string;
  trackingPixelUrl: string;
  subscriberName?: string;
  places?: Array<{
    name: string;
    slug: string;
    coverImage?: string;
    logo?: string;
    summary?: string;
    street?: string;
    city?: string;
    phone?: string;
    website?: string;
  }>;
  posts?: Array<{
    title: string;
    slug: string;
    coverImage?: string;
    excerpt?: string;
    publishedAt?: string;
    author?: { name: string };
  }>;
  events?: Array<{
    title: string;
    slug: string;
    coverImage?: string;
    description?: string;
    startDate?: string;
    locationName?: string;
    locationAddress?: string;
    locationCity?: string;
  }>;
  attachments?: { name: string; url: string; size: number; type: string }[];
  campaignId?: string;
  subscriberId?: string;
}) {
  
  // En développement, utiliser localhost, en production abc-bedarieux.fr
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? (process.env.NEXTAUTH_URL || 'https://abc-bedarieux.fr')
    : 'http://localhost:3001';
  
  // Fonction helper pour créer des liens trackés
  const createTrackedLink = (destinationUrl: string) => {
    if (campaignId && subscriberId) {
      return `${baseUrl}/api/newsletter/track/click?c=${campaignId}&s=${subscriberId}&url=${encodeURIComponent(destinationUrl)}`;
    }
    return destinationUrl;
  };
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
        .content-item {
            background: #f8fafc;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            display: flex;
            align-items: flex-start;
            gap: 15px;
        }
        .content-item.event {
            border-left: 4px solid #f59e0b;
            background: #fef3c7;
        }
        .content-item.place {
            border-left: 4px solid #10b981;
        }
        .content-item.post {
            border-left: 4px solid #8b5cf6;
            background: #ede9fe;
        }
        .content-image {
            width: 120px;
            height: 120px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
        }
        .content-image-placeholder {
            width: 120px;
            height: 120px;
            border-radius: 8px;
            background: #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-size: 32px;
            flex-shrink: 0;
        }
        .content-details {
            flex: 1;
            min-width: 0;
        }
        .content-details h4 {
            margin: 0 0 8px 0;
            color: #1f2937;
            font-size: 18px;
            line-height: 1.3;
        }
        .content-details h4 a {
            color: #1f2937;
            text-decoration: none;
        }
        .content-meta {
            margin-top: 12px;
            font-size: 13px;
            color: #6b7280;
            line-height: 1.4;
        }
        .content-meta span {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-right: 12px;
            margin-bottom: 4px;
        }
        .view-link {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-top: 8px;
        }
        .attachments {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }
        .attachments h3 {
            margin: 0 0 15px 0;
            color: #1f2937;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .attachment-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            background: white;
            border-radius: 6px;
            margin: 8px 0;
            border: 1px solid #e5e7eb;
        }
        .attachment-icon {
            font-size: 20px;
        }
        .attachment-info {
            flex: 1;
        }
        .attachment-name {
            font-weight: 500;
            color: #1f2937;
            margin-bottom: 2px;
        }
        .attachment-size {
            color: #6b7280;
            font-size: 12px;
        }
        @media (max-width: 480px) {
            .container { margin: 10px; }
            .header, .content { padding: 20px 15px; }
            .content-item { 
                flex-direction: column; 
                text-align: center;
            }
            .content-image, .content-image-placeholder { 
                width: 100%; 
                height: 200px; 
                margin: 0 auto 15px auto;
            }
            .content-details {
                text-align: left;
            }
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
            
            ${campaignId && subscriberId ? `
            <div style="text-align: center; margin-bottom: 20px; padding: 10px; background: #f8fafc; border-radius: 6px;">
                <a href="${baseUrl}/api/newsletter/web-view?c=${campaignId}&s=${subscriberId}" 
                   style="color: #3b82f6; text-decoration: none; font-size: 12px;">
                    📧 Voir cette newsletter dans votre navigateur
                </a>
            </div>
            ` : ''}
            
            <h2 style="color: #1f2937; margin-bottom: 15px;">${sanitizeEmailHeader(campaignTitle)}</h2>
            
            <div class="main-content">
                ${sanitizeHtmlContent(content.replace(/\n/g, '<br>'))}
            </div>
            
            ${places.length > 0 ? `
            <div style="margin: 30px 0;">
                <h3 style="color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">🏪 Commerces à découvrir</h3>
                ${places.map(place => `
                <div class="content-item place">
                    ${place.coverImage || place.logo ? 
                        `<img src="${place.coverImage || place.logo}" alt="${place.name}" class="content-image">` :
                        `<div class="content-image-placeholder">🏪</div>`
                    }
                    <div class="content-details">
                        <h4>
                            <a href="${createTrackedLink(`${baseUrl}/places/${place.slug}`)}">
                                ${place.name}
                            </a>
                        </h4>
                        ${place.summary ? `<p style="margin: 8px 0; color: #4b5563; font-size: 14px;">${place.summary}</p>` : ''}
                        <div class="content-meta">
                            ${place.street ? `<span>📍 ${place.street}, ${place.city}</span>` : ''}
                            ${place.phone ? `<span>📞 ${place.phone}</span>` : ''}
                            ${place.website ? `<span>🌐 <a href="${place.website}" style="color: #3b82f6; text-decoration: none;" target="_blank">Site web</a></span>` : ''}
                            <br>
                            <a href="${createTrackedLink(`${baseUrl}/places/${place.slug}`)}" class="view-link">
                                ➡️ Voir la fiche complète
                            </a>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${events.length > 0 ? `
            <div style="margin: 30px 0;">
                <h3 style="color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">📅 Événements à venir</h3>
                ${events.map(event => `
                <div class="content-item event">
                    ${event.coverImage ? 
                        `<img src="${event.coverImage}" alt="${event.title}" class="content-image">` :
                        `<div class="content-image-placeholder">📅</div>`
                    }
                    <div class="content-details">
                        <h4>
                            <a href="${createTrackedLink(`${baseUrl}/events/${event.slug}`)}">
                                ${event.title}
                            </a>
                        </h4>
                        ${event.description ? `<p style="margin: 8px 0; color: #4b5563; font-size: 14px;">${event.description}</p>` : ''}
                        <div class="content-meta">
                            ${event.startDate ? `<span>📅 ${new Date(event.startDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>` : ''}
                            ${event.locationName || event.locationAddress || event.locationCity ? `<span>📍 ${[event.locationName, event.locationAddress, event.locationCity].filter(Boolean).join(', ')}</span>` : ''}
                            <br>
                            <a href="${createTrackedLink(`${baseUrl}/events/${event.slug}`)}" class="view-link">
                                ➡️ Voir les détails de l'événement
                            </a>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${posts.length > 0 ? `
            <div style="margin: 30px 0;">
                <h3 style="color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">📄 Actualités</h3>
                ${posts.map(post => `
                <div class="content-item post">
                    ${post.coverImage ? 
                        `<img src="${post.coverImage}" alt="${post.title}" class="content-image">` :
                        `<div class="content-image-placeholder">📄</div>`
                    }
                    <div class="content-details">
                        <h4>
                            <a href="${createTrackedLink(`${baseUrl}/posts/${post.slug}`)}">
                                ${post.title}
                            </a>
                        </h4>
                        ${post.excerpt ? `<p style="margin: 8px 0; color: #4b5563; font-size: 14px;">${post.excerpt}</p>` : ''}
                        <div class="content-meta">
                            ${post.publishedAt ? `<span>📅 ${new Date(post.publishedAt).toLocaleDateString('fr-FR')}</span>` : ''}
                            ${post.author ? `<span>👤 ${post.author.name}</span>` : ''}
                            <br>
                            <a href="${createTrackedLink(`${baseUrl}/posts/${post.slug}`)}" class="view-link">
                                ➡️ Lire l'article complet
                            </a>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${attachments.length > 0 ? `
            <div class="attachments">
                <h3>📎 Pièces jointes</h3>
                ${attachments.map(attachment => `
                <div class="attachment-item">
                    <span class="attachment-icon">${attachment.type.includes('pdf') ? '📄' : '🖼️'}</span>
                    <div class="attachment-info">
                        <div class="attachment-name">${attachment.name}</div>
                        <div class="attachment-size">${(attachment.size / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                    <a href="${attachment.url}" style="color: #3b82f6; text-decoration: none; font-size: 14px;" download>
                        Télécharger
                    </a>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
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
            
            <!-- Pixels de tracking pour les ouvertures (multiples méthodes) -->
            <img src="${trackingPixelUrl}" width="1" height="1" style="display: block; opacity: 0; position: absolute; top: 0; left: 0;" alt="">
            <img src="${trackingPixelUrl}&t=${Date.now()}" width="1" height="1" style="display: none;" alt="">
            <div style="background: url('${trackingPixelUrl}&method=css'); width: 1px; height: 1px; opacity: 0;"></div>
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