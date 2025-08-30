"use client";

import { Mail, Heart, CheckCircle, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MembershipCelebrationProps } from "@/types/membership";

export function MembershipCelebration({
  isOpen,
  onClose,
  membershipType,
  amount,
  email,
}: MembershipCelebrationProps) {
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

  const getMembershipColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "actif":
        return "from-blue-400 to-blue-600 border-blue-500";
      case "artisan":
        return "from-orange-400 to-orange-600 border-orange-500";
      case "auto_entrepreneur":
        return "from-green-400 to-green-600 border-green-500";
      case "partenaire":
        return "from-purple-400 to-purple-600 border-purple-500";
      case "bienfaiteur":
        return "from-yellow-400 to-yellow-600 border-yellow-500";
      default:
        return "from-blue-400 to-blue-600 border-blue-500";
    }
  };

  const getMembershipIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "actif":
        return <Heart className="w-16 h-16 text-blue-300" />;
      case "artisan":
        return <span className="text-6xl">🔨</span>;
      case "auto_entrepreneur":
        return <span className="text-6xl">💼</span>;
      case "partenaire":
        return <span className="text-6xl">🤝</span>;
      case "bienfaiteur":
        return <span className="text-6xl">⭐</span>;
      default:
        return <Heart className="w-16 h-16 text-blue-300" />;
    }
  };

  const getMembershipLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "actif":
        return "Membre Actif";
      case "artisan":
        return "Membre Artisan";
      case "auto_entrepreneur":
        return "Membre Auto-Entrepreneur";
      case "partenaire":
        return "Membre Partenaire";
      case "bienfaiteur":
        return "Membre Bienfaiteur";
      default:
        return "Nouveau Membre";
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
          "w-full max-w-lg mx-4 border-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white transition-all duration-500 transform",
          getMembershipColor(membershipType),
          showContent ? "scale-100 opacity-100" : "scale-75 opacity-0"
        )}
      >
        <CardContent className="p-8 text-center space-y-6">
          {/* Animation d'icône qui apparaît */}
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
                getMembershipColor(membershipType),
                "animate-pulse"
              )}
            >
              {getMembershipIcon(membershipType)}
            </div>
          </div>

          {/* Titre avec animation */}
          <div
            className={cn(
              "transition-all duration-500 delay-300",
              showContent
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            )}
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
              🎉 Merci pour votre adhésion !
            </h2>
            <h3 className="text-xl font-semibold mt-2 text-white">
              {getMembershipLabel(membershipType)}
            </h3>
          </div>

          {/* Montant */}
          <div
            className={cn(
              "transition-all duration-500 delay-400",
              showContent
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            )}
          >
            <div className="bg-white/10 rounded-lg p-3 inline-block">
              <p className="text-2xl font-bold text-yellow-300">
                {amount}€
              </p>
            </div>
          </div>

          {/* Message de confirmation */}
          <div
            className={cn(
              "transition-all duration-500 delay-500",
              showContent
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            )}
          >
            <div className="space-y-3 text-left bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-sm text-gray-300">
                  Votre demande d&apos;adhésion a été enregistrée avec succès
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <p className="text-sm text-gray-300">
                  Un email de confirmation avec votre bulletin d&apos;inscription a été envoyé à :
                </p>
              </div>
              
              <div className="bg-blue-500/20 rounded-md p-2 ml-8">
                <p className="text-sm font-medium text-blue-300">
                  {email}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <p className="text-sm text-gray-300">
                  Votre dossier sera traité sous 24-48h ouvrées
                </p>
              </div>
            </div>
          </div>

          {/* Note importante */}
          <div
            className={cn(
              "transition-all duration-500 delay-600",
              showContent
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            )}
          >
            <p className="text-xs text-gray-400 italic">
              💡 Pensez à vérifier votre dossier de spam si vous ne recevez pas l&apos;email
            </p>
          </div>

          {/* Bouton de fermeture */}
          <div
            className={cn(
              "transition-all duration-500 delay-700",
              showContent
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            )}
          >
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-8 py-2 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Parfait ! 🎊
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
        aria-label="Fermer la célébration d'adhésion"
      />
    </div>
  );
}