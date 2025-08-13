import { prisma } from "@/lib/prisma";

async function debugBadges() {
  console.log("🔍 Debug des badges...\n");

  // 1. Vérifier les badges existants
  const badges = await prisma.badge.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
  });

  console.log("📋 Badges actifs dans la base:");
  badges.forEach((badge) => {
    console.log(`  ✅ ${badge.title} (${badge.rarity}) - ${badge.description}`);
  });

  // 2. Vérifier le nombre d'articles par utilisateur
  const postsPerUser = await prisma.post.groupBy({
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

  console.log("\n📊 Articles par utilisateur:");
  for (const userPosts of postsPerUser) {
    const user = await prisma.user.findUnique({
      where: { id: userPosts.authorId },
      select: { email: true },
    });
    console.log(`  👤 ${user?.email}: ${userPosts._count.id} article(s)`);
  }

  // 3. Vérifier les badges attribués
  const userBadges = await prisma.userBadge.findMany({
    include: {
      badge: true,
      user: {
        select: { email: true },
      },
    },
    orderBy: { earnedAt: "desc" },
  });

  console.log("\n🏆 Badges attribués:");
  userBadges.forEach((userBadge) => {
    console.log(`  🎖️ ${userBadge.user.email}: "${userBadge.badge.title}" - ${userBadge.reason}`);
  });

  // 4. Test de la fonction d'attribution
  console.log("\n🧪 Test de la fonction d'attribution:");
  if (postsPerUser.length > 0) {
    const testUser = postsPerUser[0];
    console.log(`  🔬 Test avec l'utilisateur qui a ${testUser._count.id} article(s)...`);
    
    try {
      const { BadgeSystem } = await import("@/lib/badge-system");
      const result = await BadgeSystem.onPostCreated(testUser.authorId);
      console.log(`  📤 Résultat de onPostCreated:`, result);
    } catch (error) {
      console.error(`  ❌ Erreur lors du test:`, error);
    }
  }

  console.log("\n🎯 Debug terminé !");
}

debugBadges()
  .catch((error) => {
    console.error("Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });