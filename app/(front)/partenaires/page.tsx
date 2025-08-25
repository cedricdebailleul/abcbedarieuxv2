import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PartnersSection } from "@/components/partners/partners-section";
import {
  Handshake,
  Building2,
  Users,
  Award,
  Target,
  Heart,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nos Partenaires - ABC Bédarieux",
  description:
    "Découvrez les partenaires qui font confiance à ABC Bédarieux et contribuent au développement de l'économie locale.",
};

const partnerTypes = [
  {
    icon: Building2,
    title: "Partenaires institutionnels",
    description:
      "Collectivités et organismes publics qui soutiennent notre mission",
    count: "8+",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Users,
    title: "Partenaires économiques",
    description: "Chambres de commerce et associations d'entrepreneurs",
    count: "12+",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Heart,
    title: "Partenaires associatifs",
    description: "Associations locales qui promeuvent le territoire",
    count: "15+",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: Award,
    title: "Partenaires premium",
    description:
      "Établissements qui bénéficient d'un accompagnement privilégié",
    count: "25+",
    color: "bg-purple-100 text-purple-600",
  },
];

const institutionalPartners = [
  {
    name: "Mairie de Bédarieux",
    category: "Collectivité locale",
    description: "Partenaire principal pour le développement économique local",
    logo: "/images/partners/mairie-bedarieux.svg",
    website: "https://bedarieux.fr",
    collaboration: "Promotion du territoire et événements locaux",
  },
  {
    name: "Communauté de Communes",
    category: "Intercommunalité",
    description: "Soutien au développement économique intercommunal",
    logo: "/images/partners/cc-orb-libron.svg",
    website: "#",
    collaboration: "Extension territoriale et coordination",
  },
  {
    name: "Conseil Départemental",
    category: "Collectivité départementale",
    description: "Accompagnement des initiatives économiques locales",
    logo: "/images/partners/herault.svg",
    website: "https://herault.fr",
    collaboration: "Subventions et accompagnement technique",
  },
  {
    name: "Région Occitanie",
    category: "Collectivité régionale",
    description: "Soutien aux projets de digitalisation territoriale",
    logo: "/images/partners/region-occitanie.svg",
    website: "https://laregion.fr",
    collaboration: "Financement et promotion régionale",
  },
];

const businessPartners = [
  {
    name: "CCI Hérault",
    category: "Chambre de Commerce",
    description: "Accompagnement des entreprises locales",
    logo: "/images/partners/cci-herault.svg",
    services: ["Formation", "Conseil", "Networking"],
  },
  {
    name: "CMA Hérault",
    category: "Chambre des Métiers",
    description: "Soutien aux artisans du territoire",
    logo: "/images/partners/cma-herault.svg",
    services: ["Formation", "Accompagnement", "Promotion"],
  },
  {
    name: "Association des Commerçants",
    category: "Association professionnelle",
    description: "Fédération des commerçants de Bédarieux",
    logo: "/images/partners/commercants-bedarieux.svg",
    services: ["Animation", "Promotion", "Événements"],
  },
];

const benefits = [
  {
    icon: Target,
    title: "Visibilité accrue",
    description:
      "Nos partenaires bénéficient d'une mise en avant privilégiée sur la plateforme",
  },
  {
    icon: Users,
    title: "Réseau élargi",
    description:
      "Accès à un réseau de plus de 200 établissements et professionnels locaux",
  },
  {
    icon: Calendar,
    title: "Événements exclusifs",
    description: "Participation à nos événements de networking et formations",
  },
  {
    icon: Award,
    title: "Accompagnement personnalisé",
    description:
      "Support dédié et conseils pour optimiser votre présence locale",
  },
];

const testimonials = [
  {
    name: "Marie Dubois",
    role: "Présidente Association des Commerçants",
    company: "Bédarieux Centre-Ville",
    content:
      "ABC Bédarieux a révolutionné la visibilité de nos commerces. Un outil indispensable pour notre territoire.",
    rating: 5,
  },
  {
    name: "Jean-Pierre Martin",
    role: "Responsable Économique",
    company: "Mairie de Bédarieux",
    content:
      "Un partenariat fructueux qui contribue vraiment au développement économique local et à l'attractivité de notre ville.",
    rating: 5,
  },
  {
    name: "Sophie Leclerc",
    role: "Conseillère CCI",
    company: "CCI Hérault",
    content:
      "ABC Bédarieux est un exemple réussi de digitalisation territoriale. Nous sommes fiers de les accompagner.",
    rating: 5,
  },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-6 text-primary border-primary/20"
          >
            Écosystème partenaires
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Nos Partenaires
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Découvrez les acteurs qui nous font confiance et contribuent
            ensemble au développement de l&apos;économie locale de Bédarieux.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">Devenir partenaire</Link>
          </Button>
        </div>
      </section>

      {/* Partners Section dynamique */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <PartnersSection
            title="Tous nos partenaires"
            subtitle="Découvrez les entreprises, institutions et organisations qui nous accompagnent"
            showFilters={true}
            showStats={true}
            size="md"
          />
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Avantages partenaires
            </h2>
            <p className="text-lg text-gray-600">
              Ce que nous apportons à nos partenaires
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="text-center p-6 bg-white rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Rejoignez nos partenaires
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Vous souhaitez devenir partenaire d&apos;ABC Bédarieux ?
            Contactez-nous pour découvrir les opportunités de collaboration.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/contact">
                <Handshake className="w-5 h-5 mr-2" />
                Devenir partenaire
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/about">En savoir plus sur nous</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
