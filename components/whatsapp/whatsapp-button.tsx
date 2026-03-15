"use client";

import { useState, useEffect, useCallback } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

interface WhatsAppButtonProps {
  groupUrl?: string;
  position?: "bottom-right" | "bottom-left";
  showLabel?: boolean;
  requireAuth?: boolean;
}

export function WhatsAppButton({ 
  groupUrl = "https://chat.whatsapp.com/JC7fygRmrxnK2lGbQQHZWM",
  position = "bottom-right",
  showLabel = true,
  requireAuth = true
}: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { data: session, status } = useSession();

  // Vérifier les permissions utilisateur
  const isUserAllowed = useCallback(() => {
    if (!requireAuth) return true;
    if (!session?.user) return false;
    
    // Pour l'instant, on autorise tous les utilisateurs connectés
    // La vérification d'email sera ajoutée plus tard si nécessaire
    return true;
  }, [requireAuth, session?.user]);

  // Afficher le bouton après un délai et si l'utilisateur est autorisé
  useEffect(() => {
    if (status === "loading") return;
    
    if (isUserAllowed()) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [status, session, isUserAllowed]);

  const handleWhatsAppClick = () => {
    window.open(groupUrl, "_blank");
  };

  if (!isVisible) return null;

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6"
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Bouton principal */}
      <div className="relative">
        <Button
          onClick={handleWhatsAppClick}
          className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-10 relative"
          aria-label="Rejoindre le groupe WhatsApp Commerce Local"
          title="Rejoindre le groupe WhatsApp Commerce Local"
        >
          <Users className="h-6 w-6" />
        </Button>

        {/* Label optionnel */}
        {showLabel && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-foreground text-background px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Rejoindre le groupe Commerce Local
          </div>
        )}

        {/* Animation de pulsation */}
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"></div>
      </div>
    </div>
  );
}