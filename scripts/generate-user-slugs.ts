import { prisma } from "./prisma-client";

function generateSlug(name: string, id: string): string {
  // Nettoyer le nom pour créer un slug SEO-friendly
  let baseSlug = name
    .toLowerCase()
    .normalize("NFD") // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, "") // Garde seulement lettres, chiffres, espaces et tirets
    .replace(/\s+/g, "-") // Remplace les espaces par des tirets
    .replace(/-+/g, "-") // Évite les tirets multiples
    .replace(/^-|-$/g, ""); // Supprime les tirets en début/fin

  // Si le slug est vide ou trop court, utiliser l'ID
  if (!baseSlug || baseSlug.length < 2) {
    baseSlug = `user-${id.slice(-8)}`;
  }

  return baseSlug;
}

async function generateUserSlugs() {
  console.log("🔍 Recherche des utilisateurs sans slug...");

  // Trouver tous les utilisateurs sans slug
  const usersWithoutSlug = await prisma.user.findMany({
    where: {
      slug: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log(`📊 Trouvé ${usersWithoutSlug.length} utilisateurs sans slug`);

  if (usersWithoutSlug.length === 0) {
    console.log("✅ Tous les utilisateurs ont déjà un slug !");
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const user of usersWithoutSlug) {
    try {
      let slug = generateSlug(user.name, user.id);
      let counter = 1;

      // Vérifier l'unicité du slug
      while (true) {
        const existingUser = await prisma.user.findUnique({
          where: { slug },
        });

        if (!existingUser) {
          break; // Slug disponible
        }

        // Slug déjà pris, ajouter un suffixe
        slug = `${generateSlug(user.name, user.id)}-${counter}`;
        counter++;

        // Éviter les boucles infinies
        if (counter > 100) {
          slug = `user-${user.id.slice(-8)}-${Date.now()}`;
          break;
        }
      }

      // Mettre à jour l'utilisateur avec le slug
      await prisma.user.update({
        where: { id: user.id },
        data: { slug },
      });

      console.log(`✅ ${user.name} (${user.email}) → /profil/${slug}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Erreur pour ${user.name}:`, error);
      errorCount++;
    }
  }

  console.log("\n📈 Résumé:");
  console.log(`✅ Slugs créés: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📊 Total traité: ${usersWithoutSlug.length}`);
}

async function main() {
  try {
    console.log("🚀 Génération des slugs utilisateurs...\n");
    await generateUserSlugs();
    console.log("\n🎉 Script terminé avec succès !");
  } catch (error) {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}

export { generateUserSlugs };
