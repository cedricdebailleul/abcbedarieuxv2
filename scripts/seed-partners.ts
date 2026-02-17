import { prisma } from "./prisma-client";
import { PartnerType } from "../lib/generated/prisma/index.js";

/**
 * Script pour créer des partenaires institutionnels et économiques
 */

const institutionalPartners = [
  {
    name: "Mairie de Bédarieux",
    slug: "mairie-bedarieux",
    description: "Partenaire principal pour le développement économique local. La mairie soutient activement les commerces et services locaux à travers diverses initiatives.",
    partnerType: PartnerType.INSTITUTIONAL,
    category: "Collectivité locale",
    email: "contact@bedarieux.fr",
    phone: "04 67 95 00 00",
    website: "https://www.bedarieux.fr",
    logo: null,
    isFeatured: true,
    isActive: true,
    priority: 1,
  },
  {
    name: "Communauté de Communes Grand Orb",
    slug: "cc-grand-orb",
    description: "Intercommunalité regroupant 19 communes du territoire. Accompagne le développement économique et touristique de la région.",
    partnerType: PartnerType.INSTITUTIONAL,
    category: "Intercommunalité",
    email: "contact@cc-grandorb.fr",
    phone: "04 67 23 02 21",
    website: "https://www.cc-grandorb.fr",
    logo: null,
    isFeatured: true,
    isActive: true,
    priority: 2,
  },
  {
    name: "CCI Hérault",
    slug: "cci-herault",
    description: "Chambre de Commerce et d'Industrie de l'Hérault. Accompagnement des entreprises, formation des entrepreneurs et développement économique du territoire.",
    partnerType: PartnerType.COMMERCIAL,
    category: "Chambre consulaire",
    email: "contact@herault.cci.fr",
    phone: "04 67 13 90 00",
    website: "https://www.herault.cci.fr",
    logo: null,
    isFeatured: true,
    isActive: true,
    priority: 3,
  },
  {
    name: "Chambre de Métiers et de l'Artisanat de l'Hérault",
    slug: "cma-herault",
    description: "Représente et accompagne les artisans dans leur développement. Formation, conseil et accompagnement des entreprises artisanales.",
    partnerType: PartnerType.COMMERCIAL,
    category: "Chambre consulaire",
    email: "contact@cm-montpellier.fr",
    phone: "04 67 20 70 00",
    website: "https://www.cm-montpellier.fr",
    logo: null,
    isFeatured: true,
    isActive: true,
    priority: 4,
  },
  {
    name: "Région Occitanie",
    slug: "region-occitanie",
    description: "Soutient le développement économique régional à travers des aides aux entreprises, à l'innovation et à la formation professionnelle.",
    partnerType: PartnerType.INSTITUTIONAL,
    category: "Collectivité régionale",
    email: "contact@laregion.fr",
    phone: "04 67 22 80 00",
    website: "https://www.laregion.fr",
    logo: null,
    isFeatured: false,
    isActive: true,
    priority: 5,
  },
  {
    name: "Département de l'Hérault",
    slug: "departement-herault",
    description: "Collectivité territoriale qui soutient le développement local, l'action sociale et l'aménagement du territoire.",
    partnerType: PartnerType.INSTITUTIONAL,
    category: "Département",
    email: "contact@herault.fr",
    phone: "04 67 67 67 67",
    website: "https://www.herault.fr",
    logo: null,
    isFeatured: false,
    isActive: true,
    priority: 6,
  },
  {
    name: "BPI France",
    slug: "bpi-france",
    description: "Banque publique d'investissement qui finance et accompagne les entreprises dans leur développement, innovation et export.",
    partnerType: PartnerType.COMMERCIAL,
    category: "Banque publique",
    email: "contact@bpifrance.fr",
    phone: "04 99 74 24 00",
    website: "https://www.bpifrance.fr",
    logo: null,
    isFeatured: false,
    isActive: true,
    priority: 7,
  },
  {
    name: "Pôle Emploi Bédarieux",
    slug: "pole-emploi-bedarieux",
    description: "Service public de l'emploi. Accompagne les demandeurs d'emploi et les entreprises dans leurs projets de recrutement.",
    partnerType: PartnerType.INSTITUTIONAL,
    category: "Service public",
    email: "bedarieux@pole-emploi.fr",
    phone: "39 49",
    website: "https://www.pole-emploi.fr",
    logo: null,
    isFeatured: false,
    isActive: true,
    priority: 8,
  },
];

async function seedPartners() {
  console.log("🌱 Démarrage du seed des partenaires...\n");

  try {
    // Créer ou mettre à jour chaque partenaire
    for (const partner of institutionalPartners) {
      console.log(`📝 Traitement: ${partner.name}...`);

      const existingPartner = await prisma.partner.findUnique({
        where: { slug: partner.slug },
      });

      if (existingPartner) {
        // Mettre à jour si existe
        await prisma.partner.update({
          where: { slug: partner.slug },
          data: partner,
        });
        console.log(`   ✅ Partenaire mis à jour: ${partner.name}`);
      } else {
        // Créer si n'existe pas
        await prisma.partner.create({
          data: partner,
        });
        console.log(`   ✅ Partenaire créé: ${partner.name}`);
      }
    }

    console.log("\n✅ Seed des partenaires terminé avec succès!");
    console.log(`📊 Total: ${institutionalPartners.length} partenaires`);

    // Statistiques
    const stats = await prisma.partner.groupBy({
      by: ["partnerType"],
      _count: true,
    });

    console.log("\n📈 Statistiques:");
    stats.forEach((stat) => {
      console.log(`   - ${stat.partnerType}: ${stat._count} partenaires`);
    });
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seed
seedPartners()
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
