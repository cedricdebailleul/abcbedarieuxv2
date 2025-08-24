import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Lightbulb,
  Rocket,
  Users,
  Star,
  Trophy,
  Heart,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Notre Histoire - ABC Bédarieux",
  description:
    "Découvrez l'histoire d'ABC Bédarieux, de sa création à aujourd'hui. Un parcours dédié à la valorisation du patrimoine économique local.",
};

const timeline = [
  {
    year: "2019",
    icon: Lightbulb,
    title: "L'idée prend forme",
    description:
      "Constatant le manque de visibilité des commerces locaux sur internet, l'idée d'ABC Bédarieux germe dans l'esprit de ses fondateurs.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    year: "2020",
    icon: Rocket,
    title: "Lancement du projet",
    description:
      "Malgré les défis de la pandémie, ABC Bédarieux voit officiellement le jour avec les premiers référencements d'établissements locaux.",
    color: "bg-green-100 text-green-600",
  },
  {
    year: "2021",
    icon: Users,
    title: "Première communauté",
    description:
      "100 établissements rejoignent la plateforme. La communauté ABC Bédarieux prend forme et commence à créer du lien sur le territoire.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    year: "2022",
    icon: Star,
    title: "Extension territoriale",
    description:
      "ABC Bédarieux étend son rayonnement aux communes voisines, créant un véritable réseau économique intercommunal.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    year: "2023",
    icon: Trophy,
    title: "Reconnaissance locale",
    description:
      "La plateforme devient une référence incontournable, reconnue par les acteurs économiques et institutionnels du territoire.",
    color: "bg-red-100 text-red-600",
  },
  {
    year: "2024",
    icon: Heart,
    title: "Aujourd'hui",
    description:
      "Plus de 200 établissements font confiance à ABC Bédarieux pour leur visibilité locale. L'aventure continue !",
    color: "bg-pink-100 text-pink-600",
  },
];

const milestones = [
  { number: "2019", label: "Année de création", icon: Calendar },
  { number: "200+", label: "Établissements partenaires", icon: Users },
  { number: "15+", label: "Communes couvertes", icon: MapPin },
  { number: "5", label: "Années d'expérience", icon: Star },
];

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-6 text-primary border-primary/20"
          >
            Notre parcours
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Notre Histoire
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            De l&apos;idée initiale à la plateforme d&apos;aujourd&apos;hui,
            découvrez le parcours d&apos;ABC Bédarieux au service de
            l&apos;économie locale.
          </p>
          <Button asChild size="lg">
            <Link href="/about">En savoir plus sur nous</Link>
          </Button>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {milestones.map((milestone) => (
              <Card
                key={milestone.label}
                className="text-center border-0 shadow-md hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <milestone.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {milestone.number}
                  </div>
                  <div className="text-sm text-gray-600">{milestone.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Chronologie de notre aventure
            </h2>
            <p className="text-lg text-gray-600">
              Chaque étape qui a marqué le développement d&apos;ABC Bédarieux
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 hidden md:block"></div>

            <div className="space-y-12">
              {timeline.map((event) => (
                <div key={event.year} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div className="hidden md:flex absolute left-6 w-4 h-4 bg-white border-4 border-primary rounded-full"></div>

                  <Card className="w-full md:ml-20 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${event.color}`}
                        >
                          <event.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              variant="outline"
                              className="text-primary font-bold"
                            >
                              {event.year}
                            </Badge>
                            <CardTitle className="text-xl text-gray-900">
                              {event.title}
                            </CardTitle>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-gray-600 leading-relaxed ml-16">
                        {event.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Et demain ?
          </h2>

          <Card className="max-w-2xl mx-auto hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Notre vision pour l&apos;avenir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed mb-6">
                ABC Bédarieux continue d&apos;évoluer pour mieux servir
                l&apos;économie locale. Nouvelles fonctionnalités, partenariats
                renforcés, et toujours plus de services pour connecter habitants
                et commerçants de notre territoire.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild>
                  <Link href="/places">Découvrir nos partenaires</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">Nous rejoindre</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
