"use client";

import { useState } from "react";
import {
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Printer,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export interface ShareData {
  title: string;
  description: string;
  url: string;
  image?: string;
  type: "post" | "event" | "place";
  hashtags?: string[];
  // Données spécifiques selon le type
  eventDate?: string;
  eventLocation?: string;
  placeAddress?: string;
  placeCategory?: string;
  // Données structurées pour Facebook Events
  structuredData?: {
    startDate: string;
    endDate: string;
    isAllDay: boolean;
    timezone: string;
  };
}

interface SocialShareProps {
  data: ShareData;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

// URLs de partage optimisées pour chaque plateforme
const getShareUrls = (data: ShareData) => {
  const encodedUrl = encodeURIComponent(data.url);
  const encodedTitle = encodeURIComponent(data.title);
  const encodedDescription = encodeURIComponent(data.description);

  // Hashtags optimisés selon le type
  const typeHashtags = {
    event: ["Bédarieux", "Événement", "Sortie"],
    place: ["Bédarieux", "Découverte", "Local"],
    post: ["Bédarieux", "Info", "Actualité"],
  };

  const allHashtags = [...(data.hashtags || []), ...typeHashtags[data.type]];
  const hashtagString = allHashtags
    .filter(Boolean)
    .map((tag) => {
      // Si c'est un string, l'utiliser directement, sinon essayer d'extraire le nom
      const tagString =
        typeof tag === "string"
          ? tag
          : (tag as { name?: string })?.name || String(tag);
      return `#${tagString.replace(/\s+/g, "")}`;
    })
    .join(" ");

  // Texte optimisé selon le type et la plateforme
  const getOptimizedText = (platform: string) => {
    let text = data.title;

    if (data.type === "event" && data.eventDate) {
      text += ` - ${data.eventDate}`;
      if (data.eventLocation) text += ` à ${data.eventLocation}`;
    } else if (data.type === "place" && data.placeAddress) {
      text += ` - ${data.placeAddress}`;
      if (data.placeCategory) text += ` (${data.placeCategory})`;
    }

    // Ajouter description pour certaines plateformes
    if (platform === "facebook" || platform === "email") {
      text += `\n\n${data.description}`;
    }

    return text;
  };

  return {
    // Facebook standard sharer (utilise Open Graph de la page)
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,

    // Facebook Event (création d'événement si c'est un event)
    facebookEvent:
      data.type === "event" && data.eventDate
        ? `https://www.facebook.com/events/create/?event[name]=${encodedTitle}&event[description]=${encodedDescription}&event[location]=${encodeURIComponent(
            data.eventLocation || ""
          )}&event[start_time]=${encodeURIComponent(data.eventDate)}`
        : null,

    twitter: (() => {
      const twitterText = `${getOptimizedText("twitter")}\n\n${hashtagString}`;
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        twitterText
      )}&url=${encodedUrl}`;
    })(),

    // Instagram ne permet pas le partage direct, on ouvre l'app ou le site
    instagram: "https://www.instagram.com/",

    email: (() => {
      const subject = encodeURIComponent(`À découvrir : ${data.title}`);
      const body = encodeURIComponent(
        `Bonjour,\n\nJe pense que ceci pourrait vous intéresser :\n\n` +
          `${data.title}\n${data.description}\n\n` +
          `Plus d'informations : ${data.url}\n\n` +
          `Bonne découverte !`
      );
      return `mailto:?subject=${subject}&body=${body}`;
    })(),

    whatsapp: (() => {
      const text = `${getOptimizedText("whatsapp")}\n\n${data.url}`;
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
    })(),

    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
};

