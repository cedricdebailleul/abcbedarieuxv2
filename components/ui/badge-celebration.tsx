"use client";

import { Badge, Trophy, Zap, Star, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BadgeCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  badge: {
    title: string;
    description: string;
    iconUrl?: string | null;
    color?: string | null;
    rarity: string;
  };
  reason: string;
}

export function BadgeCelebration({ isOpen, onClose, badge, reason }: BadgeCelebrationProps) {
  const [showContent, setShowContent] = useState(false);
  const [fireworksActive, setFireworksActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Délai pour déclencher l'animation de contenu
      const contentTimer = setTimeout(() => setShowContent(true), 300);
      // Déclencher les feux d'artifice
      const fireworksTimer = setTimeout(() => setFireworksActive(true), 500);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(fireworksTimer);
      };
    } else {
      setShowContent(false);
      setFireworksActive(false);
    }
  }, [isOpen]);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "from-gray-400 to-gray-600 border-gray-500";
      case "uncommon":
        return "from-green-400 to-green-600 border-green-500";
      case "rare":
        return "from-blue-400 to-blue-600 border-blue-500";
      case "epic":
        return "from-purple-400 to-purple-600 border-purple-500";
      case "legendary":
        return "from-yellow-400 to-yellow-600 border-yellow-500";
      default:
        return "from-gray-400 to-gray-600 border-gray-500";
    }
  };

  const getBadgeIcon = () => {
    if (badge.iconUrl) {
      // Vérifier si c'est une URL (commence par http/https) ou un emoji
      const isUrl = badge.iconUrl.startsWith('http://') || badge.iconUrl.startsWith('https://') || badge.iconUrl.startsWith('/');
      
      if (isUrl) {
        return <img src={badge.iconUrl} alt={badge.title} className="w-16 h-16 object-contain" />;
      } else {
        // C'est probablement un emoji ou un caractère spécial
        return <span className="text-6xl select-none">{badge.iconUrl}</span>;
      }
    }

    // Icônes par défaut selon la rareté
    switch (badge.rarity.toLowerCase()) {
      case "legendary":
        return <Trophy className="w-16 h-16 text-yellow-300" />;
      case "epic":
        return <Zap className="w-16 h-16 text-purple-300" />;
      case "rare":
        return <Star className="w-16 h-16 text-blue-300" />;
      default:
        return <Badge className="w-16 h-16 text-gray-300" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Effet de feux d'artifice */}
      {fireworksActive && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Particules de feux d'artifice */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`firework-${i}`}
              className={cn(
                "absolute w-2 h-2 rounded-full animate-ping",
                i % 4 === 0 && "bg-yellow-400",
                i % 4 === 1 && "bg-red-400",
                i % 4 === 2 && "bg-blue-400",
                i % 4 === 3 && "bg-green-400"
              )}
              style={{
                left: `${20 + ((i * 3) % 60)}%`,
                top: `${10 + ((i * 7) % 80)}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: "2s",
              }}
            />
          ))}

          {/* Étoiles scintillantes */}
          {Array.from({ length: 15 }).map((_, i) => (
            <Sparkles
              key={`star-${i}`}
              className={cn("absolute w-6 h-6 text-yellow-300 animate-pulse")}
              style={{
                left: `${10 + ((i * 5) % 80)}%`,
                top: `${5 + ((i * 6) % 90)}%`,
                animationDelay: `${i * 200}ms`,
                animationDuration: "3s",
              }}
            />
          ))}
        </div>
      )}

      {/* Contenu principal */}
      <Card
        className={cn(
          "w-full max-w-md mx-4 border-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white transition-all duration-500 transform",
          getRarityColor(badge.rarity),
          showContent ? "scale-100 opacity-100" : "scale-75 opacity-0"
        )}
      >
        <CardContent className="p-8 text-center space-y-6">
          {/* Animation de badge qui apparaît */}
          <div
            className={cn(
              "transition-all duration-700 transform",
              showContent ? "scale-100 rotate-0" : "scale-0 rotate-180"
            )}
          >
            {/* Cercle de fond avec gradient */}
            <div
              className={cn(
                "w-24 h-24 mx-auto rounded-full bg-gradient-to-br flex items-center justify-center border-4 shadow-2xl",
                getRarityColor(badge.rarity),
                "animate-pulse"
              )}
            >
              {getBadgeIcon()}
            </div>
          </div>

          {/* Titre avec animation */}
          <div
            className={cn(
              "transition-all duration-500 delay-300",
              showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
              🎉 Nouveau Badge !
            </h2>
            <h3 className="text-xl font-semibold mt-2 text-white">{badge.title}</h3>
          </div>

          {/* Description */}
          <div
            className={cn(
              "transition-all duration-500 delay-500",
              showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
          >
            <p className="text-gray-300 mb-2">{badge.description}</p>
            <p className="text-sm text-gray-400 italic">Obtenu pour : {reason}</p>
            <div
              className={cn(
                "inline-block px-3 py-1 rounded-full text-xs font-medium mt-3 border",
                badge.rarity.toLowerCase() === "legendary" &&
                  "bg-yellow-500/20 text-yellow-300 border-yellow-500",
                badge.rarity.toLowerCase() === "epic" &&
                  "bg-purple-500/20 text-purple-300 border-purple-500",
                badge.rarity.toLowerCase() === "rare" &&
                  "bg-blue-500/20 text-blue-300 border-blue-500",
                badge.rarity.toLowerCase() === "uncommon" &&
                  "bg-green-500/20 text-green-300 border-green-500",
                badge.rarity.toLowerCase() === "common" &&
                  "bg-gray-500/20 text-gray-300 border-gray-500"
              )}
            >
              {badge.rarity.toUpperCase()}
            </div>
          </div>

          {/* Bouton de fermeture */}
          <div
            className={cn(
              "transition-all duration-500 delay-700",
              showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
          >
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-2 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Formidable ! ✨
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overlay pour fermer en cliquant à l'extérieur */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Fermer la célébration"
      />
    </div>
  );
}
