import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

// Configuration de la page pour le rendu statique avec revalidation
export const revalidate = 3600; // Revalide toutes les heures
import {
  Calendar,
  Lightbulb,
  Rocket,
  Users,
  Star,
  Trophy,
  Heart,
  Award,
  Target,
  Zap,
  Gift,
  Crown,
  Shield,
  Flag,
  Home,
  Building,
  Store,
  Coffee,
  Camera,
  Music,
  Palette,
  Scissors,
  Wrench,
  Book,
  Newspaper,
  Phone,
  Mail,
  Globe,
  Map,
  Navigation,
  Compass,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Edit,
  Trash2,
  Settings,
  Info,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  Share,
  Download,
  Upload,
  ExternalLink,
  MapPin} from "lucide-react";
import Link from "next/link";
import { HistoryApiResponse } from "@/lib/types/history";

// Map des icônes Lucide
const iconMap: Record<string, typeof Calendar> = {
  Calendar,
  MapPin,
  Lightbulb,
  Rocket,
  Users,
  Star,
  Trophy,
  Heart,
  Award,
  Target,
  Zap,
  Gift,
  Crown,
  Shield,
  Flag,
  Home,
  Building,
  Store,
  Coffee,
  Camera,
  Music,
  Palette,
  Scissors,
  Wrench,
  Book,
  Newspaper,
  Phone,
  Mail,
  Globe,
  Map,
  Navigation,
  Compass,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Edit,
  Trash2,
  Settings,
  Info,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  Share,
  Download,
  Upload,
  ExternalLink,
};

// Récupérer les données directement depuis la base de données
async function getHistoryData(): Promise<HistoryApiResponse> {
  try {
    // Récupérer la configuration active directement depuis la base de données
    const config = await prisma.historyConfig.findFirst({
      where: { isActive: true },
      include: {
        milestones: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        timelineEvents: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const milestones = config?.milestones || [];
    const timelineEvents = config?.timelineEvents || [];

    return {
      config: config || null,
      milestones,
      timelineEvents
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'histoire:", error);
    // Retourner des données par défaut en cas d'erreur
    return {
      config: null,
      milestones: [],
      timelineEvents: [],
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getHistoryData();

  return {
    title: data.config?.title
      ? `${data.config.title} - ABC Bédarieux`
      : "Notre Histoire - ABC Bédarieux",
    description:
      data.config?.description ||
      "Découvrez l'histoire d'ABC Bédarieux, de sa création à aujourd'hui. Un parcours dédié à la valorisation du patrimoine économique local.",
  };
}

export default async function HistoryPage() {
  const data = await getHistoryData();

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Calendar;
  };

  // Données par défaut si aucune configuration n'est trouvée
  const defaultConfig = {
    title: "Notre Histoire",
    subtitle: "Notre parcours",
    description:
      "De l'idée initiale à la plateforme d'aujourd'hui, découvrez le parcours d'ABC Bédarieux au service de l'économie locale.",
    visionTitle: "Et demain ?",
    visionDescription:
      "ABC Bédarieux continue d'évoluer pour mieux servir l'économie locale. Nouvelles fonctionnalités, partenariats renforcés, et toujours plus de services pour connecter habitants et commerçants de notre territoire.",
    primaryButtonText: "Découvrir nos partenaires",
    primaryButtonUrl: "/places",
    secondaryButtonText: "Nous rejoindre",
    secondaryButtonUrl: "/contact",
  };

  const config = data.config || defaultConfig;
  const milestones = data.milestones || [];
  const timelineEvents = data.timelineEvents || [];
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          {config.subtitle && (
            <Badge
              variant="outline"
              className="mb-6 text-primary border-primary/20"
            >
              {config.subtitle}
            </Badge>
          )}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {config.title}
          </h1>
          {config.description && (
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {config.description}
            </p>
          )}
          {config.primaryButtonText && config.primaryButtonUrl && (
            <Button asChild size="lg">
              <Link href={config.primaryButtonUrl}>
                {config.primaryButtonText}
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Milestones Section */}
      {milestones.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {milestones.map((milestone) => {
                const IconComponent = getIcon(milestone.icon);
                return (
                  <Card
                    key={milestone.id}
                    className="text-center border-0 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {milestone.number}
                      </div>
                      <div className="text-sm text-gray-600">
                        {milestone.label}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Timeline Section */}
      {timelineEvents.length > 0 && (
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
                {timelineEvents.map((event) => {
                  const IconComponent = getIcon(event.icon);
                  return (
                    <div key={event.id} className="relative flex items-start">
                      {/* Timeline dot */}
                      <div className="hidden md:flex absolute left-6 w-4 h-4 bg-white border-4 border-primary rounded-full"></div>

                      <Card className="w-full md:ml-20 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${event.color}`}
                            >
                              <IconComponent className="w-6 h-6" />
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
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Vision Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {config.visionTitle && (
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              {config.visionTitle}
            </h2>
          )}

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
              {config.visionDescription && (
                <p className="text-gray-600 leading-relaxed mb-6">
                  {config.visionDescription}
                </p>
              )}
              <div className="flex flex-wrap gap-4 justify-center">
                {config.primaryButtonText && config.primaryButtonUrl && (
                  <Button asChild>
                    <Link href={config.primaryButtonUrl}>
                      {config.primaryButtonText}
                    </Link>
                  </Button>
                )}
                {config.secondaryButtonText && config.secondaryButtonUrl && (
                  <Button variant="outline" asChild>
                    <Link href={config.secondaryButtonUrl}>
                      {config.secondaryButtonText}
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
