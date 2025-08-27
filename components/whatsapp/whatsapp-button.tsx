"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";

interface WhatsAppButtonProps {
  groupUrl?: string;
  message?: string;
  position?: "bottom-right" | "bottom-left";
  showLabel?: boolean;
  requireAuth?: boolean;
  requireVerification?: boolean;
}

export function WhatsAppButton({ 
  groupUrl = "https://chat.whatsapp.com/JC7fygRmrxnK2lGbQQHZWM",
  message = "Bonjour ! J'aimerais rejoindre la communauté ABC Bédarieux pour poser des questions sur le commerce local 🏪",
  position = "bottom-right",
  showLabel = true,
  requireAuth = true,
  requireVerification = true
}: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { data: session, status } = useSession();

  // Vérifier les permissions utilisateur
  const isUserAllowed = () => {
    if (!requireAuth) return true;
    if (!session?.user) return false;
    
    // Pour l'instant, on autorise tous les utilisateurs connectés
    // La vérification d'email sera ajoutée plus tard si nécessaire
    return true;
  };

  // Afficher le bouton après un délai et si l'utilisateur est autorisé
  useEffect(() => {
    if (status === "loading") return;
    
    if (isUserAllowed()) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [status, session]);

  // Auto-afficher le tooltip après quelques secondes
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowTooltip(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleWhatsAppClick = () => {
    // Pour un groupe, on utilise directement l'URL du groupe
    window.open(groupUrl, "_blank");
    setShowTooltip(false);
  };

  if (!isVisible) return null;

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6"
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Tooltip */}
      {showTooltip && (
        <Card className="absolute bottom-16 right-0 w-72 mb-2 shadow-lg border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  🏪 Commerce Local
                </p>
                <p className="text-xs text-muted-foreground">
                  Rejoignez notre groupe WhatsApp pour poser vos questions sur le commerce local de Bédarieux !
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTooltip(false)}
                className="h-6 w-6 p-0 ml-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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