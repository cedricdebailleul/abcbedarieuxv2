"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";

interface FiltersState {
  search: string;
  type: string;
  isActive: string;
  sortBy: string;
  sortOrder: string;
}

interface PartnersFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  stats?: Record<string, number>;
}

const partnerTypeOptions = [
  { value: "all", label: "Tous les types" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INSTITUTIONAL", label: "Institutionnel" },
  { value: "MEDIA", label: "Média" },
  { value: "TECHNICAL", label: "Technique" },
  { value: "SPONSOR", label: "Sponsor" },
  { value: "SUPPLIER", label: "Fournisseur" },
  { value: "OTHER", label: "Autre" },
];

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "true", label: "Actif" },
  { value: "false", label: "Inactif" },
];

const sortOptions = [
  { value: "createdAt", label: "Date de création" },
  { value: "name", label: "Nom" },
  { value: "priority", label: "Priorité" },
  { value: "updatedAt", label: "Dernière modification" },
];

export function PartnersFilters({
  filters,
  onFiltersChange,
  stats = {},
}: PartnersFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchInput });
  };

  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    const defaultFilters: FiltersState = {
      search: "",
      type: "all",
      isActive: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    setSearchInput("");
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.search || 
    filters.type !== "all" || 
    filters.isActive !== "all";

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un partenaire..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.type}
          onValueChange={(value) => handleFilterChange("type", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {partnerTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.label}
                  {option.value !== "all" && stats[option.value] && (
                    <Badge variant="secondary" className="ml-auto">
                      {stats[option.value]}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.isActive}
          onValueChange={(value) => handleFilterChange("isActive", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sortBy}
          onValueChange={(value) => handleFilterChange("sortBy", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sortOrder}
          onValueChange={(value) => handleFilterChange("sortOrder", value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ordre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Croissant</SelectItem>
            <SelectItem value="desc">Décroissant</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Effacer
          </Button>
        )}
      </div>

      {/* Indicateurs de filtres actifs */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary">
              <Search className="h-3 w-3 mr-1" />
              Recherche: {filters.search}
            </Badge>
          )}
          {filters.type !== "all" && (
            <Badge variant="secondary">
              <Filter className="h-3 w-3 mr-1" />
              Type: {partnerTypeOptions.find(o => o.value === filters.type)?.label}
            </Badge>
          )}
          {filters.isActive !== "all" && (
            <Badge variant="secondary">
              <Filter className="h-3 w-3 mr-1" />
              Statut: {statusOptions.find(o => o.value === filters.isActive)?.label}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}