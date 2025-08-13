import { prisma } from "@/lib/prisma";

async function testCategoriesPages() {
  console.log("🧪 Test des pages de catégories...\n");

  try {
    // 1. Vérifier les catégories avec leurs places
    const categoriesWithPlaces = await prisma.placeCategory.findMany({
      where: {
        isActive: true,
        places: {
          some: {
            place: {
              status: "ACTIVE",
              isActive: true
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
        _count: {
          select: {
            places: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    console.log("📂 Catégories avec des places actives:");
    categoriesWithPlaces.forEach(category => {
      const icon = category.icon || "📍";
      console.log(`   • ${icon} ${category.name} (${category._count.places} places) - /categories/${category.slug}`);
    });

    // 2. Tester une requête spécifique pour une catégorie
    const testCategory = categoriesWithPlaces[0];
    if (testCategory) {
      console.log(`\n🔍 Test détaillé pour "${testCategory.name}":`);
      
      const placesInCategory = await prisma.place.findMany({
        where: {
          status: "ACTIVE",
          isActive: true,
          categories: {
            some: {
              categoryId: testCategory.id
            }
          }
        },
        include: {
          categories: {
            include: {
              category: {
                select: { name: true, color: true, icon: true }
              }
            }
          },
          _count: {
            select: { reviews: true, favorites: true }
          }
        }
      });

      console.log(`   Nombre de places trouvées: ${placesInCategory.length}`);
      placesInCategory.forEach(place => {
        const categoryNames = place.categories.map(c => c.category.name).join(", ");
        console.log(`   - ${place.name} (${categoryNames}) - ${place._count.reviews} avis`);
      });
    }

    // 3. Statistiques pour la page d'index des catégories
    const mainCategories = await prisma.placeCategory.findMany({
      where: {
        isActive: true,
        parentId: null
      },
      include: {
        children: {
          where: { isActive: true },
          select: { id: true }
        }
      },
      orderBy: { sortOrder: "asc" }
    });

    console.log(`\n📊 Statistiques pour la page d'index:`);
    console.log(`   • ${mainCategories.length} catégories principales`);

    let totalPlaces = 0;
    for (const category of mainCategories) {
      const childrenIds = category.children.map(child => child.id);
      const allCategoryIds = [category.id, ...childrenIds];
      
      const placeCount = await prisma.place.count({
        where: {
          isActive: true,
          status: "ACTIVE",
          categories: {
            some: {
              categoryId: {
                in: allCategoryIds
              }
            }
          }
        }
      });

      totalPlaces += placeCount;
      console.log(`   • ${category.name}: ${placeCount} places (+ ${category.children.length} sous-catégories)`);
    }

    console.log(`   • Total: ${totalPlaces} places actives`);

    // 4. URLs à tester
    console.log(`\n🌐 URLs disponibles pour test:`);
    console.log(`   • Page d'index: http://localhost:3000/categories`);
    categoriesWithPlaces.slice(0, 3).forEach(category => {
      console.log(`   • ${category.name}: http://localhost:3000/categories/${category.slug}`);
    });

    console.log(`\n✅ Test terminé ! Le système de pages de catégories est prêt.`);

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await testCategoriesPages();
}

if (require.main === module) {
  main();
}

export { testCategoriesPages };