"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  Monitor, 
  Smartphone, 
  Mail,
  Download,
} from "lucide-react";
import { ContentItem } from "../_hooks/useAvailableContent";

interface NewsletterPreviewProps {
  campaignTitle: string;
  subject: string;
  content: string;
  selectedEvents: ContentItem[];
  selectedPlaces: ContentItem[];
  selectedPosts: ContentItem[];
  attachments?: { name: string; size: number; type: string }[];
}

export function NewsletterPreview({
  campaignTitle,
  subject,
  content,
  selectedEvents,
  selectedPlaces,
  selectedPosts,
  attachments = []
}: NewsletterPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  type PreviewMode = 'visual' | 'html';
  const [previewMode, setPreviewMode] = useState<PreviewMode>('visual');

  // Fonction de sécurité pour échapper le HTML et prévenir les injections XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const formatDate = (dateString: string, isAllDay?: boolean) => {
    const date = new Date(dateString);
    if (isAllDay) {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateEmailHTML = () => {
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
        .content-section {
            margin: 30px 0;
        }
        .content-section h3 {
            color: #1f2937;
            margin-bottom: 15px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 8px;
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
            width: 80px;
            height: 80px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
        }
        .content-image-placeholder {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            background: #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            flex-shrink: 0;
        }
        .content-details h4 {
            margin: 0 0 8px 0;
            color: #1f2937;
            font-size: 18px;
        }
        .content-details h4 a {
            color: #1f2937;
            text-decoration: none;
        }
        .content-meta {
            margin-top: 12px;
            font-size: 13px;
            color: #6b7280;
        }
        .content-meta span {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-right: 12px;
        }
        .view-link {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
        }
        .attachments {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .attachment-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: white;
            border-radius: 6px;
            margin: 5px 0;
        }
        .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        @media (max-width: 480px) {
            .container { margin: 10px; }
            .header, .content { padding: 20px 15px; }
            .content-item { flex-direction: column; }
            .content-image, .content-image-placeholder { width: 100%; height: 200px; }
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
            <div class="greeting">Bonjour,</div>
            
            <h2 style="color: #1f2937; margin-bottom: 15px;">${escapeHtml(campaignTitle)}</h2>

            ${content ? `
            <div class="main-content">
                ${escapeHtml(content).replace(/\n/g, '<br>')}
            </div>
            ` : ''}
            
            ${selectedEvents.length > 0 ? `
            <div class="content-section">
                <h3>📅 Événements à venir</h3>
                ${selectedEvents.map(event => `
                <div class="content-item event">
                    ${event.coverImage ?
                        `<img src="${escapeHtml(event.coverImage)}" alt="${escapeHtml(event.title)}" class="content-image">` :
                        `<div class="content-image-placeholder">📅</div>`
                    }
                    <div class="content-details">
                        <h4><a href="/events/${escapeHtml(event.slug)}">${escapeHtml(event.title)}</a></h4>
                        ${event.description ? `<p style="margin: 8px 0; color: #4b5563; font-size: 14px;">${escapeHtml(event.description)}</p>` : ''}
                        <div class="content-meta">
                            ${event.startDate ? `<span>📅 ${escapeHtml(formatDate(event.startDate, event.isAllDay))}</span>` : ''}
                            ${event.location ? `<span>📍 ${escapeHtml(event.location)}</span>` : ''}
                            <br><a href="/events/${escapeHtml(event.slug)}" class="view-link">➡️ Voir les détails</a>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${selectedPlaces.length > 0 ? `
            <div class="content-section">
                <h3>🏪 Commerces à découvrir</h3>
                ${selectedPlaces.map(place => `
                <div class="content-item place">
                    ${place.coverImage || place.logo ?
                        `<img src="${escapeHtml(place.coverImage || place.logo)}" alt="${escapeHtml(place.title)}" class="content-image">` :
                        `<div class="content-image-placeholder">🏪</div>`
                    }
                    <div class="content-details">
                        <h4><a href="/places/${escapeHtml(place.slug)}">${escapeHtml(place.title)}</a></h4>
                        ${place.description ? `<p style="margin: 8px 0; color: #4b5563; font-size: 14px;">${escapeHtml(place.description)}</p>` : ''}
                        <div class="content-meta">
                            ${place.location ? `<span>📍 ${escapeHtml(place.location)}</span>` : ''}
                            ${place.phone ? `<span>📞 ${escapeHtml(place.phone)}</span>` : ''}
                            ${place.website ? `<span>🌐 Site web</span>` : ''}
                            <br><a href="/places/${escapeHtml(place.slug)}" class="view-link">➡️ Voir la fiche</a>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${selectedPosts.length > 0 ? `
            <div class="content-section">
                <h3>📄 Actualités</h3>
                ${selectedPosts.map(post => `
                <div class="content-item post">
                    ${post.coverImage ?
                        `<img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" class="content-image">` :
                        `<div class="content-image-placeholder">📄</div>`
                    }
                    <div class="content-details">
                        <h4><a href="/posts/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></h4>
                        ${post.description ? `<p style="margin: 8px 0; color: #4b5563; font-size: 14px;">${escapeHtml(post.description)}</p>` : ''}
                        <div class="content-meta">
                            ${post.publishedAt ? `<span>📅 ${escapeHtml(new Date(post.publishedAt).toLocaleDateString('fr-FR'))}</span>` : ''}
                            ${post.author ? `<span>👤 ${escapeHtml(post.author)}</span>` : ''}
                            <br><a href="/posts/${escapeHtml(post.slug)}" class="view-link">➡️ Lire l'article</a>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${attachments.length > 0 ? `
            <div class="attachments">
                <h3 style="margin-top: 0;">📎 Pièces jointes</h3>
                ${attachments.map(attachment => `
                <div class="attachment-item">
                    <span>${attachment.type.includes('pdf') ? '📄' : '🖼️'}</span>
                    <span>${escapeHtml(attachment.name)}</span>
                    <span style="color: #6b7280; font-size: 12px;">(${(attachment.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            <p style="margin-top: 25px; color: #6b7280; font-size: 14px;">
                Merci de votre fidélité à l'association ABC Bédarieux !
            </p>
        </div>
        
        <div class="footer">
            <div style="margin-top: 15px; font-weight: 600; color: #3b82f6;">
                Association Bédaricienne des Commerçants
            </div>
            <p style="margin: 10px 0;">
                Bédarieux, France<br>
                Cette newsletter vous est envoyée car vous êtes abonné à nos actualités.
            </p>
            <a href="#" style="color: #6b7280; text-decoration: none; margin-top: 10px; display: inline-block;">
                Se désabonner de cette newsletter
            </a>
        </div>
    </div>
</body>
</html>`;
  };

  const totalContentItems = selectedEvents.length + selectedPlaces.length + selectedPosts.length;
  const totalAttachmentSize = attachments.reduce((total, att) => total + att.size, 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Eye className="w-4 h-4 mr-2" />
          Aperçu complet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Aperçu de la newsletter</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {totalContentItems} élément{totalContentItems > 1 ? 's' : ''}
              </Badge>
              {attachments.length > 0 && (
                <Badge variant="outline">
                  {attachments.length} pièce{attachments.length > 1 ? 's' : ''} jointe{attachments.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'desktop' | 'mobile')}>
            <TabsList>
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as PreviewMode)}>
            <TabsList>
              <TabsTrigger value="visual" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visuel
              </TabsTrigger>
              <TabsTrigger value="html" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                HTML
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const blob = new Blob([generateEmailHTML()], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `newsletter-${campaignTitle.replace(/\s+/g, '-').toLowerCase()}.html`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger HTML
          </Button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden">
          {previewMode === 'visual' ? (
            <div className={`mx-auto transition-all duration-300 ${
              viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
            }`}>
              <ScrollArea className="h-[calc(90vh-200px)]">
                <div 
                  className="bg-gray-50 p-4 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: generateEmailHTML() }}
                />
              </ScrollArea>
            </div>
          ) : (
            <ScrollArea className="h-[calc(90vh-200px)]">
              <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                <code>{generateEmailHTML()}</code>
              </pre>
            </ScrollArea>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex justify-between items-center pt-4 border-t text-sm text-muted-foreground">
          <div>
            Sujet: <span className="font-medium">{subject || 'Pas de sujet'}</span>
          </div>
          {attachments.length > 0 && (
            <div>
              Pièces jointes: <span className="font-medium">
                {(totalAttachmentSize / 1024 / 1024).toFixed(1)} MB / 15 MB
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}