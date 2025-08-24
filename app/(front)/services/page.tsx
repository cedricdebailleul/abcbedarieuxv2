import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Calendar,
  Star,
  Megaphone,
  BarChart3,
  Shield,
  Smartphone,
  Globe,
  Heart,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nos Services - ABC Bédarieux",
  description:
    "Découvrez tous les services proposés par ABC Bédarieux pour les établissements et les habitants : référencement, visibilité, événements et bien plus.",
};

const mainServices = [
  {
    icon: Search,
    title: "Référencement local",
    description:
      "Votre établissement visible sur notre plateforme avec fiche détaillée, photos, horaires et informations de contact.",
    features: [
      "Fiche établissement complète",
      "Galerie photos",
      "Horaires d'ouverture",
      "Informations de contact",
    ],
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: MapPin,
    title: "Géolocalisation",
    description:
      "Intégration cartographique pour faciliter l'accès à votre établissement et améliorer votre visibilité locale.",
    features: [
      "Localisation précise",
      "Itinéraires",
      "Vue satellite",
      "Points d'intérêt",
    ],
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Calendar,
    title: "Gestion d'événements",
    description:
      "Promotion de vos événements, animations et actualités auprès de la communauté locale.",
    features: [
      "Création d'événements",
      "Calendrier partagé",
      "Notifications",
      "Partage social",
    ],
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Statistiques",
    description:
      "Suivez les performances de votre fiche établissement avec des statistiques détaillées de consultation.",
    features: [
      "Vues de profil",
      "Clics sur contact",
      "Engagement utilisateur",
      "Rapports mensuels",
    ],
    color: "bg-orange-100 text-orange-600",
  },
];

const additionalServices = [
  {
    icon: Megaphone,
    title: "Promotion ciblée",
    description:
      "Mise en avant de votre établissement dans nos communications et newsletters.",
  },
  {
    icon: Shield,
    title: "Gestion des avis",
    description:
      "Système d'avis clients pour améliorer votre réputation en ligne.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description: "Plateforme optimisée pour les smartphones et tablettes.",
  },
  {
    icon: Globe,
    title: "Présence web",
    description:
      "Amélioration de votre visibilité sur les moteurs de recherche locaux.",
  },
];

const forResidents = [
  {
    icon: Search,
    title: "Recherche facilitée",
    description:
      "Trouvez rapidement les commerces et services près de chez vous.",
  },
  {
    icon: Star,
    title: "Recommandations",
    description: "Découvrez les établissements les mieux notés et recommandés.",
  },
  {
    icon: Calendar,
    title: "Agenda local",
    description: "Ne manquez aucun événement organisé dans votre ville.",
  },
  {
    icon: Heart,
    title: "Soutien local",
    description: "Participez activement au développement de l'économie locale.",
  },
];

const plans = [
  {
    name: "Gratuit",
    price: "0€",
    period: "par mois",
    description: "Pour commencer votre présence locale",
    features: [
      "Fiche établissement basique",
      "Informations de contact",
      "Horaires d'ouverture",
      "Géolocalisation",
    ],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Standard",
    price: "Sur devis",
    period: "par mois",
    description: "Pour développer votre visibilité",
    features: [
      "Tout du plan gratuit",
      "Galerie photos illimitée",
      "Gestion d'événements",
      "Statistiques détaillées",
      "Support prioritaire",
    ],
    cta: "Nous contacter",
    popular: true,
  },
  {
    name: "Premium",
    price: "Sur devis",
    period: "par mois",
    description: "Pour maximiser votre impact",
    features: [
      "Tout du plan standard",
      "Mise en avant prioritaire",
      "Newsletter dédiée",
      "Reporting avancé",
      "Accompagnement personnalisé",
    ],
    cta: "Découvrir",
    popular: false,
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-6 text-primary border-primary/20"
          >
            Nos services
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Des solutions pour tous
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Que vous soyez commerçant, artisan ou habitant, ABC Bédarieux vous
            propose des services adaptés à vos besoins.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">Nous contacter</Link>
          </Button>
        </div>
      </section>

      {/* Main Services Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Services pour les professionnels
            </h2>
            <p className="text-lg text-gray-600">
              Développez votre visibilité locale avec nos solutions dédiées
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mainServices.map((service) => (
              <Card
                key={service.title}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${service.color} flex-shrink-0`}
                    >
                      <service.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 mb-2">
                        {service.title}
                      </CardTitle>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Services complémentaires
            </h2>
            <p className="text-lg text-gray-600">
              Encore plus d&apos;options pour booster votre présence locale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalServices.map((service) => (
              <Card
                key={service.title}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <service.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-gray-900">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Residents Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Services pour les habitants
            </h2>
            <p className="text-lg text-gray-600">
              Découvrez et soutenez l&apos;économie locale facilement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {forResidents.map((service) => (
              <Card
                key={service.title}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
                    <service.icon className="w-8 h-8 text-secondary" />
                  </div>
                  <CardTitle className="text-lg text-gray-900">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nos formules
            </h2>
            <p className="text-lg text-gray-600">
              Choisissez la solution qui correspond à vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative hover:shadow-lg transition-shadow ${plan.popular ? "ring-2 ring-primary shadow-lg" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-white">
                      Plus populaire
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/contact">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Prêt à nous rejoindre ?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Contactez-nous pour discuter de vos besoins et découvrir comment ABC
            Bédarieux peut vous accompagner.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/contact">Nous contacter</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/places">Voir les établissements</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
