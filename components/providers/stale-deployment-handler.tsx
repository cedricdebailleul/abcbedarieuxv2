"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Détecte l'erreur "Failed to find Server Action" qui survient quand un
 * utilisateur a l'ancienne version du site chargée après un déploiement.
 * Force un rechargement complet de la page pour récupérer les nouveaux IDs.
 */
export function StaleDeploymentHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message ?? "";
      if (message.includes("Failed to find Server Action")) {
        event.preventDefault();
        // Rechargement complet pour récupérer le nouveau bundle
        window.location.reload();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, [router]);

  return null;
}
