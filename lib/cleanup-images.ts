/**
 * Utilitaire pour nettoyer les images obsolètes lors de la mise à jour d'entités
 * Supprime automatiquement les fichiers locaux ET sur Cloudflare R2
 */

import { deleteFile } from "./storage";

export interface ImageFields {
  logo?: string | null;
  coverImage?: string | null;
  images?: unknown; // JSON field (string[])
  gallery?: string[]; // Event model uses this
}

/**
 * Compare les anciennes et nouvelles images et supprime celles qui ne sont plus utilisées
 *
 * @param oldEntity - L'entité existante avec ses anciennes images
 * @param newFields - Les nouveaux champs d'images
 * @returns Nombre d'images supprimées
 *
 * @example
 * ```ts
 * const existingPlace = await prisma.place.findUnique({ where: { id } });
 *
 * await cleanupUnusedImages(existingPlace, {
 *   logo: newLogo,
 *   coverImage: newCover,
 *   images: newPhotosArray
 * });
 *
 * await prisma.place.update({ where: { id }, data: newData });
 * ```
 */
export async function cleanupUnusedImages(
  oldEntity: ImageFields,
  newFields: ImageFields
): Promise<number> {
  try {
    const oldImages = new Set<string>();
    const newImages = new Set<string>();

    // Collecter toutes les anciennes images
    if (oldEntity.logo) oldImages.add(oldEntity.logo);
    if (oldEntity.coverImage) oldImages.add(oldEntity.coverImage);

    // Gérer le champ images (JSON)
    if (Array.isArray(oldEntity.images)) {
      (oldEntity.images as string[]).forEach((img) => {
        if (typeof img === "string") oldImages.add(img);
      });
    }

    // Gérer le champ gallery (Event model)
    if (Array.isArray(oldEntity.gallery)) {
      oldEntity.gallery.forEach((img) => {
        if (typeof img === "string") oldImages.add(img);
      });
    }

    // Collecter toutes les nouvelles images
    if (newFields.logo) newImages.add(newFields.logo);
    if (newFields.coverImage) newImages.add(newFields.coverImage);

    if (Array.isArray(newFields.images)) {
      (newFields.images as string[]).forEach((img) => {
        if (typeof img === "string") newImages.add(img);
      });
    }

    if (Array.isArray(newFields.gallery)) {
      newFields.gallery.forEach((img) => {
        if (typeof img === "string") newImages.add(img);
      });
    }

    // Trouver les images à supprimer (dans old mais pas dans new)
    const imagesToDelete = Array.from(oldImages).filter((img) => !newImages.has(img));

    if (imagesToDelete.length === 0) {
      return 0;
    }

    console.log(`🧹 Nettoyage de ${imagesToDelete.length} image(s) obsolète(s)...`);

    // Supprimer chaque fichier obsolète (local + R2)
    let deletedCount = 0;
    let failedCount = 0;
    for (const fileUrl of imagesToDelete) {
      if (fileUrl.startsWith("/uploads/")) {
        const relativePath = fileUrl.replace(/^\/uploads\//, "").replace(/\\/g, "/");
        try {
          await deleteFile(relativePath);
          console.log(`  ✅ ${relativePath}`);
          deletedCount++;
        } catch (err) {
          console.error(`  ⚠️  Échec suppression ${relativePath}:`, (err as Error).message);
          failedCount++;
        }
      }
    }

    if (failedCount > 0) {
      console.log(`🗑️  ${deletedCount}/${imagesToDelete.length} image(s) supprimée(s) (${failedCount} échec(s))`);
    } else {
      console.log(`🗑️  ${deletedCount}/${imagesToDelete.length} image(s) supprimée(s)`);
    }
    return deletedCount;

  } catch (err) {
    console.error("❌ Erreur lors du nettoyage des images:", err);
    return 0; // Ne pas bloquer en cas d'erreur
  }
}

/**
 * Supprime toutes les images d'une entité (utilisé lors de la suppression complète)
 *
 * @param entity - L'entité avec ses images
 * @returns Nombre d'images supprimées
 *
 * @example
 * ```ts
 * const place = await prisma.place.findUnique({ where: { id } });
 * await deleteAllImages(place);
 * await prisma.place.delete({ where: { id } });
 * ```
 */
export async function deleteAllImages(entity: ImageFields): Promise<number> {
  return cleanupUnusedImages(entity, {
    logo: null,
    coverImage: null,
    images: [],
    gallery: []
  });
}
