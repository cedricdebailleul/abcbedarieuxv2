import { prisma } from "@/lib/prisma";
import { createPostAction } from "@/actions/post";

async function debugFrontendFlow() {
  console.log("🎭 Debug du flux frontend complet...\n");

  // Récupérer l'utilisateur avec 1 article pour pouvoir déclencher le badge "Auteur régulier" à 5 articles
  const usersWithOnePost = await prisma.post.groupBy({
    by: ["authorId"],
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          equals: 1
        }
      }
    }
  });

  if (usersWithOnePost.length === 0) {
    console.log("❌ Aucun utilisateur avec exactement 1 article trouvé");
    // Créons un utilisateur de test
    console.log("🔧 Création d'un utilisateur de test...");
    
    const testUser = await prisma.user.create({
      data: {
        email: `test-badge-${Date.now()}@example.com`,
        name: "Test Badge User",
        emailVerified: new Date(),
        role: "user",
      }
    });

    // Créer 4 articles pour cet utilisateur
    console.log("📝 Création de 4 articles pour atteindre le seuil de 5...");
    for (let i = 1; i <= 4; i++) {
      await prisma.post.create({
        data: {
          title: `Article préparatoire ${i}`,
          slug: `prep-article-${i}-${Date.now()}`,
          content: `Contenu de l'article préparatoire ${i}`,
          excerpt: `Extrait ${i}`,
          authorId: testUser.id,
          published: true,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });
    }

    console.log(`✅ Utilisateur de test créé avec 4 articles`);
    
    // Maintenant simuler createPostAction pour le 5ème article
    console.log(`\n🎯 Simulation de createPostAction pour le 5ème article...`);
    
    const articleData = {
      title: "Article test pour déclencher badge",
      slug: `badge-trigger-${Date.now()}`,
      content: "Contenu de test pour déclencher le badge Auteur régulier",
      excerpt: "Test badge",
      published: true,
      status: "PUBLISHED" as const,
      tagIds: [] as string[],
    };

    // Simuler une session utilisateur pour createPostAction
    // Note: On ne peut pas vraiment tester createPostAction ici car elle nécessite une session auth
    // Mais on peut tester directement avec BadgeSystem
    
    const { BadgeSystem } = await import("@/lib/badge-system");
    
    // Créer l'article manuellement
    const newPost = await prisma.post.create({
      data: {
        ...articleData,
        authorId: testUser.id,
        publishedAt: new Date(),
      },
    });

    console.log(`✅ 5ème article créé avec l'ID: ${newPost.id}`);

    // Tester le système de badges
    console.log(`\n🧪 Test du système de badges...`);
    const badgeResult = await BadgeSystem.onPostCreated(testUser.id);
    
    console.log(`📤 Résultat de BadgeSystem.onPostCreated:`, JSON.stringify(badgeResult, null, 2));

    if (badgeResult.length > 0) {
      console.log(`\n🎉 SUCCESS! Le système retourne ${badgeResult.length} badge(s):`);
      badgeResult.forEach((badgeData, index) => {
        console.log(`  ${index + 1}. ${badgeData.badge.title} (${badgeData.badge.rarity})`);
        console.log(`     Description: ${badgeData.badge.description}`);
        console.log(`     Raison: ${badgeData.reason}`);
        console.log(`     Structure complète pour frontend:`, {
          badge: badgeData.badge,
          reason: badgeData.reason
        });
      });

      console.log(`\n💡 La popup devrait s'afficher avec ces données !`);
      console.log(`\n🔧 Format attendu par BadgeCelebration component:`);
      console.log(`   - isOpen: true`);
      console.log(`   - badge: { title, description, iconUrl, color, rarity }`);
      console.log(`   - reason: string`);
      console.log(`   - onClose: function`);
    } else {
      console.log(`❌ Aucun badge retourné - problème dans la logique`);
    }

    // Nettoyer
    console.log(`\n🧹 Nettoyage...`);
    await prisma.post.deleteMany({
      where: { authorId: testUser.id },
    });
    await prisma.userBadge.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log(`✅ Données de test nettoyées`);

  } else {
    console.log(`👤 Utilisateur trouvé avec 1 article, simulation impossible pour éviter de perturber les vraies données`);
  }

  console.log("\n🎯 Debug terminé !");
}

debugFrontendFlow()
  .catch((error) => {
    console.error("Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });