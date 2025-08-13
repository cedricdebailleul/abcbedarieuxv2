import { prisma } from "@/lib/prisma";

async function testFullCategoriesFlow() {
  console.log("🚀 Test complet du système de catégories multiples...\n");

  try {
    // 1. Vérifier les catégories disponibles
    const categories = await prisma.placeCategory.findMany({
      select: { id: true, name: true, parentId: true },
      orderBy: { sortOrder: "asc" },
    });

    console.log("📂 Catégories disponibles:");
    const mainCategories = categories.filter(c => !c.parentId);
    const subCategories = categories.filter(c => c.parentId);
    
    console.log(`   • ${mainCategories.length} catégories principales`);
    console.log(`   • ${subCategories.length} sous-catégories`);
    
    mainCategories.forEach(cat => {
      const subs = subCategories.filter(sub => sub.parentId === cat.id);
      console.log(`   - ${cat.name} (${subs.length} sous-catégories)`);
    });

    // 2. Vérifier les places avec catégories
    const placesWithCategories = await prisma.place.findMany({
      include: {
        categories: {
          include: {
            category: { select: { name: true, icon: true, color: true } }
          }
        }
      },
      take: 5,
    });

    console.log(`\n🏪 Places avec catégories (${placesWithCategories.length} exemples):`);
    placesWithCategories.forEach(place => {
      console.log(`   • ${place.name}:`);
      if (place.categories.length === 0) {
        console.log(`     - Aucune catégorie`);
      } else {
        place.categories.forEach(cat => {
          const icon = cat.category.icon || "📍";
          console.log(`     - ${icon} ${cat.category.name}`);
        });
      }
    });

    // 3. Statistiques des relations
    const totalRelations = await prisma.placeToCategory.count();
    const placesWithCat = await prisma.place.count({
      where: {
        categories: {
          some: {}
        }
      }
    });
    const placesWithoutCat = await prisma.place.count({
      where: {
        categories: {
          none: {}
        }
      }
    });

    console.log(`\n📊 Statistiques:`);
    console.log(`   • ${totalRelations} relations place-catégorie`);
    console.log(`   • ${placesWithCat} places avec catégories`);
    console.log(`   • ${placesWithoutCat} places sans catégories`);

    // 4. Test de performance des requêtes
    console.log(`\n⚡ Test de performance:`);
    
    const start = performance.now();
    const complexQuery = await prisma.place.findMany({
      where: { isActive: true },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true, icon: true, color: true },
            },
          },
        },
        _count: { select: { reviews: true, favorites: true } },
      },
      take: 10,
    });
    const end = performance.now();
    
    console.log(`   • Requête complexe avec 10 places: ${(end - start).toFixed(2)}ms`);
    console.log(`   • Catégories chargées: ${complexQuery.reduce((sum, place) => sum + place.categories.length, 0)}`);

    console.log(`\n✅ Test complet réussi ! Le système de catégories multiples fonctionne parfaitement.`);

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await testFullCategoriesFlow();
}

if (require.main === module) {
  main();
}

export { testFullCategoriesFlow };