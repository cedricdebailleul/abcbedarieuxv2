/**
 * Utilitaire pour obtenir l'URL de base de l'application
 * Priorité: NEXT_PUBLIC_URL > NEXTAUTH_URL > URL de la requête
 */
export function getBaseUrl(requestUrl?: string): string {
  // En priorité, utiliser NEXT_PUBLIC_URL (défini dans .env)
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }

  // Fallback sur NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Dernier recours: construire depuis la requête (si disponible)
  if (requestUrl) {
    try {
      const url = new URL(requestUrl);
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      console.error("Erreur lors de la construction de l'URL de base:", e);
    }
  }

  // Valeur par défaut en cas d'échec
  return "https://abcbedarieux.com";
}

/**
 * Obtenir l'URL de base depuis une NextRequest
 */
export function getBaseUrlFromRequest(request: { nextUrl?: URL; url?: string }): string {
  if (request.nextUrl) {
    return getBaseUrl(`${request.nextUrl.protocol}//${request.nextUrl.host}`);
  }
  return getBaseUrl(request.url);
}
