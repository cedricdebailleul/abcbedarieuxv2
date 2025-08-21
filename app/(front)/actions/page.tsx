import { Metadata } from "next";
import { ActionsSection } from "@/components/actions/actions-section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  Users,
  TrendingUp,
  Heart,
  ShoppingBag,
  Calendar,
  Gift,
  Handshake,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nos Actions - ABC Bédarieux",
  description:
    "Découvrez toutes les actions et initiatives menées par l'Association ABC Bédarieux pour soutenir le commerce local et dynamiser la ville.",
};

const actionTypes = [
  {
    icon: ShoppingBag,
    title: "Commerce Local",
    description: "Initiatives pour soutenir nos commerçants",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: Gift,
    title: "Événements Festifs",
    description: "Animations et festivités pour tous",
    color: "bg-purple-100 text-purple-700",
  },
  {
    icon: Calendar,
    title: "Actions Saisonnières",
    description: "Catalogue de Noël, marchés thématiques",
    color: "bg-green-100 text-green-700",
  },
  {
    icon: Handshake,
    title: "Partenariats",
    description: "Collaborations avec les acteurs locaux",
    color: "bg-orange-100 text-orange-700",
  },
];

const stats = [
  { label: "Actions menées", value: "25+", icon: Target },
  { label: "Commerçants soutenus", value: "50+", icon: Users },
  { label: "Retombées économiques", value: "€150k+", icon: TrendingUp },
  { label: "Bénévoles mobilisés", value: "200+", icon: Heart },
];

export default function ActionsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2" variant="secondary">
              Nos Initiatives
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Nos Actions pour
              <span className="text-primary block md:inline"> Bédarieux</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              L&apos;Association ABC Bédarieux mène de nombreuses initiatives
              pour dynamiser notre ville et soutenir nos commerçants. Du
              catalogue de Noël aux événements festifs, découvrez comment nous
              agissons ensemble pour faire vivre le commerce local.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="#actions">Découvrir nos actions</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">Nous rejoindre</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Types d'actions */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Types d&apos;Actions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Nos initiatives couvrent différents domaines pour un impact
              maximal sur l&apos;économie locale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {actionTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${type.color}`}
                  >
                    <type.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{type.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Notre Impact</h2>
            <p className="text-muted-foreground">
              Des chiffres qui témoignent de notre engagement pour Bédarieux
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Liste de toutes les actions */}
      <section id="actions">
        <ActionsSection
          limit={50}
          featuredOnly={false}
          title="Toutes nos Actions"
          description="Explorez l'ensemble de nos initiatives passées et en cours"
        />
      </section>

      {/* Call to action */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Participez à nos Actions
            </h2>
            <p className="text-muted-foreground mb-8">
              Rejoignez-nous pour porter ensemble de nouveaux projets et faire
              grandir l&apos;économie locale de Bédarieux.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">Nous contacter</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard">Espace adhérent</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
