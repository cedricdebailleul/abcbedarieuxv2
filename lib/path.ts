import path from "node:path";

// Racine des uploads persistants (volume Docker en prod)
export const UPLOADS_ROOT =
  process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

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
