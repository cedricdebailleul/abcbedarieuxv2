import { prisma } from "@/lib/prisma";

// Supprimer les demandes RGPD anciennes (après 3 ans)
async function cleanupOldRequests() {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  await prisma.gDPRRequest.deleteMany({
    where: {
      createdAt: {
        lt: threeYearsAgo,
      },
      status: "COMPLETED",
    },
  });
}

cleanupOldRequests().then(() => {
  console.log("Nettoyage RGPD terminé");
  process.exit(0);
});
