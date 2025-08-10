"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";

interface ShareButtonProps {
  title: string;
  excerpt?: string | null;
}

export function ShareButton({ title, excerpt }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [hasWebShare, setHasWebShare] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasWebShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  const handleShare = async () => {
    if (!mounted) return;
    
    const url = window.location.href;
    
    // Vérifier si l'API Web Share est disponible (mobile principalement)
    if (hasWebShare) {
      try {
        await navigator.share({
          title: title,
          text: excerpt || "Découvrez cet article",
          url: url,
        });
        return;
      } catch (error) {
        // Fallback vers la copie si l'utilisateur annule le partage
      }
    }
    
    // Fallback : copier l'URL dans le presse-papiers
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
    }
  };

  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        disabled
        className="w-full"
      >
        <Copy className="h-4 w-4 mr-2" />
        Partager l'article
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleShare}
      className="w-full"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          URL copiée !
        </>
      ) : (
        <>
          {hasWebShare ? (
            <Share2 className="h-4 w-4 mr-2" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {hasWebShare ? "Partager l'article" : "Copier le lien"}
        </>
      )}
    </Button>
  );
}