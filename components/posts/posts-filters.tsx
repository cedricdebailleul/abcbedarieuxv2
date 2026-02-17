"use client";

import {
  Filter,
  Folder,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag as TagIcon,
  X,
  Loader2} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { getCategoriesAction, getTagsAction } from "@/actions/post";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PostStatus } from "@/lib/generated/prisma/browser";

interface PostsFiltersProps {
  searchParams: {
    search?: string;
    status?: string;
    categoryId?: string;
    tagId?: string;
    published?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export function PostsFilters({ searchParams }: PostsFiltersProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // États locaux pour les filtres
  const [search, setSearch] = useState(searchParams.search || "");
  const [status, setStatus] = useState(searchParams.status || "all");
  const [categoryId, setCategoryId] = useState(searchParams.categoryId || "all");
  const [tagId, setTagId] = useState(searchParams.tagId || "all");
  const [published, setPublished] = useState(searchParams.published || "all");
  const [sortBy, setSortBy] = useState(searchParams.sortBy || "createdAt");
  const [sortOrder, setSortOrder] = useState(searchParams.sortOrder || "desc");

  // Données pour les sélecteurs
  interface Category {
    id: string;
    name: string;
    color?: string;
    _count: {
      posts: number;
    };
  }

  const [categories, setCategories] = useState<Category[]>([]);
  interface Tag {
    id: string;
    name: string;
    color?: string;
    _count: {
      posts: number;
    };
  }

  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Charger les données pour les filtres
  useEffect(() => {
    async function loadFilterData() {
      setIsLoadingData(true);
      try {
        const [categoriesResult, tagsResult] = await Promise.all([
          getCategoriesAction(),
          getTagsAction(),
        ]);

        if (categoriesResult.success && categoriesResult.data) {
          setCategories(
            categoriesResult.data.map((category) => ({
              ...category,
              color: category.color ?? undefined,
            }))
          );
        }

        if (tagsResult.success && tagsResult.data) {
          setTags(
            tagsResult.data.map((tag) => ({
              ...tag,
              color: tag.color ?? undefined,
            }))
          );
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données de filtrage:", error);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadFilterData();
  }, []);

  // Déterminer si des filtres avancés sont actifs
  useEffect(() => {
    const hasAdvancedFilters =
      (status && status !== "all") ||
      (categoryId && categoryId !== "all") ||
      (tagId && tagId !== "all") ||
      (published && published !== "all") ||
      sortBy !== "createdAt" ||
      sortOrder !== "desc";
    setShowAdvancedFilters(hasAdvancedFilters);
  }, [status, categoryId, tagId, published, sortBy, sortOrder]);

  // Fonction pour mettre à jour l'URL
  const updateFilters = useCallback(
    (newFilters: Record<string, string>) => {
      startTransition(() => {
        const params = new URLSearchParams(currentSearchParams);

        // Supprimer les paramètres vides ou avec valeurs par défaut
        Object.keys(newFilters).forEach((key) => {
          const value = newFilters[key];
          // Traiter "all" et "none" comme des valeurs vides
          if (value && value !== "all" && value !== "none") {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        });

        // Toujours revenir à la page 1 lors d'un changement de filtre
        params.delete("page");

        const queryString = params.toString();
        const newUrl = queryString ? `?${queryString}` : "";

        router.push(`/dashboard/posts${newUrl}`);
      });
    },
    [currentSearchParams, router]
  );

  // Appliquer les filtres
  const handleApplyFilters = () => {
    updateFilters({
      search,
      status,
      categoryId,
      tagId,
      published,
      sortBy,
      sortOrder,
    });
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSearch("");
    setStatus("all");
    setCategoryId("all");
    setTagId("all");
    setPublished("all");
    setSortBy("createdAt");
    setSortOrder("desc");

    startTransition(() => {
      router.push("/dashboard/posts");
    });
  };

  // Recherche en temps réel (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      updateFilters({
        search,
        status,
        categoryId,
        tagId,
        published,
        sortBy,
        sortOrder,
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, status, categoryId, tagId, published, sortBy, sortOrder, updateFilters]); // Seulement pour la recherche

  // Compter les filtres actifs
  const activeFiltersCount = [
    status && status !== "all" ? status : null,
    categoryId && categoryId !== "all" ? categoryId : null,
    tagId && tagId !== "all" ? tagId : null,
    published && published !== "all" ? published : null,
  ].filter(Boolean).length;
  const hasActiveFilters =
    activeFiltersCount > 0 || search || sortBy !== "createdAt" || sortOrder !== "desc";

  // Options pour les sélecteurs
  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: PostStatus.DRAFT, label: "Brouillons" },
    { value: PostStatus.PUBLISHED, label: "Publiés" },
    { value: PostStatus.PENDING_REVIEW, label: "En attente" },
    { value: PostStatus.ARCHIVED, label: "Archivés" },
    { value: PostStatus.REJECTED, label: "Rejetés" },
  ];

  const publishedOptions = [
    { value: "all", label: "Tous" },
    { value: "true", label: "Publiés" },
    { value: "false", label: "Non publiés" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date de création" },
    { value: "updatedAt", label: "Dernière modification" },
    { value: "publishedAt", label: "Date de publication" },
    { value: "title", label: "Titre" },
    { value: "viewCount", label: "Nombre de vues" },
  ];

  const sortOrderOptions = [
    { value: "desc", label: "Décroissant" },
    { value: "asc", label: "Croissant" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="secondary">
                {activeFiltersCount > 0 &&
                  `${activeFiltersCount} filtre${activeFiltersCount > 1 ? "s" : ""}`}
                {search && (activeFiltersCount > 0 ? " + recherche" : "recherche")}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {showAdvancedFilters ? "Masquer" : "Afficher"} les options
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recherche principale */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les titres, contenus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearch("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <div className="space-y-4 border-t pt-4">
            {/* Première ligne - Statut et Publication */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Publication</Label>
                <Select value={published} onValueChange={setPublished}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut de publication" />
                  </SelectTrigger>
                  <SelectContent>
                    {publishedOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Deuxième ligne - Catégorie et Tag */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Catégorie
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={isLoadingData}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={isLoadingData ? "Chargement..." : "Toutes les catégories"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || "#6B7280" }}
                          />
                          {category.name}
                          <Badge variant="outline" className="text-xs">
                            {category._count.posts}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Tag
                </Label>
                <Select value={tagId} onValueChange={setTagId} disabled={isLoadingData}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingData ? "Chargement..." : "Tous les tags"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les tags</SelectItem>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color || "#8B5CF6" }}
                          />
                          {tag.name}
                          <Badge variant="outline" className="text-xs">
                            {tag._count.posts}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Troisième ligne - Tri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trier par</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ordre</Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOrderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                disabled={isPending}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>

              <Button
                onClick={handleApplyFilters}
                disabled={isPending}
                className="flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Application...
                  </>
                ) : (
                  <>
                    <Filter className="h-4 w-4" />
                    Appliquer
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Filtres actifs (tags) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                Recherche: &quot;{search}&quot;
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setSearch("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {status && status !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Statut: {statusOptions.find((s) => s.value === status)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setStatus("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {published && published !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {publishedOptions.find((p) => p.value === published)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setPublished("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {categoryId && categoryId !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {categories.find((c) => c.id === categoryId)?.name || "Catégorie"}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setCategoryId("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {tagId && tagId !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <TagIcon className="h-3 w-3" />
                {tags.find((t) => t.id === tagId)?.name || "Tag"}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setTagId("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
