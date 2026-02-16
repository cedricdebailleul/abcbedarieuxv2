/**
 * Script pour nettoyer toutes les images cassées de la base de données
 *
 * Utilisation : pnpm tsx scripts/clean-broken-images.ts
 */

import { prisma } from "@/lib/prisma";

async function cleanBrokenImages() {
  console.log("\n🧹 Nettoyage des images cassées...\n");

  // Récupérer toutes les places
  const places = await prisma.place.findMany({
    select: {
      id: true,
      name: true,
      images: true,
      googleBusinessData: true,
      logo: true,
      coverImage: true,
    },
  });

  let updatedCount = 0;

  for (const place of places) {
    let hasChanges = false;
    const updates: any = {};

    // Nettoyer place.images (garder uniquement les images qui commencent par /uploads/)
    const currentImages = Array.isArray(place.images)
      ? place.images
      : typeof place.images === 'string'
        ? JSON.parse(place.images as string)
        : [];

    const cleanImages = currentImages.filter((img: string) =>
      typeof img === 'string' && img.startsWith('/uploads/')
    );

    if (cleanImages.length !== currentImages.length) {
      updates.images = cleanImages;
      hasChanges = true;
      console.log(`  📍 ${place.name}:`);
      console.log(`     Avant: ${currentImages.length} images`);
      console.log(`     Après: ${cleanImages.length} images`);
      console.log(`     Supprimées: ${currentImages.length - cleanImages.length}`);
    }

    // Nettoyer googleBusinessData.images
    const googleData = place.googleBusinessData as any;
    if (googleData?.images) {
      const cleanGoogleImages = googleData.images.filter((img: string) =>
        typeof img === 'string' && img.startsWith('/uploads/')
      );

      if (cleanGoogleImages.length !== googleData.images.length) {
        updates.googleBusinessData = {
          ...googleData,
          images: cleanGoogleImages,
        };
        hasChanges = true;
        console.log(`     Google images: ${googleData.images.length} → ${cleanGoogleImages.length}`);
      }
    }

    // Nettoyer logo si c'est une URL Google
    if (place.logo && place.logo.includes('maps.googleapis.com')) {
      updates.logo = null;
      hasChanges = true;
      console.log(`     Logo Google supprimé`);
    }

    // Nettoyer coverImage si c'est une URL Google
    if (place.coverImage && place.coverImage.includes('maps.googleapis.com')) {
      updates.coverImage = null;
      hasChanges = true;
      console.log(`     Cover image Google supprimée`);
    }

    // Mettre à jour si nécessaire
    if (hasChanges) {
      await prisma.place.update({
        where: { id: place.id },
        data: updates,
      });
      updatedCount++;
    }
  }

  console.log(`\n✅ Nettoyage terminé !`);
  console.log(`   ${updatedCount} place(s) mise(s) à jour sur ${places.length}`);
}

// Exécution
cleanBrokenImages()
  .then(() => {
    console.log("\n✨ Succès !");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  });
