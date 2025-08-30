import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Star, MapPin } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlaceCategoriesBadges } from "@/components/places/place-categories-badges";
import { FavoriteButton } from "@/components/places/favorite-button";
import { SafeImage } from "@/components/safe-image";

import { prisma } from "@/lib/prisma";
import { PlaceStatus } from "@/lib/generated/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

// Fonction utilitaire pour normaliser les chemins d'images
function normalizeImagePath(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith("/") ? path : `/${path}`;
}

// Générer les métadonnées de la page
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = await prisma.placeCategory.findFirst({
    where: { slug: params.slug, isActive: true },
    select: { name: true, description: true, slug: true },
  });

  if (!category) {
    return {
      title: "Catégorie introuvable",
      robots: { index: false, follow: false },
    };
  }

  const title = `${category.name} - Toutes les places`;
  const description =
    category.description ||
    `Découvrez tous les établissements de la catégorie ${category.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  // Charger la catégorie
  const category = await prisma.placeCategory.findFirst({
    where: { slug: params.slug, isActive: true },
    include: {
      parent: {
        select: { id: true, name: true, slug: true },
      },
      children: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true, icon: true, color: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!category) {
    notFound();
  }

  // Charger les places de cette catégorie (et de ses sous-catégories)
  const categoryIds = [
    category.id,
    ...category.children.map((child) => child.id),
  ];

  const [places, totalPlaces] = await Promise.all([
    prisma.place.findMany({
      where: {
        status: PlaceStatus.ACTIVE,
        isActive: true,
        categories: {
          some: {
            categoryId: {
              in: categoryIds,
            },
          },
        },
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: { reviews: true, favorites: true },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
    }),
    prisma.place.count({
      where: {
        status: PlaceStatus.ACTIVE,
        isActive: true,
        categories: {
          some: {
            categoryId: {
              in: categoryIds,
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalPlaces / limit);

  // Rendu de l'icône de catégorie
  const renderCategoryIcon = (
    icon: string | null,
    size: string = "w-8 h-8"
  ) => {
    if (!icon) return null;

    // Emoji - adapter la taille selon le contexte
    if (
      icon.length <= 4 &&
      /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
        icon
      )
    ) {
      // Pour les petites icônes (badges), utiliser une taille réduite
      const textSize = size.includes("w-3")
        ? "text-xs"
        : size.includes("w-12")
        ? "text-2xl"
        : "text-base";
      return (
        <span className={`${textSize} inline-block text-center leading-none`}>
          {icon}
        </span>
      );
    }

    // Icône Lucide
    const IconComponent = LucideIcons[icon as keyof typeof LucideIcons];
    if (IconComponent && typeof IconComponent === "function") {
      const ValidIconComponent = IconComponent as React.ElementType;
      return (
        <ValidIconComponent
          className={size}
          style={{ color: category.color || undefined }}
        />
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          Accueil
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/categories" className="hover:text-foreground">
          Catégories
        </Link>
        {category.parent && (
          <>
            <ChevronRight className="w-4 h-4" />
            <Link
              href={`/categories/${category.parent.slug}`}
              className="hover:text-foreground"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      {/* En-tête de la catégorie */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {renderCategoryIcon(category.icon, "w-12 h-12")}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-muted-foreground mt-2">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {/* Sous-catégories */}
        {category.children.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-3">Sous-catégories</h2>
            <div className="flex flex-wrap gap-2">
              {category.children.map((child) => (
                <Link key={child.id} href={`/categories/${child.slug}`}>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 px-3 py-1 hover:bg-muted cursor-pointer"
                    style={{
                      borderColor: child.color || undefined,
                      color: child.color || undefined,
                    }}
                  >
                    {renderCategoryIcon(child.icon, "w-3 h-3")}
                    {child.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="mb-6">
        <p className="text-muted-foreground">
          {totalPlaces} établissement{totalPlaces > 1 ? "s" : ""} trouvé
          {totalPlaces > 1 ? "s" : ""}
        </p>
      </div>

      {/* Liste des places */}
      {places.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-xl font-medium text-muted-foreground mb-2">
            Aucun établissement dans cette catégorie
          </h3>
          <p className="text-muted-foreground">
            Soyez le premier à ajouter un établissement dans cette catégorie !
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/places/new">Ajouter un établissement</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((place) => (
            <Card key={place.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {/* Image de couverture */}
                <div className="relative h-48 w-full">
                  <SafeImage
                    src={
                      normalizeImagePath(place.coverImage || place.logo) || ""
                    }
                    alt={`Image de ${place.name}`}
                    fill
                    className="object-cover rounded-t-lg"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    fallbackClassName="w-full h-full bg-gradient-to-br from-muted to-muted/50 rounded-t-lg flex items-center justify-center"
                  />
                  {place.isFeatured && (
                    <Badge
                      className="absolute top-2 left-2"
                      variant="secondary"
                    >
                      À la une
                    </Badge>
                  )}
                  {/* Bouton favori */}
                  <div className="absolute top-2 right-2">
                    <FavoriteButton
                      placeId={place.id}
                      placeName={place.name}
                      variant="outline"
                      size="icon"
                      showText={false}
                      className="bg-white/90 backdrop-blur-sm shadow-sm"
                    />
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <div className="mb-3">
                    <Link href={`/places/${place.slug}`}>
                      <h3 className="text-lg font-semibold text-foreground hover:text-primary line-clamp-1">
                        {place.name}
                      </h3>
                    </Link>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{place.city}</span>
                      <span className="mx-2">•</span>
                      <Badge variant="outline" className="text-xs">
                        {place.type}
                      </Badge>
                    </div>
                  </div>

                  {/* Catégories */}
                  {place.categories && place.categories.length > 0 && (
                    <div className="mb-3">
                      <PlaceCategoriesBadges
                        categories={place.categories}
                        maxDisplay={3}
                        size="sm"
                      />
                    </div>
                  )}

                  {/* Statistiques */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      <span>{place._count.reviews} avis</span>
                    </div>
                    <div className="flex items-center">
                      <span>{place._count.favorites} favoris</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button className="w-full" size="sm" asChild>
                    <Link href={`/places/${place.slug}`}>
                      Voir l&apos;établissement
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/categories/${category.slug}?page=${page - 1}`}>
                Précédent
              </Link>
            </Button>
          )}

          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNumber) => {
                const isCurrentPage = pageNumber === page;
                const isNearCurrentPage = Math.abs(pageNumber - page) <= 2;
                const isFirstOrLast =
                  pageNumber === 1 || pageNumber === totalPages;

                if (!isNearCurrentPage && !isFirstOrLast) {
                  return null;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={isCurrentPage ? "default" : "outline"}
                    size="sm"
                    asChild={!isCurrentPage}
                    disabled={isCurrentPage}
                  >
                    {isCurrentPage ? (
                      pageNumber
                    ) : (
                      <Link
                        href={`/categories/${category.slug}?page=${pageNumber}`}
                      >
                        {pageNumber}
                      </Link>
                    )}
                  </Button>
                );
              }
            )}
          </div>

          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/categories/${category.slug}?page=${page + 1}`}>
                Suivant
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
