import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import Link from "next/link";
import Image from "next/image";

interface Action {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  summary?: string;
  coverImage?: string;
  gallery: string[];
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

async function getAction(slug: string): Promise<Action | null> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
      }/api/actions/${slug}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération de l'action:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const action = await getAction(slug);

  if (!action) {
    return {
      title: "Action non trouvée - ABC Bédarieux",
    };
  }

  return {
    title: action.metaTitle || `${action.title} - ABC Bédarieux`,
    description: action.metaDescription || action.summary || action.description,
    openGraph: {
      title: action.title,
      description: action.summary || action.description,
      images: action.coverImage ? [action.coverImage] : undefined,
    },
  };
}

export default async function ActionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const action = await getAction(slug);

  if (!action) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/actions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux actions
          </Link>
        </Button>
      </div>

      {/* Header avec image de couverture */}
      {action.coverImage && (
        <div className="relative h-64 md:h-96 mb-8">
          <Image
            src={action.coverImage}
            alt={action.title}
            className="w-full h-full object-cover"
            fill
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="container mx-auto">
              <div className="flex items-center gap-3 mb-2">
                {action.isFeatured && (
                  <Badge className="bg-yellow-500 text-yellow-900 border-yellow-400">
                    <Star className="h-3 w-3 mr-1" />
                    En avant
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {action.title}
              </h1>
              {action.summary && (
                <p className="text-lg text-white/90 max-w-3xl">
                  {action.summary}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header sans image de couverture */}
      {!action.coverImage && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            {action.isFeatured && (
              <Badge className="bg-yellow-500 text-yellow-900 border-yellow-400">
                <Star className="h-3 w-3 mr-1" />
                En avant
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {action.title}
          </h1>
          {action.summary && (
            <p className="text-xl text-muted-foreground max-w-3xl">
              {action.summary}
            </p>
          )}
        </div>
      )}

      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {/* Dates */}
            {(action.startDate || action.endDate) && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Période</h3>
                  </div>
                  <div className="text-muted-foreground">
                    {action.startDate && action.endDate ? (
                      <span>
                        Du {formatDate(action.startDate)} au{" "}
                        {formatDate(action.endDate)}
                      </span>
                    ) : action.startDate ? (
                      <span>À partir du {formatDate(action.startDate)}</span>
                    ) : action.endDate ? (
                      <span>Jusqu&apos;au {formatDate(action.endDate)}</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {action.description && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Description</h3>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contenu détaillé */}
            {action.content && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Détails</h3>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {action.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Galerie */}
            {action.gallery.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Galerie</h3>
                  <GalleryLightbox
                    images={action.gallery}
                    placeName={action.title}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Informations</h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Organisé par
                    </div>
                    <div className="font-medium">Association ABC Bédarieux</div>
                  </div>

                  {action.publishedAt && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Publié le
                      </div>
                      <div className="font-medium">
                        {formatDateTime(action.publishedAt)}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-2">
                      Une question sur cette action ?
                    </div>
                    <Button asChild className="w-full">
                      <Link href="/contact">Nous contacter</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
