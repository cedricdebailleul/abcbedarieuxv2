"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Star, MapPin } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaceCategoriesBadges } from "@/components/places/place-categories-badges";
import { FavoriteButton } from "@/components/places/favorite-button";
import { SafeImage } from "@/components/safe-image";

import { getUserFavoritesAction } from "@/actions/favorite";

interface Place {
  id: string;
  name: string; // Name of the place
  slug: string; // Slug property is required
  type: string;
  status: string;
  city: string;
  street: string;
  coverImage: string | null;
  logo: string | null;
  isFeatured: boolean;
  createdAt: string;
  categories?: {
    category: {
      id: string;
      name: string;
      slug: string;
      icon: string | null;
      color: string | null;
    };
  }[];
  _count: {
    reviews: number;
    favorites: number;
  };
}

interface FavoritesData {
  favorites: Place[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Fonction utilitaire pour normaliser les chemins d'images
function normalizeImagePath(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith("/") ? path : `/${path}`;
}

export default function FavoritesPage() {
  const { data: status } = useSession();
  const [favoritesData, setFavoritesData] = useState<FavoritesData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchFavorites = async (page = 1) => {
    try {
      setLoading(true);
      const result = await getUserFavoritesAction({ page, limit: 12 });

      if (result.success) {
        setFavoritesData({
          ...result.data!,
          favorites: result.data!.favorites.map((favorite) => ({
            ...favorite,
            slug: favorite.slug || "", // Ensure slug is included
            type: favorite.type || "",
            status: favorite.status || "",
            city: favorite.city || "",
            street: favorite.street || "",
            coverImage: favorite.coverImage || null,
            logo: favorite.logo || null,
            isFeatured: favorite.isFeatured || false,
            createdAt:
              favorite.createdAt instanceof Date
                ? favorite.createdAt.toISOString()
                : favorite.createdAt || "",
          })),
        });
      } else {
        toast.error(result.error || "Erreur lors du chargement des favoris");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des favoris");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status && status.user) {
      fetchFavorites(currentPage);
    }
  }, [status, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!status || status.user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!status || !status.user) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Connexion requise
        </h1>
        <p className="text-gray-600 mb-6">
          Vous devez être connecté pour voir vos favoris.
        </p>
        <Button asChild>
          <Link href="/auth/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Favoris</h1>
          <p className="text-gray-600">
            {favoritesData
              ? `${favoritesData.pagination.total} établissement${
                  favoritesData.pagination.total > 1 ? "s" : ""
                } sauvegardé${favoritesData.pagination.total > 1 ? "s" : ""}`
              : "Vos établissements préférés"}
          </p>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !favoritesData || favoritesData.favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Aucun favori
          </h3>
          <p className="text-gray-600 mb-6">
            Vous n&apos;avez pas encore ajouté d&apos;établissement à vos
            favoris.
          </p>
          <p className="text-gray-500 mb-6">
            Parcourez nos établissements et cliquez sur ❤️ pour les sauvegarder
            ici !
          </p>
          <Button asChild>
            <Link href="/categories">Explorer les établissements</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoritesData.favorites.map((place) => (
              <Card
                key={place.id}
                className="hover:shadow-md transition-shadow"
              >
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
                        <Heart className="w-3 h-3 mr-1" />
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

          {/* Pagination */}
          {favoritesData.pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              {currentPage > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Précédent
                </Button>
              )}

              <div className="flex items-center space-x-1">
                {Array.from(
                  { length: favoritesData.pagination.pages },
                  (_, i) => i + 1
                ).map((pageNumber) => {
                  const isCurrentPage = pageNumber === currentPage;
                  const isNearCurrentPage =
                    Math.abs(pageNumber - currentPage) <= 2;
                  const isFirstOrLast =
                    pageNumber === 1 ||
                    pageNumber === favoritesData.pagination.pages;

                  if (!isNearCurrentPage && !isFirstOrLast) {
                    return null;
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={isCurrentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={isCurrentPage}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              {currentPage < favoritesData.pagination.pages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Suivant
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
