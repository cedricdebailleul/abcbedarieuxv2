import { prisma } from "@/lib/prisma";
import { PlaceStatus } from "@/lib/generated/prisma";

async function testPlaceCategoriesQuery() {
  console.log("🔍 Test de la requête place avec catégories...");

  try {
    const place = await prisma.place.findFirst({
      where: { 
        status: PlaceStatus.ACTIVE, 
        isActive: true 
      },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true, icon: true, color: true },
            },
          },
        },
        _count: {
          select: { reviews: true, favorites: true },
        },
      },
    });

    if (!place) {
      console.log("❌ Aucune place trouvée");
      return;
    }

    console.log("✅ Place trouvée:", place.name);
    console.log("📊 Catégories:", place.categories.length);
    
    if (place.categories.length > 0) {
      place.categories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.category.name} (${cat.category.color || 'pas de couleur'})`);
      });
    } else {
      console.log("  Aucune catégorie assignée");
    }

    console.log("🎉 Test réussi ! La requête fonctionne correctement.");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await testPlaceCategoriesQuery();
}

if (require.main === module) {
  main();
}

export { testPlaceCategoriesQuery };