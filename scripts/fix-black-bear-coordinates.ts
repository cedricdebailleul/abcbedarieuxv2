import { prisma } from "./prisma-client";

/**
 * Script pour ajouter les coordonnées GPS à Black Bear Studio
 * Les coordonnées sont approximatives pour Bédarieux centre-ville
 */

async function fixBlackBearCoordinates() {
  console.log("🔍 Recherche de Black Bear Studio...");

  const place = await prisma.place.findFirst({
    where: {
      name: { contains: "Black Bear", mode: "insensitive" },
    },
  });

  if (!place) {
    console.log("❌ Black Bear Studio non trouvé dans la base de données");
    return;
  }

  console.log("✅ Black Bear Studio trouvé:", {
    id: place.id,
    name: place.name,
    slug: place.slug,
    currentLat: place.latitude,
    currentLng: place.longitude,
  });

  // Coordonnées approximatives pour le centre de Bédarieux
  // Tu peux ajuster ces coordonnées si tu connais l'adresse exacte
  const latitude = 43.6108;
  const longitude = 3.1612;

  console.log("📍 Ajout des coordonnées GPS...");
  console.log(`   Latitude: ${latitude}`);
  console.log(`   Longitude: ${longitude}`);

  await prisma.place.update({
    where: { id: place.id },
    data: {
      latitude,
      longitude,
    },
  });

  console.log("✅ Coordonnées GPS ajoutées avec succès !");
  console.log("🗺️ Black Bear Studio devrait maintenant apparaître sur la carte interactive");
  console.log("\n💡 Note: Les coordonnées sont approximatives pour le centre de Bédarieux.");
  console.log("   Tu peux éditer la fiche via l'interface pour obtenir des coordonnées plus précises:");
  console.log(`   http://localhost:3000/dashboard/places/${place.id}/edit`);

  await prisma.$disconnect();
}

fixBlackBearCoordinates()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });
