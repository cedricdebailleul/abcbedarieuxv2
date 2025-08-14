import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🌱 Configuration administrateur...");

  try {
    // Créer/Mettre à jour l'administrateur
    console.log("👑 Configuration de l'administrateur...");
    const adminUser = await prisma.user.upsert({
      where: { email: "cedric.debailleul62@gmail.com" },
      update: { 
        role: "admin",
        emailVerified: true,
      },
      create: {
        name: "Cédric Debailleul",
        email: "cedric.debailleul62@gmail.com",
        emailVerified: true,
        role: "admin",
        slug: "cedric-debailleul",
        profile: {
          create: {
            bio: "Administrateur de la plateforme ABC Bédarieux",
            address: "Bédarieux, France",
          },
        },
      },
      include: { profile: true },
    });

    console.log("✅ Administrateur configuré avec succès !");
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👤 Rôle: ${adminUser.role}`);
    console.log(`🔗 Slug: ${adminUser.slug}`);
    
    if (adminUser.profile) {
      console.log(`📍 Adresse: ${adminUser.profile.address}`);
      console.log(`📝 Bio: ${adminUser.profile.bio}`);
    }

  } catch (error) {
    console.error("❌ Erreur lors de la configuration :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });