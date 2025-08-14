"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, X, FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { type PlaceCategoryFilters } from "@/lib/validations/place-category";
import { getPlaceCategoriesAction } from "@/actions/place-category";

interface PlaceCategoryFiltersComponentProps {
  initialFilters: PlaceCategoryFilters;
}

export function PlaceCategoryFilters({
  initialFilters,
}: PlaceCategoryFiltersComponentProps) {
  const router = useRouter();

  const [filters, setFilters] = useState({
    search: initialFilters.search || "",
    isActive: initialFilters.isActive?.toString() || "all",
    parentId: initialFilters.parentId || "all",
    sortBy: initialFilters.sortBy || "sortOrder",
    sortOrder: initialFilters.sortOrder || "asc",
  });

  const [parentCategories, setParentCategories] = useState<any[]>([]);

  // Charger les catégories parent pour le filtre
  useEffect(() => {
    const loadParentCategories = async () => {
      try {
        const result = await getPlaceCategoriesAction({
          page: 1,
          limit: 100,
          parentId: null, // Seulement les catégories racines
          sortBy: "name",
          sortOrder: "asc",
        });

        if (result.success) {
          setParentCategories(result.data!.categories);
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des catégories parent:",
          error
        );
      }
    };

    loadParentCategories();
  }, []);

  // Appliquer les filtres
  const applyFilters = () => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.isActive && filters.isActive !== "all")
      params.set("isActive", filters.isActive);
    if (filters.parentId && filters.parentId !== "all")
      params.set("parentId", filters.parentId);
    if (filters.sortBy !== "sortOrder") params.set("sortBy", filters.sortBy);
    if (filters.sortOrder !== "asc") params.set("sortOrder", filters.sortOrder);

    // Réinitialiser la page à 1
    params.set("page", "1");

    router.push(`?${params.toString()}`);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      search: "",
      isActive: "all",
      parentId: "all",
      sortBy: "sortOrder",
      sortOrder: "asc",
    });
    router.push("/dashboard/admin/place-categories");
  };

  // Compter les filtres actifs
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "sortBy" && value === "sortOrder") return false;
    if (key === "sortOrder" && value === "asc") return false;
    if (value === "" || value === "all") return false;
    return true;
  }).length;

  return (
    <div className="space-y-4">
      {/* Première ligne - Recherche et boutons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Rechercher</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nom ou description..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <Button onClick={applyFilters} className="h-10">
            <Filter className="mr-2 h-4 w-4" />
            Filtrer
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button onClick={resetFilters} variant="outline" className="h-10">
              <X className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Deuxième ligne - Filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Statut */}
        <div>
          <Label htmlFor="status">Statut</Label>
          <Select
            value={filters.isActive}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, isActive: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="true">Actives</SelectItem>
              <SelectItem value="false">Inactives</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Catégorie parent */}
        <div>
          <Label htmlFor="parent">Catégorie parent</Label>
          <Select
            value={filters.parentId}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, parentId: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="null">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Catégories racines
                </div>
              </SelectItem>
              {parentCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tri */}
        <div>
          <Label htmlFor="sortBy">Trier par</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(
              value: "name" | "sortOrder" | "createdAt" | "placeCount"
            ) => setFilters((prev) => ({ ...prev, sortBy: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sortOrder">Ordre personnalisé</SelectItem>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="createdAt">Date de création</SelectItem>
              <SelectItem value="placeCount">Nombre de places</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ordre */}
        <div>
          <Label htmlFor="sortOrder">Ordre</Label>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                sortOrder: value as "asc" | "desc",
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Croissant</SelectItem>
              <SelectItem value="desc">Décroissant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
