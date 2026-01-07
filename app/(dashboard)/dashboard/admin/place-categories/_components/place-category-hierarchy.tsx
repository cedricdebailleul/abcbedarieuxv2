"use client";

import { useEffect, useState } from "react";
import {
  Plus,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { getPlaceCategoriesHierarchyAction, reorderPlaceCategoriesAction } from "@/actions/place-category";
import { SortableCategoryList } from "./sortable-category-list";
import { SortableCategoryItem, Category } from "./sortable-category-item";

export function PlaceCategoryHierarchy() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        const result = await getPlaceCategoriesHierarchyAction();
        if (result.success) {
            // Function to recursively map data to match Category interface if needed
            // Assuming the action returns structure compatible with our interface
            // But we need to ensure recursive children mapping is correct
             const mapCategories = (cats: any[]): Category[] => {
                return cats.map(cat => ({
                    ...cat,
                    children: cat.children ? mapCategories(cat.children) : []
                }));
             };

          const mappedCategories = mapCategories(result.data!);
          setCategories(mappedCategories);
          
          // Ouvrir automatiquement les catégories qui ont des enfants
          const itemsWithChildren: string[] = [];
          const findItemsWithChildren = (cats: Category[]) => {
            for (const cat of cats) {
                if (cat.children && cat.children.length > 0) {
                    itemsWithChildren.push(cat.id);
                    findItemsWithChildren(cat.children);
                }
            }
          };
          findItemsWithChildren(mappedCategories);
          setOpenItems(new Set(itemsWithChildren));
        } else {
          toast.error(result.error || "Erreur lors du chargement");
        }
      } catch {
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
  
  // Helper to find a category by ID (recursive)
    const findCategory = (id: string, cats: Category[]): Category | undefined => {
        for (const cat of cats) {
            if (cat.id === id) return cat;
            if (cat.children) {
                const found = findCategory(id, cat.children);
                if (found) return found;
            }
        }
        return undefined;
    };

    // Helper to find the LIST containing a specific item ID
    const findContainerList = (id: string, cats: Category[]): Category[] | undefined => {
        // Build a flat map of parent -> children relationship?
        // Or just search recursively
        
        // Check top level
        if (cats.some(c => c.id === id)) return cats;

        for (const cat of cats) {
            if (cat.children) {
                const found = findContainerList(id, cat.children);
                if (found) return found;
            }
        }
        return undefined;
    };


  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
    if (active.id === over.id) return;

    // Find which list the active item belongs to
    const activeList = findContainerList(String(active.id), categories);
    // Find which list the over item belongs to
    const overList = findContainerList(String(over.id), categories);

    // We only support sorting within the same list (siblings)
    if (!activeList || !overList || activeList !== overList) {
        // If they are different lists, we don't support moving between parents yet as per plan
        return;
    }

    // Indices
    const oldIndex = activeList.findIndex((c) => c.id === active.id);
    const newIndex = activeList.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
       // Optimistic update
       const newOrder = arrayMove(activeList, oldIndex, newIndex);
        
       // We need to update the state deeply
       // Recursive function to update the specific list in the state tree
       const updateStateRecursively = (cats: Category[]): Category[] => {
            // If this is the list we modified
            if (cats === activeList) {
                return newOrder;
            }
            // Otherwise check children of each
            return cats.map(cat => ({
                ...cat,
                children: cat.children ? updateStateRecursively(cat.children) : []
            }));
       };

       const newState = updateStateRecursively(categories);
       setCategories(newState);

       // Call Server Action
       // Get the IDs in the new order
       const orderedIds = newOrder.map(c => c.id);
       try {
           const result = await reorderPlaceCategoriesAction(orderedIds);
           if (!result.success) {
             toast.error("Erreur lors de la sauvegarde de l'ordre");
             // Revert state if needed? (Not implementing complex revert logic for now)
           }
       } catch (err) {
           toast.error("Erreur de connexion");
       }
    }
  };
  
  const activeCategory = activeId ? findCategory(activeId, categories) : null;

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
              onClick={() => {
                  const allIds: string[] = [];
                  const collectIds = (cats: Category[]) => {
                      cats.forEach(c => {
                          allIds.push(c.id);
                          if(c.children) collectIds(c.children);
                      });
                  };
                  collectIds(categories);
                  setOpenItems(new Set(allIds));
              }}
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
           <SortableCategoryList 
                categories={categories} 
                level={0} 
                openItems={openItems} 
                onToggle={toggleItem} 
           />
        </div>
      </div>
      
       {/* Overlay pour le drag */}
      {createPortal(
        <DragOverlay>
            {activeCategory ? (
                 <SortableCategoryItem 
                    category={activeCategory} 
                    level={0} // Indent doesn't matter much in overlay
                    isOpen={false} // Collapsed while dragging is usually cleaner
                    onToggle={() => {}} 
                 />
            ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

