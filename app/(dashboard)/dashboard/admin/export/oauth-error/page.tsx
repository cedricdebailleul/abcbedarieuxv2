"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function OAuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "access_denied":
        return "Accès refusé par l'utilisateur";
      case "config_error":
        return "Configuration OAuth manquante";
      case "invalid_grant":
        return "Code d'autorisation invalide";
      case "invalid_user":
        return "Utilisateur non autorisé";
      case "missing_parameters":
        return "Paramètres manquants";
      default:
        return "Erreur inconnue lors de la connexion";
    }
  };

  useEffect(() => {
    // Envoyer un message au parent window et fermer la popup
    if (window.opener) {
      window.opener.postMessage({
        type: "GOOGLE_DRIVE_AUTH_ERROR",
        error,
        message: getErrorMessage(error)
      }, window.location.origin);
    }
    
    // Fermer la fenêtre popup après un court délai
    setTimeout(() => {
      window.close();
    }, 3000);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-red-900 mb-2">
          ❌ Erreur de connexion Google Drive
        </h1>
        <p className="text-red-700 text-sm mb-4">
          {getErrorMessage(error)}
        </p>
        <p className="text-red-600 text-xs">
          Cette fenêtre va se fermer automatiquement dans 3 secondes...
        </p>
      </div>
    </div>
  );
}