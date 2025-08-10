import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

async function checkInvitation(token: string, email: string) {
  console.log("🔍 Vérification de l'invitation...");
  console.log("📧 Email:", email);
  console.log("🎫 Token:", token);

  try {
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: email,
        value: token,
        type: "EMAIL",
      },
    });

    if (!verification) {
      console.log("❌ Aucune invitation trouvée pour cet email et ce token.");
      return;
    }

    console.log("✅ Invitation trouvée !");
    console.log("📅 Créée le:", verification.createdAt.toLocaleString("fr-FR"));
    console.log("⏰ Expire le:", verification.expiresAt.toLocaleString("fr-FR"));
    console.log("🔄 Utilisée:", verification.used ? "Oui" : "Non");
    console.log("📊 Tentatives:", verification.attempts);

    const now = new Date();
    const isExpired = verification.expiresAt < now;
    const isUsed = verification.used;

    if (isExpired) {
      console.log("⚠️ L'invitation a EXPIRE !");
    } else if (isUsed) {
      console.log("⚠️ L'invitation a déjà été UTILISEE !");
    } else {
      console.log("🎉 L'invitation est VALIDE et peut être utilisée !");
    }

  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script avec les paramètres fournis
if (require.main === module) {
  const token = process.argv[2];
  const email = process.argv[3];

  if (!token || !email) {
    console.log("Usage: npx tsx scripts/check-invitation.ts <token> <email>");
    process.exit(1);
  }

  checkInvitation(token, email).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default checkInvitation;