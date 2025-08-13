import { prisma } from "@/lib/prisma";
import { BadgeSystem } from "@/lib/badge-system";

async function testBadgeAttribution() {
  console.log("🔬 Test de l'attribution de badges...\n");

  // Récupérer l'utilisateur avec 2 articles
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

  console.log(`👤 Test avec l'utilisateur ${user?.email} qui a ${testUser._count.id} article(s)`);

  // Vérifier les badges actuels de cet utilisateur
  const currentBadges = await prisma.userBadge.findMany({
    where: { userId: testUser.authorId },
    include: { badge: true },
  });

  console.log(`\n🏆 Badges actuels de l'utilisateur :`);
  currentBadges.forEach((userBadge) => {
    console.log(`  - ${userBadge.badge.title}: ${userBadge.reason}`);
  });

  // Tester la fonction onPostCreated
  console.log(`\n🧪 Appel de onPostCreated...`);
  const result = await BadgeSystem.onPostCreated(testUser.authorId);
  console.log(`📤 Résultat:`, result);

  // Si pas de nouveaux badges, essayons d'attribuer manuellement le badge Premier article
  if (result.length === 0) {
    console.log(`\n🔧 Tentative d'attribution manuelle du badge "Premier article"...`);
    
    // Vérifier si l'utilisateur a déjà ce badge
    const premierArticleBadge = await prisma.badge.findFirst({
      where: { title: "Premier article", isActive: true },
    });

    if (premierArticleBadge) {
      const hasAlready = await prisma.userBadge.findUnique({
        where: { 
          userId_badgeId: { 
            userId: testUser.authorId, 
            badgeId: premierArticleBadge.id 
          } 
        },
      });

      if (hasAlready) {
        console.log(`✅ L'utilisateur a déjà le badge "Premier article"`);
      } else {
        console.log(`❌ L'utilisateur n'a PAS le badge "Premier article", attribution en cours...`);
        
        try {
          await prisma.userBadge.create({
            data: {
              userId: testUser.authorId,
              badgeId: premierArticleBadge.id,
              reason: "Premier article publié (attribution manuelle)",
              isVisible: true,
            },
          });
          console.log(`✅ Badge "Premier article" attribué manuellement !`);
        } catch (error) {
          console.error(`❌ Erreur lors de l'attribution manuelle:`, error);
        }
      }
    }
  }

  console.log("\n🎯 Test terminé !");
}

testBadgeAttribution()
  .catch((error) => {
    console.error("Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });