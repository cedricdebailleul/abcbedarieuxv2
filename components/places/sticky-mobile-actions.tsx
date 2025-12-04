"use client";

import { Globe, MapPin, Phone, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShare } from "@/hooks/use-share";

interface StickyMobileActionsProps {
  phone?: string | null;
  website?: string | null;
  directionsUrl: string;
  placeName: string;
  className?: string;
  shareData?: {
    title: string;
    text: string;
    url: string;
  };
}

export function StickyMobileActions({
  phone,
  website,
  directionsUrl,
  placeName,
  className,
  shareData,
}: StickyMobileActionsProps) {
  const { share } = useShare();

  const handleShare = async () => {
    if (shareData) {
      await share(shareData);
    }
  };

  // Calculer combien de boutons on a pour ajuster la grille
  const hasPhone = !!phone;
  const hasWebsite = !!website;
  
  // Si on a tout : 4 boutons. Si pas de site : 3 boutons. Si pas de tel : 3 boutons.
  // On veut toujours afficher Itinéraire et Partager.

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-3 md:hidden safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
        {/* Bouton Appeler (Prioritaire) */}
        {hasPhone ? (
          <Button
            asChild
            variant="default"
            size="sm"
            className="col-span-2 flex flex-col h-auto py-2 gap-1"
          >
            <a href={`tel:${phone}`}>
              <Phone className="h-5 w-5" />
              <span className="text-xs font-medium">Appeler</span>
            </a>
          </Button>
        ) : (
           // Si pas de téléphone, on met le site web en grand ou rien
           hasWebsite ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="col-span-2 flex flex-col h-auto py-2 gap-1"
            >
              <a href={website!} target="_blank" rel="noopener noreferrer">
                <Globe className="h-5 w-5" />
                <span className="text-xs font-medium">Site web</span>
              </a>
            </Button>
           ) : (
             <div className="hidden" /> // Spacer if needed, but grid handles it
           )
        )}

        {/* Bouton Itinéraire */}
        <Button
          asChild
          variant={hasPhone ? "outline" : "default"} // Devient primaire si pas de tel
          size="sm"
          className={cn(
            "flex flex-col h-auto py-2 gap-1",
            !hasPhone && !hasWebsite ? "col-span-2" : "col-span-1"
          )}
        >
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
            <MapPin className="h-5 w-5" />
            <span className="text-xs font-medium">Itinéraire</span>
          </a>
        </Button>

        {/* Bouton Site Web (si pas déjà affiché en grand) */}
        {hasWebsite && hasPhone && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="flex flex-col h-auto py-2 gap-1 col-span-1"
          >
            <a href={website!} target="_blank" rel="noopener noreferrer">
              <Globe className="h-5 w-5" />
              <span className="text-xs font-medium">Site</span>
            </a>
          </Button>
        )}

        {/* Bouton Partager */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex flex-col h-auto py-2 gap-1",
            !hasPhone && !hasWebsite ? "col-span-2" : "col-span-1"
          )}
          onClick={handleShare}
        >
          <Share2 className="h-5 w-5" />
          <span className="text-xs font-medium">Partager</span>
        </Button>
      </div>
    </div>
  );
}
