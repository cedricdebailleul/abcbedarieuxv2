"use client";

import { useState } from "react";
import { Search, Clock, X, ChevronDown, ChevronRight, Building, MapPin, PanelLeftClose, PanelLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MapFilters as IMapFilters, MapCategory } from "./interactive-map";
import { DISTANCE_OPTIONS } from "@/lib/map-utils";
import { lucideIconToEmoji } from "@/lib/share-utils";

// Calculer le nombre total de places pour une catégorie (incluant les sous-catégories)
function getTotalPlacesCount(category: MapCategory): number {
  let total = category._count.places;
  if (category.children) {
    category.children.forEach(child => {
      total += child._count.places;
    });
  }
  return total;
}

interface MapFiltersProps {
  filters: IMapFilters;
  onFiltersChange: (filters: IMapFilters) => void;
  categories: MapCategory[];
  placesCount: number;
  totalPlaces: number;
  userLocation: { lat: number; lng: number } | null;
}

export function MapFilters({
  filters,
  onFiltersChange,
  categories,
  placesCount,
  totalPlaces,
  userLocation
}: MapFiltersProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isCompact, setIsCompact] = useState(false);

  const updateFilters = (updates: Partial<IMapFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    
    updateFilters({ categories: newCategories });
  };

  const toggleExpandCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const clearAllFilters = () => {
    updateFilters({
      search: '',
      categories: [],
      distance: null,
      showOpenOnly: false,
      showAssociations: false
    });
  };

  const hasActiveFilters = filters.search || filters.categories.length > 0 || filters.distance || filters.showOpenOnly || filters.showAssociations;

  // Compact mode: only icons with tooltips
  if (isCompact) {
    return (
      <div className="h-full flex flex-col w-16 bg-background border-r">
        {/* Toggle button */}
        <div className="p-2 border-b flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCompact(false)}
                className="h-8 w-8 p-0"
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Étendre les filtres</TooltipContent>
          </Tooltip>
        </div>

        {/* Compact filters */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {/* Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={filters.search ? "secondary" : "ghost"}
                size="sm"
                className="h-10 w-10 p-0 mx-auto flex"
                onClick={() => setIsCompact(false)}
              >
                <Search className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Rechercher</TooltipContent>
          </Tooltip>

          {/* Open now */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={filters.showOpenOnly ? "secondary" : "ghost"}
                size="sm"
                className="h-10 w-10 p-0 mx-auto flex"
                onClick={() => updateFilters({ showOpenOnly: !filters.showOpenOnly })}
              >
                <Clock className={`w-4 h-4 ${filters.showOpenOnly ? "text-emerald-600" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Ouvert maintenant</TooltipContent>
          </Tooltip>

          {/* Associations */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={filters.showAssociations ? "secondary" : "ghost"}
                size="sm"
                className="h-10 w-10 p-0 mx-auto flex"
                onClick={() => updateFilters({ showAssociations: !filters.showAssociations })}
              >
                <Building className={`w-4 h-4 ${filters.showAssociations ? "text-blue-600" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Associations</TooltipContent>
          </Tooltip>

          <Separator className="my-2" />

          {/* Categories - icons only */}
          <div className="space-y-1">
            {categories.map((category) => {
              const isSelected = filters.categories.includes(category.id);
              const iconDisplay = category.icon
                ? lucideIconToEmoji(category.icon)
                : "📁";

              return (
                <Tooltip key={category.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isSelected ? "secondary" : "ghost"}
                      size="sm"
                      className="h-10 w-10 p-0 mx-auto flex text-lg"
                      onClick={() => toggleCategory(category.id)}
                    >
                      {iconDisplay}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    <span>{category.name}</span>
                    <Badge variant="outline" className="text-xs">{getTotalPlacesCount(category)}</Badge>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Active filters count */}
        {hasActiveFilters && (
          <div className="p-2 border-t flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={clearAllFilters}
                >
                  <X className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Effacer les filtres</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filtres</h2>
          <div className="flex items-center gap-1">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Effacer
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCompact(true)}
                  className="h-8 w-8 p-0"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mode compact</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          {placesCount} / {totalPlaces} établissements
        </div>

        {/* Recherche */}
        <div className="space-y-2">
          <Label htmlFor="search">Rechercher</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nom, catégorie, adresse..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Tri */}
          <div className="space-y-2">
            <Label>Trier par</Label>
            <Select value={filters.sortBy} onValueChange={(value: "featured" | "name" | "distance") => updateFilters({ sortBy: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">À la une</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
                {userLocation && <SelectItem value="distance">Distance</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Distance */}
          {userLocation && (
            <div className="space-y-2">
              <Label>Distance maximum</Label>
              <Select 
                value={filters.distance?.toString() || "all"} 
                onValueChange={(value) => updateFilters({ distance: value === "all" ? null : parseFloat(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes distances" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes distances</SelectItem>
                  {DISTANCE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!userLocation && (
                <p className="text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Activez la géolocalisation pour filtrer par distance
                </p>
              )}
            </div>
          )}

          {/* Ouvert maintenant */}
          <div className="flex items-center space-x-2">
            <Switch
              id="open-only"
              checked={filters.showOpenOnly}
              onCheckedChange={(checked) => updateFilters({ showOpenOnly: checked })}
            />
            <Label htmlFor="open-only" className="flex items-center cursor-pointer">
              <Clock className="w-4 h-4 mr-2 text-emerald-600" />
              Ouvert maintenant
            </Label>
          </div>

          {/* Afficher les associations */}
          <div className="flex items-center space-x-2">
            <Switch
              id="show-associations"
              checked={filters.showAssociations}
              onCheckedChange={(checked) => updateFilters({ showAssociations: checked })}
            />
            <Label htmlFor="show-associations" className="flex items-center cursor-pointer">
              <Building className="w-4 h-4 mr-2 text-blue-600" />
              Afficher les associations
            </Label>
          </div>

          <Separator />

          {/* Catégories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Catégories</Label>
              {filters.categories.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.categories.length}
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              {categories.map((category) => {
                const isSelected = filters.categories.includes(category.id);
                const hasChildren = category.children.length > 0;
                const isExpanded = expandedCategories.has(category.id);
                const selectedChildren = category.children.filter(child => 
                  filters.categories.includes(child.id)
                ).length;

                return (
                  <div key={category.id} className="space-y-1">
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleCategory(category.id)}
                        className="flex-shrink-0"
                      />
                      
                      <div
                        className="flex items-center flex-1 min-w-0 cursor-pointer"
                        onClick={() => toggleCategory(category.id)}
                      >
                        {category.icon && (
                          <span className="mr-2 text-lg flex-shrink-0 w-6 text-center leading-none">
                            {lucideIconToEmoji(category.icon)}
                          </span>
                        )}
                        <span className="cursor-pointer flex-1 truncate text-sm">
                          {category.name}
                        </span>
                      </div>
                        
                      <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                        <Badge variant="outline" className="text-xs tabular-nums">
                          {getTotalPlacesCount(category)}
                        </Badge>

                        {hasChildren && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandCategory(category.id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Sous-catégories */}
                    {hasChildren && isExpanded && (
                      <div className="ml-6 space-y-1 border-l border-muted pl-4">
                        {category.children.map((child) => {
                          const isChildSelected = filters.categories.includes(child.id);
                          
                          return (
                            <div
                              key={child.id}
                              className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 transition-colors overflow-hidden"
                            >
                              <Checkbox
                                id={`category-${child.id}`}
                                checked={isChildSelected}
                                onCheckedChange={() => toggleCategory(child.id)}
                                className="flex-shrink-0"
                              />
                              
                              <div
                                className="flex items-center flex-1 min-w-0 cursor-pointer"
                                onClick={() => toggleCategory(child.id)}
                              >
                                {child.icon && (
                                  <span className="mr-2 text-sm flex-shrink-0 w-5 text-center leading-none">
                                    {lucideIconToEmoji(child.icon)}
                                  </span>
                                )}
                                <span className="cursor-pointer text-sm flex-1 truncate">
                                  {child.name}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs flex-shrink-0 tabular-nums">
                                {child._count.places}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {hasChildren && selectedChildren > 0 && !isExpanded && (
                      <div className="ml-8 text-xs text-muted-foreground">
                        {selectedChildren} sous-catégorie{selectedChildren > 1 ? 's' : ''} sélectionnée{selectedChildren > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}