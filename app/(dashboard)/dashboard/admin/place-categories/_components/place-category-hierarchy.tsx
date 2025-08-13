"use client";

import { useEffect, useState } from "react";
import { Edit, Eye, Plus, ChevronRight, ChevronDown, GripVertical } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { getPlaceCategoriesHierarchyAction } from "@/actions/place-category";
import { cn } from "@/lib/utils";

export function PlaceCategoryHierarchy() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        const result = await getPlaceCategoriesHierarchyAction();
        if (result.success) {
          setCategories(result.data!);
          // Ouvrir automatiquement les catégories qui ont des enfants
          const itemsWithChildren = result.data!
            .filter((cat: any) => cat.children?.length > 0)
            .map((cat: any) => cat.id);
          setOpenItems(new Set(itemsWithChildren));
        } else {
          toast.error(result.error || "Erreur lors du chargement");
        }
      } catch (error) {
        toast.error("Erreur lors du chargement de la hiérarchie");
      }
      setLoading(false);
    };

    loadHierarchy();
  }, []);

  // Toggle l'ouverture/fermeture d'un item
  const toggleItem = (categoryId: string) => {
    const newOpenItems = new Set(openItems);
    if (openItems.has(categoryId)) {
      newOpenItems.delete(categoryId);
    } else {
      newOpenItems.add(categoryId);
    }
    setOpenItems(newOpenItems);
  };

  // Rendu de l'icône de catégorie
  const renderCategoryIcon = (icon: string | null, color: string | null) => {
    if (!icon) return null;
    
    // Vérifier si c'est un emoji
    if (icon.length <= 4 && /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon)) {
      return <span className="text-lg">{icon}</span>;
    }
    
    // Vérifier si c'est une icône Lucide
    const IconComponent = (LucideIcons as any)[icon];
    if (IconComponent) {
      return <IconComponent className="w-5 h-5" style={{ color: color || undefined }} />;
    }
    
    return null;
  };

  // Rendu d'une catégorie avec ses enfants
  const renderCategory = (category: any, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isOpen = openItems.has(category.id);
    const indentClass = level > 0 ? `ml-${level * 6}` : "";

    return (
      <div key={category.id} className="space-y-1">
        {/* Catégorie principale */}
        <Collapsible open={isOpen} onOpenChange={() => hasChildren && toggleItem(category.id)}>
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
            indentClass
          )}>
            {/* Handle de drag (pour futur drag & drop) */}
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
            
            {/* Icône expand/collapse */}
            {hasChildren ? (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            ) : (
              <div className="w-6" />
            )}

            {/* Icône de la catégorie */}
            <div className="flex-shrink-0">
              {renderCategoryIcon(category.icon, category.color)}
            </div>

            {/* Informations de la catégorie */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">{category.name}</h3>
                {!category.isActive && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {category.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span>Ordre: {category.sortOrder}</span>
                {hasChildren && (
                  <span>{category.children.length} sous-catégorie(s)</span>
                )}
              </div>
            </div>

            {/* Badge de couleur */}
            <div
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: category.color || "#6B7280",
                borderColor: category.color || "#6B7280",
              }}
            />

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/admin/place-categories/${category.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/admin/place-categories/${category.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/admin/place-categories/new?parentId=${category.id}`}>
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Sous-catégories */}
          {hasChildren && (
            <CollapsibleContent className="space-y-1">
              <div className="ml-6 border-l-2 border-muted pl-4 space-y-1">
                {category.children.map((child: any) => renderCategory(child, level + 1))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Aucune catégorie trouvée</p>
        <Button asChild>
          <Link href="/dashboard/admin/place-categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Créer la première catégorie
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* En-tête avec actions globales */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {categories.length} catégorie(s) principale(s)
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenItems(new Set(categories.map(cat => cat.id)))}
          >
            Tout développer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenItems(new Set())}
          >
            Tout réduire
          </Button>
        </div>
      </div>

      {/* Liste hiérarchique */}
      <div className="space-y-2">
        {categories.map((category) => renderCategory(category))}
      </div>
    </div>
  );
}