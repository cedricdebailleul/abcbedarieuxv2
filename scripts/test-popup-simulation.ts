import { prisma } from "@/lib/prisma";
import { triggerPostCreationBadges } from "@/lib/services/badge-trigger-service";

async function testPopupSimulation() {
  console.log("🎭 Simulation du test de popup de badge...\n");

  // Récupérer l'utilisateur avec le plus d'articles
  const usersWithPosts = await prisma.post.groupBy({
    by: ["authorId"],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });

  if (usersWithPosts.length === 0) {
    console.log("❌ Aucun utilisateur avec des articles trouvé");
    return;
  }

  const testUser = usersWithPosts[0];
  const user = await prisma.user.findUnique({
    where: { id: testUser.authorId },
    select: { email: true },
  });

  console.log(`👤 Simulation avec l'utilisateur ${user?.email} qui a ${testUser._count.id} article(s)`);

  // Maintenant testons ce qui se passerait si cet utilisateur créait un autre article
  const nextArticleCount = testUser._count.id + 1;
  console.log(`📝 Simulation: création d'un ${nextArticleCount}ème article...`);

  // Créer un post de test temporaire pour simuler
  const tempPost = await prisma.post.create({
    data: {
      title: "Article de test pour badge",
      slug: `test-badge-${Date.now()}`,
      content: "Contenu de test pour déclencher un badge",
      excerpt: "Test badge",
      authorId: testUser.authorId,
      published: true,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  console.log(`✅ Article temporaire créé avec l'ID: ${tempPost.id}`);

  // Maintenant tester le nouveau système de badges
  console.log(`\n🧪 Déclenchement du système de badges après création d'article...`);
  await triggerPostCreationBadges(testUser.authorId, tempPost.id);
  
  // Récupérer les badges de l'utilisateur pour vérifier
  const userBadges = await prisma.userBadge.findMany({
    where: { userId: testUser.authorId },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
    take: 5
  });

  console.log(`📤 Badges trouvés pour l'utilisateur:`, userBadges.length);

  if (userBadges.length > 0) {
    console.log(`\n🎉 SUCCESS! L'utilisateur a des badges:`);
    userBadges.forEach((userBadge, index) => {
      console.log(`  ${index + 1}. Badge: "${userBadge.badge.title}"`);
      console.log(`     Raison: "${userBadge.reason || 'Non spécifiée'}"`);
      console.log(`     Rareté: ${userBadge.badge.rarity}`);
    });
    console.log(`\n💡 Ces données devraient déclencher la popup de célébration !`);
  } else {
    console.log(`\n⚠️  Aucun nouveau badge attribué. Vérifications:`);
    
    // Vérifier combien d'articles l'utilisateur a maintenant
    const newPostCount = await prisma.post.count({
      where: { authorId: testUser.authorId },
    });
    console.log(`   - Nombre total d'articles: ${newPostCount}`);
    
    // Vérifier les badges existants
    const existingBadges = await prisma.userBadge.findMany({
      where: { userId: testUser.authorId },
      include: { badge: true },
    });
    
    const articleBadges = existingBadges.filter(ub => 
      ub.badge.title.includes("article") || 
      ub.badge.title.includes("Auteur") || 
      ub.badge.title.includes("Rédacteur") || 
      ub.badge.title.includes("Maître")
    );
    
    console.log(`   - Badges d'articles existants:`);
    articleBadges.forEach(ub => {
      console.log(`     * ${ub.badge.title}: ${ub.reason}`);
    });
  }

  // Nettoyer - supprimer l'article de test
  console.log(`\n🧹 Nettoyage: suppression de l'article de test...`);
  await prisma.post.delete({
    where: { id: tempPost.id },
  });
  console.log(`✅ Article de test supprimé`);

  console.log("\n🎯 Simulation terminée !");
}

testPopupSimulation()
  .catch((error) => {
    console.error("Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });