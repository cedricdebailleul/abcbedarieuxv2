import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/validations/place-category";

const PLACE_CATEGORIES = [
  {
    name: "Restaurants",
    description: "Établissements de restauration et cafés",
    icon: "UtensilsCrossed",
    color: "#ef4444",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    sortOrder: 1,
    children: [
      {
        name: "Restaurant traditionnel",
        description: "Cuisine française et locale",
        icon: "ChefHat",
        color: "#dc2626",
        bgColor: "bg-red-50",
        textColor: "text-red-600",
        borderColor: "border-red-200",
        sortOrder: 1,
      },
      {
        name: "Pizzeria",
        description: "Restaurants spécialisés en pizza",
        icon: "🍕",
        color: "#f97316",
        bgColor: "bg-orange-50",
        textColor: "text-orange-700",
        borderColor: "border-orange-200",
        sortOrder: 2,
      },
      {
        name: "Café & Bar",
        description: "Cafés, bars et brasseries",
        icon: "Coffee",
        color: "#a855f7",
        bgColor: "bg-purple-50",
        textColor: "text-purple-700",
        borderColor: "border-purple-200",
        sortOrder: 3,
      },
    ],
  },
  {
    name: "Commerces",
    description: "Magasins et commerces de détail",
    icon: "Store",
    color: "#3b82f6",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    sortOrder: 2,
    children: [
      {
        name: "Alimentaire",
        description: "Supermarchés, épiceries, boulangeries",
        icon: "ShoppingBasket",
        color: "#16a34a",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        sortOrder: 1,
      },
      {
        name: "Mode & Beauté",
        description: "Vêtements, chaussures, cosmétiques",
        icon: "Shirt",
        color: "#ec4899",
        bgColor: "bg-pink-50",
        textColor: "text-pink-700",
        borderColor: "border-pink-200",
        sortOrder: 2,
      },
      {
        name: "Équipement & Bricolage",
        description: "Outils, jardinage, équipement maison",
        icon: "Wrench",
        color: "#f59e0b",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        borderColor: "border-amber-200",
        sortOrder: 3,
      },
    ],
  },
  {
    name: "Services",
    description: "Services professionnels et personnels",
    icon: "Briefcase",
    color: "#6366f1",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
    sortOrder: 3,
    children: [
      {
        name: "Santé & Bien-être",
        description: "Médecins, pharmacies, instituts de beauté",
        icon: "Heart",
        color: "#10b981",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        sortOrder: 1,
      },
      {
        name: "Services automobiles",
        description: "Garages, stations-service, carrosseries",
        icon: "Car",
        color: "#374151",
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
        sortOrder: 2,
      },
      {
        name: "Services professionnels",
        description: "Avocats, comptables, agences immobilières",
        icon: "Building2",
        color: "#0f172a",
        bgColor: "bg-slate-50",
        textColor: "text-slate-700",
        borderColor: "border-slate-200",
        sortOrder: 3,
      },
    ],
  },
  {
    name: "Culture & Loisirs",
    description: "Activités culturelles, sportives et de loisirs",
    icon: "Palette",
    color: "#8b5cf6",
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    borderColor: "border-violet-200",
    sortOrder: 4,
    children: [
      {
        name: "Sport & Fitness",
        description: "Salles de sport, clubs sportifs, piscines",
        icon: "Dumbbell",
        color: "#ea580c",
        bgColor: "bg-orange-50",
        textColor: "text-orange-700",
        borderColor: "border-orange-200",
        sortOrder: 1,
      },
      {
        name: "Culture",
        description: "Musées, théâtres, bibliothèques",
        icon: "BookOpen",
        color: "#7c3aed",
        bgColor: "bg-violet-50",
        textColor: "text-violet-700",
        borderColor: "border-violet-200",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Hébergement",
    description: "Hôtels, gîtes et hébergements touristiques",
    icon: "Bed",
    color: "#059669",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    sortOrder: 5,
  },
];

async function seedPlaceCategories() {
  console.log("🌱 Création des catégories de places...");

  for (const categoryData of PLACE_CATEGORIES) {
    const { children, ...parentData } = categoryData;
    
    // Générer le slug
    const slug = generateSlug(parentData.name);
    
    // Créer la catégorie parent
    const parentCategory = await prisma.placeCategory.create({
      data: {
        ...parentData,
        slug,
      },
    });

    console.log(`✅ Catégorie parent créée: ${parentCategory.name}`);

    // Créer les sous-catégories si elles existent
    if (children && children.length > 0) {
      for (const childData of children) {
        const childSlug = generateSlug(childData.name);
        
        const childCategory = await prisma.placeCategory.create({
          data: {
            ...childData,
            slug: childSlug,
            parentId: parentCategory.id,
          },
        });

        console.log(`  ✅ Sous-catégorie créée: ${childCategory.name}`);
      }
    }
  }

  console.log("🎉 Toutes les catégories ont été créées avec succès!");
}

async function main() {
  try {
    // Vérifier si des catégories existent déjà
    const existingCategories = await prisma.placeCategory.count();
    
    if (existingCategories > 0) {
      console.log(`❌ ${existingCategories} catégories existent déjà. Suppression...`);
      
      // Supprimer les catégories existantes (les enfants d'abord)
      await prisma.placeCategory.deleteMany({
        where: {
          parentId: { not: null }
        }
      });
      
      await prisma.placeCategory.deleteMany({
        where: {
          parentId: null
        }
      });
      
      console.log("🗑️ Catégories existantes supprimées");
    }

    await seedPlaceCategories();
    
    // Afficher les statistiques finales
    const totalCategories = await prisma.placeCategory.count();
    const parentCategories = await prisma.placeCategory.count({
      where: { parentId: null }
    });
    const childCategories = await prisma.placeCategory.count({
      where: { parentId: { not: null } }
    });
    
    console.log("\n📊 Statistiques finales:");
    console.log(`   Total: ${totalCategories} catégories`);
    console.log(`   Principales: ${parentCategories}`);
    console.log(`   Sous-catégories: ${childCategories}`);
    
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedPlaceCategories };