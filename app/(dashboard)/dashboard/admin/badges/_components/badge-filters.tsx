"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";

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

import { 
  CATEGORY_LABELS, 
  RARITY_LABELS,
  type BadgeFilters 
} from "@/lib/validations/badge";
import { BadgeCategory, BadgeRarity } from "@/lib/generated/prisma";

interface BadgeFiltersProps {
  initialFilters: BadgeFilters;
}

export function BadgeFilters({ initialFilters }: BadgeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    search: initialFilters.search || "",
    category: initialFilters.category || "all",
    rarity: initialFilters.rarity || "all",
    isActive: initialFilters.isActive?.toString() || "all",
    sortBy: initialFilters.sortBy || "createdAt",
    sortOrder: initialFilters.sortOrder || "desc",
  });

  // Appliquer les filtres
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set("search", filters.search);
    if (filters.category && filters.category !== "all") params.set("category", filters.category);
    if (filters.rarity && filters.rarity !== "all") params.set("rarity", filters.rarity);
    if (filters.isActive && filters.isActive !== "all") params.set("isActive", filters.isActive);
    if (filters.sortBy !== "createdAt") params.set("sortBy", filters.sortBy);
    if (filters.sortOrder !== "desc") params.set("sortOrder", filters.sortOrder);
    
    // Réinitialiser la page à 1
    params.set("page", "1");
    
    router.push(`?${params.toString()}`);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      search: "",
      category: "all",
      rarity: "all",
      isActive: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    router.push("/dashboard/admin/badges");
  };

  // Compter les filtres actifs
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "sortBy" && value === "createdAt") return false;
    if (key === "sortOrder" && value === "desc") return false;
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
              placeholder="Titre ou description..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Catégorie */}
        <div>
          <Label htmlFor="category">Catégorie</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rareté */}
        <div>
          <Label htmlFor="rarity">Rareté</Label>
          <Select
            value={filters.rarity}
            onValueChange={(value) => setFilters(prev => ({ ...prev, rarity: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les raretés</SelectItem>
              {Object.entries(RARITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statut */}
        <div>
          <Label htmlFor="status">Statut</Label>
          <Select
            value={filters.isActive}
            onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="true">Actifs</SelectItem>
              <SelectItem value="false">Inactifs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tri */}
        <div>
          <Label htmlFor="sortBy">Trier par</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date de création</SelectItem>
              <SelectItem value="title">Titre</SelectItem>
              <SelectItem value="category">Catégorie</SelectItem>
              <SelectItem value="rarity">Rareté</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ordre */}
        <div>
          <Label htmlFor="sortOrder">Ordre</Label>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value }))}
          >
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
    </div>
  );
}