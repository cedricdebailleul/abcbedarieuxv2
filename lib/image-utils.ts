/**
 * Utilities pour gérer les images et filtrer les URLs Google problématiques
 */

/**
 * Vérifie si une URL est une URL Google Photos qui peut causer des erreurs 403
 */
export function isGooglePhotosUrl(url: string): boolean {
  if (!url) return false;
  
  const googlePhotosPatterns = [
    'maps.googleapis.com/maps/api/place/js/PhotoService',
    'maps.googleapis.com/maps/api/place/photo',
    'lh3.googleusercontent.com',
    'lh4.googleusercontent.com',
    'lh5.googleusercontent.com',
    'lh6.googleusercontent.com',
  ];
  
  return googlePhotosPatterns.some(pattern => url.includes(pattern));
}

/**
 * Filtre une liste d'URLs pour retirer les URLs Google Photos problématiques
 */
export function filterGooglePhotosUrls(urls: (string | null | undefined)[]): string[] {
  return urls
    .filter((url): url is string => Boolean(url))
    .filter(url => !isGooglePhotosUrl(url));
}

/**
 * Remplace une URL Google Photos par une URL de placeholder
 */
export function replaceGooglePhotosUrl(url: string): string {
  if (isGooglePhotosUrl(url)) {
    return 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Image+non+disponible';
  }
  return url;
}

/**
 * Nettoie un objet contenant des URLs d'images en filtrant les URLs Google Photos
 */
export function sanitizeImageUrls<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj } as Record<string, unknown>;
  
  // Nettoyer les champs d'images courants
  const imageFields = ['images', 'photos', 'coverImage', 'logo'];
  
  imageFields.forEach(field => {
    if (result[field]) {
      if (typeof result[field] === 'string') {
        result[field] = replaceGooglePhotosUrl(result[field]);
      } else if (Array.isArray(result[field])) {
        result[field] = filterGooglePhotosUrls(result[field]);
      }
    }
  });
  
  return result as T;
}