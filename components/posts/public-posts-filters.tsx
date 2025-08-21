"use client";

import { Filter, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PublicPostsFiltersProps {
  categories: Array<{
    id: string;
    name: string;
    color?: string | null;
    _count: { posts: number };
  }>;
  tags: Array<{
    id: string;
    name: string;
    color?: string | null;
    _count: { posts: number };
  }>;
}

export function PublicPostsFilters({
  categories,
  tags,
}: PublicPostsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // État local pour les filtres
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") || ""
  );
  const [tagId, setTagId] = useState(searchParams.get("tagId") || "");
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "publishedAt"
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sortOrder") || "desc"
  );

  // Fonction pour créer l'URL avec les paramètres
  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== "" && value !== "all") {
          newSearchParams.set(key, value);
        } else {
          newSearchParams.delete(key);
        }
      });

      // Toujours remettre à la page 1 lors d'un changement de filtre
      newSearchParams.delete("page");

      return newSearchParams.toString();
    },
    [searchParams]
  );

  // Appliquer les filtres
  const applyFilters = useCallback(() => {
    const queryString = createQueryString({
      search,
      categoryId,
      tagId,
      sortBy,
      sortOrder,
    });

    router.push(`/articles${queryString ? `?${queryString}` : ""}`);
  }, [search, categoryId, tagId, sortBy, sortOrder, createQueryString, router]);

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearch("");
    setCategoryId("");
    setTagId("");
    setSortBy("publishedAt");
    setSortOrder("desc");
    router.push("/articles");
  };

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters =
    search ||
    categoryId ||
    tagId ||
    sortBy !== "publishedAt" ||
    sortOrder !== "desc";

  // Appliquer automatiquement les filtres de tri
  useEffect(() => {
    if (
      sortBy !== (searchParams.get("sortBy") || "publishedAt") ||
      sortOrder !== (searchParams.get("sortOrder") || "desc")
    ) {
      applyFilters();
    }
  }, [sortBy, sortOrder, searchParams, applyFilters]);

  return (
    <Card>
      <CardContent className="px-6">
        <div className="space-y-3">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="size-4" />
              <h3 className="font-semibold">Filtres</h3>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="size-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Recherche */}
          <div className="space-y-3">
            <Label htmlFor="search">Recherche</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Rechercher dans les articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && applyFilters()}
                  className="pl-10"
                />
              </div>
              <Button onClick={applyFilters}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filtres par catégorie et tag */}
          <div className="grid grid-cols-1 space-y-3">
            {/* Catégories */}
            <div className="space-y-3 w-full">
              <Label>Catégorie</Label>
              <Select value={categoryId || "all"} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: category.color || "#6B7280",
                          }}
                        />
                        <span>{category.name}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {category._count.posts}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label>Tag</Label>
              <Select value={tagId || "all"} onValueChange={setTagId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les tags</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color || "#6B7280" }}
                        />
                        <span>{tag.name}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {tag._count.posts}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tri */}
          <div className="grid grid-cols-1 space-y-3">
            <div className="space-y-3">
              <Label>Trier par</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publishedAt">
                    Date de publication
                  </SelectItem>
                  <SelectItem value="createdAt">Date de création</SelectItem>
                  <SelectItem value="title">Titre</SelectItem>
                  <SelectItem value="viewCount">Nombre de vues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Ordre</Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Décroissant</SelectItem>
                  <SelectItem value="asc">Croissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtres actifs */}
          {hasActiveFilters && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">
                Filtres actifs
              </Label>
              <div className="flex flex-wrap gap-2">
                {search && (
                  <Badge variant="secondary" className="text-xs">
                    Recherche: &quot;{search}&quot;
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => setSearch("")}
                    />
                  </Badge>
                )}
                {categoryId && (
                  <Badge variant="secondary" className="text-xs">
                    Catégorie:{" "}
                    {categories.find((c) => c.id === categoryId)?.name}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => setCategoryId("")}
                    />
                  </Badge>
                )}
                {tagId && (
                  <Badge variant="secondary" className="text-xs">
                    Tag: {tags.find((t) => t.id === tagId)?.name}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => setTagId("")}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Bouton d'application */}
          <Button onClick={applyFilters} className="w-full">
            Appliquer les filtres
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
