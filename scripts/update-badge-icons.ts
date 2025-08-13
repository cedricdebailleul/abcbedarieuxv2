import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

async function updateBadgeIcons() {
  console.log("🏆 Mise à jour des icônes de badges...\n");

  // Remplacer tous les emojis par null pour utiliser l'icône Trophy uniformément
  const badges = await prisma.badge.findMany({
    where: {
      OR: [
        { iconUrl: { contains: "👋" } },
        { iconUrl: { contains: "✅" } },
        { iconUrl: { contains: "🏪" } },
        { iconUrl: { contains: "🗺️" } },
        { iconUrl: { contains: "🌟" } },
        { iconUrl: { contains: "💬" } },
        { iconUrl: { contains: "📝" } },
        { iconUrl: { contains: "📢" } },
        { iconUrl: { contains: "🎖️" } },
        { iconUrl: { contains: "🏅" } },
        { iconUrl: { contains: "🏡" } },
        { iconUrl: { contains: "🚀" } },
      ],
    },
  });

  console.log(`📊 Trouvé ${badges.length} badges avec des emojis`);

  for (const badge of badges) {
    try {
      await prisma.badge.update({
        where: { id: badge.id },
        data: { iconUrl: null }, // Supprimer l'emoji pour utiliser l'icône Trophy
      });

      console.log(`✅ Badge "${badge.title}" - icône mise à jour`);
    } catch (error) {
      console.error(`❌ Erreur pour le badge "${badge.title}":`, error);
    }
  }

  console.log("\n🎉 Mise à jour des icônes terminée !");
}

async function main() {
  try {
    await updateBadgeIcons();
  } catch (error) {
    console.error("💥 Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { updateBadgeIcons };
