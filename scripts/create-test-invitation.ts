import crypto from "node:crypto";
import { prisma } from "./prisma-client";

async function createTestInvitation() {
  console.log("🎫 Création d'une invitation de test...");

  try {
    const email = "test@example.com";
    const role = "user";
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    // Supprimer les anciennes invitations pour cet email
    await prisma.verification.deleteMany({
      where: {
        identifier: email,
        type: "EMAIL",
      },
    });

    // Créer la nouvelle invitation
    const _invitation = await prisma.verification.create({
      data: {
        identifier: email,
        value: inviteToken,
        type: "EMAIL",
        expiresAt,
        used: false,
      },
    });

    const inviteUrl = `http://localhost:3003/auth/accept-invitation?token=${inviteToken}&email=${encodeURIComponent(email)}&role=${role}`;

    console.log("✅ Invitation créée avec succès !");
    console.log("📧 Email:", email);
    console.log("🎫 Token:", inviteToken);
    console.log("⏰ Expire le:", expiresAt.toLocaleString("fr-FR"));
    console.log("🔗 URL de test:");
    console.log(inviteUrl);
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'invitation:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createTestInvitation().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default createTestInvitation;
