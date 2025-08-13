import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

async function assignWelcomeBadges() {
  console.log("🎉 Attribution des badges de bienvenue...");

  try {
    // Récupérer le badge de bienvenue
    const welcomeBadge = await prisma.badge.findFirst({
      where: {
        title: "Bienvenue",
      },
    });

    if (!welcomeBadge) {
      console.log(
        "❌ Badge de bienvenue non trouvé. Veuillez d'abord exécuter le script de création des badges."
      );
      return;
    }

    // Récupérer tous les utilisateurs qui n'ont pas encore le badge de bienvenue
    const usersWithoutWelcomeBadge = await prisma.user.findMany({
      where: {
        badges: {
          none: {
            badgeId: welcomeBadge.id,
          },
        },
        deletedAt: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (usersWithoutWelcomeBadge.length === 0) {
      console.log("✅ Tous les utilisateurs actifs ont déjà le badge de bienvenue.");
      return;
    }

    console.log(`👥 ${usersWithoutWelcomeBadge.length} utilisateur(s) à traiter...`);

    // Attribuer le badge de bienvenue à chaque utilisateur
    for (const user of usersWithoutWelcomeBadge) {
      await prisma.userBadge.create({
        data: {
          userId: user.id,
          badgeId: welcomeBadge.id,
          earnedAt: user.createdAt, // Date d'inscription comme date d'obtention
          reason: "Inscription sur la plateforme",
          isVisible: true,
        },
      });

      console.log(`🎖️ Badge attribué à ${user.name} (${user.email})`);
    }

    console.log(
      `🎉 Attribution terminée ! ${usersWithoutWelcomeBadge.length} badge(s) de bienvenue attribué(s).`
    );

    // Statistiques finales
    const totalUserBadges = await prisma.userBadge.count({
      where: {
        badgeId: welcomeBadge.id,
      },
    });

    console.log(`📊 Total d'utilisateurs avec le badge de bienvenue : ${totalUserBadges}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'attribution des badges:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  assignWelcomeBadges().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default assignWelcomeBadges;
