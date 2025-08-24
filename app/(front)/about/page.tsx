import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Users, MapPin, Target, Award } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos - ABC Bédarieux",
  description:
    "Découvrez l'histoire, la mission et les valeurs d'ABC Bédarieux, votre annuaire local dédié au développement économique de Bédarieux.",
};

const stats = [
  {
    icon: Users,
    label: "Établissements référencés",
    value: "200+",
    color: "text-blue-600",
  },
  {
    icon: MapPin,
    label: "Communes couvertes",
    value: "15+",
    color: "text-green-600",
  },
  {
    icon: Heart,
    label: "Années d'expérience",
    value: "5+",
    color: "text-red-600",
  },
  {
    icon: Award,
    label: "Partenaires locaux",
    value: "50+",
    color: "text-purple-600",
  },
];

const values = [
  {
    icon: Target,
    title: "Notre Mission",
    description:
      "Promouvoir et valoriser l'économie locale de Bédarieux et ses alentours en offrant une vitrine numérique aux commerces et services locaux.",
  },
  {
    icon: Heart,
    title: "Nos Valeurs",
    description:
      "Proximité, authenticité et solidarité sont au cœur de notre démarche pour créer du lien entre les habitants et leur territoire.",
  },
  {
    icon: Users,
    title: "Notre Vision",
    description:
      "Devenir la référence incontournable pour découvrir et soutenir l'écosystème économique local de notre belle région.",
  },
];

const team = [
  {
    name: "L'équipe ABC Bédarieux",
    role: "Passionnés du territoire",
    description:
      "Une équipe dévouée qui travaille chaque jour pour mettre en valeur les richesses locales et faciliter les connexions entre habitants et commerçants.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-6 text-primary border-primary/20"
          >
            À propos de nous
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            ABC Bédarieux
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Votre annuaire local dédié à la promotion et à la valorisation de
            l&apos;économie de Bédarieux et ses alentours.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/places">Découvrir les établissements</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="text-center border-0 shadow-md hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div
                    className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center ${stat.color}`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nos valeurs et notre engagement
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ABC Bédarieux s&apos;engage quotidiennement pour le développement
              de l&apos;économie locale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value) => (
              <Card
                key={value.title}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Notre équipe
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            Des passionnés au service du territoire
          </p>

          {team.map((member) => (
            <Card
              key={member.name}
              className="max-w-2xl mx-auto hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl text-gray-900">
                  {member.name}
                </CardTitle>
                <Badge variant="outline" className="mx-auto">
                  {member.role}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  {member.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Rejoignez l&apos;aventure ABC Bédarieux
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Vous êtes commerçant, artisan ou prestataire de services ?
            Faites-vous connaître !
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/contact">Nous rejoindre</Link>
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
