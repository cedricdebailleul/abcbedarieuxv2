/**
 * Script de diagnostic pour identifier d'où viennent les images cassées
 *
 * Utilisation :
 * 1. Modifier une place et supprimer les images cassées
 * 2. Regarder les logs dans la console
 * 3. Identifier où les images réapparaissent
 */

import { prisma } from "@/lib/prisma";

async function debugPlaceImages(placeId: string) {
  console.log("\n=== DEBUG PLACE IMAGES ===");
  console.log("Place ID:", placeId);

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: {
      id: true,
      name: true,
      images: true,
      googleBusinessData: true,
      logo: true,
      coverImage: true,
    },
  });

  if (!place) {
    console.log("❌ Place not found");
    return;
  }

  console.log("\n📊 Place:", place.name);
  console.log("\n1️⃣ place.images (JSON field):");
  console.log(place.images);

  console.log("\n2️⃣ place.googleBusinessData:");
  console.log(place.googleBusinessData);

  console.log("\n3️⃣ place.logo:");
  console.log(place.logo);

  console.log("\n4️⃣ place.coverImage:");
  console.log(place.coverImage);

  // Analyser les URLs
  const images = Array.isArray(place.images)
    ? place.images
    : typeof place.images === 'string'
      ? JSON.parse(place.images as string)
      : [];

  console.log("\n🔍 Analyse des images:");
  images.forEach((img: string, i: number) => {
    const status = img.startsWith('/uploads/')
      ? '✅ Local'
      : img.includes('googleusercontent.com')
        ? '⚠️ Google'
        : '❌ Autre (possiblement cassée)';

    console.log(`  ${i + 1}. ${status}: ${img.substring(0, 80)}...`);
  });

  const googleData = place.googleBusinessData as any;
  if (googleData?.images) {
    console.log("\n🔍 Images dans googleBusinessData:");
    googleData.images.forEach((img: string, i: number) => {
      console.log(`  ${i + 1}. ${img.substring(0, 80)}...`);
    });
  }
}

// Exporter pour utilisation
export { debugPlaceImages };

// Pour exécution directe
if (require.main === module) {
  const placeId = process.argv[2];
  if (!placeId) {
    console.error("Usage: tsx scripts/debug-images.ts <placeId>");
    process.exit(1);
  }

  debugPlaceImages(placeId)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
