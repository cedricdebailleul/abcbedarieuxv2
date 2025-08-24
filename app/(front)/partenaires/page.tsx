import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Handshake,
  Building2,
  Users,
  Award,
  Target,
  Heart,
  Calendar,
  Star,
  ExternalLink,
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

      {/* Partner Types */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Types de partenariats
            </h2>
            <p className="text-lg text-gray-600">
              Différentes formes de collaboration pour un impact maximal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partnerTypes.map((type) => (
              <Card
                key={type.title}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${type.color}`}
                  >
                    <type.icon className="w-8 h-8" />
                  </div>
                  <Badge variant="outline" className="mx-auto mb-2">
                    {type.count} partenaires
                  </Badge>
                  <CardTitle className="text-lg text-gray-900">
                    {type.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {type.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Partners */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Partenaires institutionnels
            </h2>
            <p className="text-lg text-gray-600">
              Le soutien des collectivités locales et organismes publics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {institutionalPartners.map((partner) => (
              <Card
                key={partner.name}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border-2 border-gray-100 flex-shrink-0">
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {partner.category}
                      </Badge>
                      <CardTitle className="text-xl text-gray-900 mb-2">
                        {partner.name}
                      </CardTitle>
                      <p className="text-gray-600 text-sm">
                        {partner.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Collaboration
                      </h4>
                      <p className="text-sm text-gray-600">
                        {partner.collaboration}
                      </p>
                    </div>
                    {partner.website !== "#" && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={partner.website}
                          target="_blank"
                          rel="noopener"
                        >
                          Visiter le site{" "}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Partners */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Partenaires économiques
            </h2>
            <p className="text-lg text-gray-600">
              L&apos;expertise des chambres consulaires et associations
              professionnelles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {businessPartners.map((partner) => (
              <Card
                key={partner.name}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-xl flex items-center justify-center border-2 border-gray-100">
                    <Users className="w-10 h-10 text-green-600" />
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {partner.category}
                  </Badge>
                  <CardTitle className="text-xl text-gray-900">
                    {partner.name}
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-2">
                    {partner.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Services proposés
                      </h4>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {partner.services.map((service) => (
                          <Badge
                            key={service}
                            variant="secondary"
                            className="text-xs"
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
              <Card
                key={benefit.title}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-gray-900">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-gray-600">
              Les témoignages de nos partenaires
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.name}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-500 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 italic leading-relaxed">
                    &quot;{testimonial.content}&quot;
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}
                      </p>
                      <p className="text-xs text-gray-500">
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