export function SocialShare({
  data,
  variant = "outline",
  size = "default",
  showLabel = true,
  className = "",
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const shareUrls = getShareUrls(data);

  const handleShare = (platform: string, url: string) => {
    if (platform === "copy") {
      navigator.clipboard
        .writeText(data.url)
        .then(() => {
          setCopied(true);
          toast.success("Lien copié dans le presse-papiers");
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          toast.error("Erreur lors de la copie du lien");
        });
      return;
    }

    if (platform === "print") {
      // Ajouter les classes CSS d'impression avant d'imprimer
      document.body.classList.add("printing");

      // Attendre un court délai pour que les styles s'appliquent
      setTimeout(() => {
        window.print();
        // Nettoyer après impression
        setTimeout(() => {
          document.body.classList.remove("printing");
        }, 500);
      }, 100);

      return;
    }

    if (platform === "instagram") {
      // Pour Instagram, on copie le texte et ouvre l'app
      const instagramText = `${data.title}\n\n${data.description}\n\n${data.url}`;
      navigator.clipboard
        .writeText(instagramText)
        .then(() => {
          toast.success("Texte copié ! Collez-le dans Instagram");
          window.open(url, "_blank", "noopener,noreferrer");
        })
        .catch(() => {
          toast.error("Erreur lors de la copie du texte");
        });
      return;
    }

    // Partage natif si disponible
    if (navigator.share && platform === "native") {
      navigator
        .share({
          title: data.title,
          text: data.description,
          url: data.url,
        })
        .catch(() => {
          // Fallback silencieux si l'utilisateur annule
        });
      return;
    }

    // Vérifier si on est en local et informer l'utilisateur
    if (platform === "facebook" && data.url.includes("localhost")) {
      toast.info(
        "💡 En local : Utilisez ngrok pour tester le partage Facebook réel. Les métadonnées Open Graph sont prêtes !"
      );
      // On continue quand même pour que l'utilisateur voie la popup Facebook
    }

    // Ouvrir dans une nouvelle fenêtre
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      url,
      "shareWindow",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // Fonction pour le partage natif si disponible
  const hasNativeShare = typeof navigator !== "undefined" && navigator.share;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="w-4 h-4" />
          {showLabel && <span className="ml-2">Partager</span>}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {/* Partage natif en premier si disponible */}
        {hasNativeShare && (
          <>
            <DropdownMenuItem onClick={() => handleShare("native", "")}>
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Réseaux sociaux */}
        <DropdownMenuItem
          onClick={() => handleShare("facebook", shareUrls.facebook)}
        >
          <Facebook className="w-4 h-4 mr-2 text-blue-600" />
          Partager sur Facebook
        </DropdownMenuItem>

        {/* Création d'événement Facebook si applicable */}
        {shareUrls.facebookEvent && (
          <DropdownMenuItem
            onClick={() =>
              shareUrls.facebookEvent &&
              handleShare("facebook-event", shareUrls.facebookEvent)
            }
          >
            <Facebook className="w-4 h-4 mr-2 text-blue-600" />
            Créer événement Facebook
            <span className="ml-auto text-xs text-muted-foreground">Event</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => handleShare("twitter", shareUrls.twitter)}
        >
          <Twitter className="w-4 h-4 mr-2 text-sky-500" />
          Twitter / X
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare("instagram", shareUrls.instagram)}
        >
          <Instagram className="w-4 h-4 mr-2 text-pink-600" />
          Instagram
          <span className="ml-auto text-xs text-muted-foreground">Copie</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare("linkedin", shareUrls.linkedin)}
        >
          <ExternalLink className="w-4 h-4 mr-2 text-blue-700" />
          LinkedIn
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleShare("whatsapp", shareUrls.whatsapp)}
        >
          <svg
            className="w-4 h-4 mr-2 text-green-600"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
          </svg>
          WhatsApp
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Actions utilitaires */}
        <DropdownMenuItem onClick={() => handleShare("email", shareUrls.email)}>
          <Mail className="w-4 h-4 mr-2" />
          Email
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleShare("copy", "")}>
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copied ? "Copié !" : "Copier le lien"}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleShare("print", "")}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
