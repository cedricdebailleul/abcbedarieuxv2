import { prisma } from "@/lib/prisma";
import { BadgeSystem } from "@/lib/badge-system";

async function testFiveArticles() {
  console.log("🎯 Test d'attribution du badge 5 articles...\n");

  // Récupérer l'utilisateur qui a le moins d'articles
  const usersWithPosts = await prisma.post.groupBy({
    by: ["authorId"],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "asc",
      },
    },
  });

  if (usersWithPosts.length === 0) {
    console.log("❌ Aucun utilisateur avec des articles trouvé");
    return;
  }

  const testUser = usersWithPosts[0]; // Celui avec le moins d'articles
  const user = await prisma.user.findUnique({
    where: { id: testUser.authorId },
    select: { email: true },
  });

  console.log(`👤 Test avec l'utilisateur ${user?.email} qui a ${testUser._count.id} article(s)`);

  // Créer des articles de test pour atteindre 5 articles
  const articlesToCreate = 5 - testUser._count.id;
  console.log(`📝 Création de ${articlesToCreate} articles de test pour atteindre 5 articles...`);

  const createdPosts = [];
  for (let i = 1; i <= articlesToCreate; i++) {
    const tempPost = await prisma.post.create({
      data: {
        title: `Article de test ${i} pour badge`,
        slug: `test-badge-${i}-${Date.now()}`,
        content: `Contenu de test ${i} pour déclencher un badge`,
        excerpt: `Test badge ${i}`,
        authorId: testUser.authorId,
        published: true,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    createdPosts.push(tempPost);
    console.log(`✅ Article ${i}/${articlesToCreate} créé`);

    // Tester onPostCreated après chaque article
    if (i === articlesToCreate) {
      console.log(`\n🧪 Test de onPostCreated après le ${5}ème article...`);
      const result = await BadgeSystem.onPostCreated(testUser.authorId);
      console.log(`📤 Résultat:`, JSON.stringify(result, null, 2));

      if (result.length > 0) {
        console.log(`\n🎉 SUCCESS! Badge attribué:`);
        result.forEach((badgeData) => {
          console.log(`  - Badge: "${badgeData.badge.title}"`);
          console.log(`  - Raison: "${badgeData.reason}"`);
          console.log(`  - Rareté: ${badgeData.badge.rarity}`);
          console.log(`  - Description: ${badgeData.badge.description}`);
        });
      } else {
        console.log(`❌ Aucun badge attribué même avec 5 articles`);
      }
    }
  }

  // Vérifier le nombre final d'articles
  const finalPostCount = await prisma.post.count({
    where: { authorId: testUser.authorId },
  });
  console.log(`\n📊 Nombre final d'articles: ${finalPostCount}`);

  // Nettoyer - supprimer les articles de test
  console.log(`\n🧹 Nettoyage: suppression des ${createdPosts.length} articles de test...`);
  for (const post of createdPosts) {
    await prisma.post.delete({
      where: { id: post.id },
    });
  }
  console.log(`✅ Articles de test supprimés`);

  console.log("\n🎯 Test terminé !");
}

testFiveArticles()
  .catch((error) => {
    console.error("Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });