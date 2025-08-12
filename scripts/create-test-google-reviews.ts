import { prisma } from "../lib/prisma";

const PLACE_ID = "cme89vjoo000xuy3kvmcs38te"; // Black Bear Studio

const testReviews = [
  {
    authorName: "Sophie Martin",
    rating: 5,
    comment:
      "Excellent travail de Black Bear Studio ! Site web magnifique et service client au top. L'équipe a parfaitement compris nos besoins et a livré un projet dépassant nos attentes. Je recommande vivement pour tous vos projets digitaux.",
    relativeTime: "il y a 2 mois",
    googleTime: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60, // il y a 2 mois
  },
  {
    authorName: "Pierre Dubois",
    rating: 5,
    comment:
      "Une agence digitale de qualité ! Très professionnel, à l'écoute et créatif. Notre nouveau site e-commerce fonctionne parfaitement et les ventes ont augmenté. L'accompagnement post-livraison est également excellent.",
    relativeTime: "il y a 1 mois",
    googleTime: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // il y a 1 mois
  },
  {
    authorName: "Marie Leroy",
    rating: 4,
    comment:
      "Très bonne expérience avec Black Bear Studio. Design moderne et fonctionnalités avancées. Seul petit bémol sur les délais qui ont été un peu dépassés, mais le résultat final vaut le coup !",
    relativeTime: "il y a 3 semaines",
    googleTime: Math.floor(Date.now() / 1000) - 21 * 24 * 60 * 60, // il y a 3 semaines
  },
  {
    authorName: "Thomas Rousseau",
    rating: 5,
    comment:
      "Parfait ! L'équipe de Black Bear Studio a développé notre plateforme avec une expertise remarquable. Système d'automatisation impeccable et design responsive. Un vrai partenaire technologique !",
    relativeTime: "il y a 1 semaine",
    googleTime: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, // il y a 1 semaine
  },
  {
    authorName: "Isabelle Moreau",
    rating: 5,
    comment:
      "Je recommande sans hésiter ! Black Bear Studio a transformé notre identité visuelle complètement. Logo, site web, supports print... tout est cohérent et professionnel. Merci pour ce beau travail !",
    relativeTime: "il y a 4 jours",
    googleTime: Math.floor(Date.now() / 1000) - 4 * 24 * 60 * 60, // il y a 4 jours
  },
];

async function createTestGoogleReviews() {
  console.log("🚀 Création d'avis Google de test...");

  // Vérifier que la place existe
  const place = await prisma.place.findUnique({
    where: { id: PLACE_ID },
    select: { id: true, name: true },
  });

  if (!place) {
    console.error("❌ Place non trouvée avec l'ID:", PLACE_ID);
    return;
  }

  console.log("✅ Place trouvée:", place.name);

  // Supprimer les avis de test existants
  await prisma.googleReview.deleteMany({
    where: {
      placeId: PLACE_ID,
      authorName: { in: testReviews.map((r) => r.authorName) },
    },
  });

  console.log("🧹 Avis existants supprimés");

  // Créer les nouveaux avis
  let created = 0;
  for (const review of testReviews) {
    try {
      const googleReviewId = `test_${PLACE_ID}_${review.authorName.replace(
        /\s+/g,
        "_"
      )}_${review.googleTime}`;

      await prisma.googleReview.create({
        data: {
          placeId: PLACE_ID,
          rating: review.rating,
          comment: review.comment,
          googleReviewId,
          authorName: review.authorName,
          authorUrl: null,
          googleTime: review.googleTime,
          relativeTime: review.relativeTime,
        },
      });

      created++;
      console.log(`✅ Avis créé: ${review.authorName} (${review.rating}⭐)`);
    } catch (error) {
      console.error(`❌ Erreur création avis ${review.authorName}:`, error);
    }
  }

  // Mettre à jour les statistiques de la place
  if (created > 0) {
    const stats = await prisma.googleReview.aggregate({
      where: { placeId: PLACE_ID, status: "APPROVED" },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.place.update({
      where: { id: PLACE_ID },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.id,
      },
    });

    console.log("📊 Statistiques mises à jour:", {
      moyenne: stats._avg.rating?.toFixed(1),
      total: stats._count.id,
    });
  }

  console.log(`🎉 ${created} avis Google de test créés avec succès !`);
}

createTestGoogleReviews()
  .then(() => {
    console.log("✨ Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur:", error);
    process.exit(1);
  });
