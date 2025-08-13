import { prisma } from "@/lib/prisma";

async function assignCategoriesToPlaces() {
  console.log("🔗 Attribution des catégories aux places...");

  try {
    // Récupérer quelques places existantes
    const places = await prisma.place.findMany({
      take: 5,
      select: { id: true, name: true, type: true }
    });

    if (places.length === 0) {
      console.log("❌ Aucune place trouvée pour le test");
      return;
    }

    // Récupérer quelques catégories
    const categories = await prisma.placeCategory.findMany({
      take: 10,
      select: { id: true, name: true }
    });

    if (categories.length === 0) {
      console.log("❌ Aucune catégorie trouvée");
      return;
    }

    console.log(`✅ Trouvé ${places.length} place(s) et ${categories.length} catégorie(s)`);

    // Assigner aléatoirement 1-3 catégories à chaque place
    for (const place of places) {
      // Supprimer les relations existantes
      await prisma.placeToCategory.deleteMany({
        where: { placeId: place.id }
      });

      // Sélectionner aléatoirement 1-3 catégories
      const numCategories = Math.floor(Math.random() * 3) + 1; // 1-3 catégories
      const shuffledCategories = [...categories].sort(() => Math.random() - 0.5);
      const selectedCategories = shuffledCategories.slice(0, numCategories);

      // Créer les nouvelles relations
      await prisma.placeToCategory.createMany({
        data: selectedCategories.map(category => ({
          placeId: place.id,
          categoryId: category.id,
        })),
        skipDuplicates: true,
      });

      console.log(`✅ ${place.name} - ${selectedCategories.map(c => c.name).join(', ')}`);
    }

    // Afficher les statistiques
    const totalRelations = await prisma.placeToCategory.count();
    console.log(`\n📊 ${totalRelations} relations place-catégorie créées`);

  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await assignCategoriesToPlaces();
}

if (require.main === module) {
  main();
}

export { assignCategoriesToPlaces };