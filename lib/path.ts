import path from "node:path";

// Racine des uploads persistants (volume Docker en prod)
export const UPLOADS_ROOT =
  process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

/**
 * Génère un chemin de fichier avec solution hybride: ID + slug
 * Format: places/{id}/{slug}_{filename}
 *
 * Avantages:
 * - Le dossier utilise l'ID (stable, pas de renommage)
 * - Le nom de fichier contient le slug (SEO-friendly, lisible)
 * - Si le slug change, pas besoin de renommer les dossiers R2
 *
 * @param id - ID de l'entité (place, event, etc.)
 * @param slug - Slug SEO-friendly
 * @param filename - Nom du fichier (ex: logo.jpg, gallery_123.jpg)
 * @param subfolder - Sous-dossier optionnel (ex: "gallery")
 * @returns Chemin relatif (ex: "places/id123/slug_logo.jpg")
 */
export function generateHybridPath(
  id: string,
  slug: string,
  filename: string,
  subfolder?: string
): string {
  // Nettoyer le slug pour éviter les caractères problématiques
  const cleanSlug = slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();

  // Format: slug_filename (ex: "black-bear-studio_logo.jpg")
  const hybridFilename = `${cleanSlug}_${filename}`;

  // Construction du chemin
  const parts = [id];
  if (subfolder) {
    parts.push(subfolder);
  }
  parts.push(hybridFilename);

  return parts.join("/");
}

// Helpers pour construire les chemins
export const PLACES_DIR = path.join(UPLOADS_ROOT, "places");
export const PLACES_ROOT = (...segments: string[]) =>
  path.join(PLACES_DIR, ...segments);

export const DOCUMENTS_DIR = path.join(UPLOADS_ROOT, "documents");
export const DOCUMENTS_ROOT = (...segments: string[]) =>
  path.join(DOCUMENTS_DIR, ...segments);

export const NEWSLETTER_DIR = path.join(UPLOADS_ROOT, "newsletter");
export const NEWSLETTER_ROOT = (...segments: string[]) =>
  path.join(NEWSLETTER_DIR, ...segments);

export const ACTIONS_DIR = path.join(UPLOADS_ROOT, "actions");
export const ACTIONS_ROOT = (...segments: string[]) =>
  path.join(ACTIONS_DIR, ...segments);

export const POSTS_DIR = path.join(UPLOADS_ROOT, "posts");
export const POSTS_ROOT = (...segments: string[]) =>
  path.join(POSTS_DIR, ...segments);
