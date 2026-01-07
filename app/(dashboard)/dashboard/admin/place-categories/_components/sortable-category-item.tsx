"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  GripVertical,
  Plus,
} from "lucide-react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Re-using the Category interface from the parent or defining a shared one would be better
// But for now duplicating the interface to avoid circular deps or complex exports
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  color: string | null;
  icon: string | null;
  children?: Category[];
}

interface SortableCategoryItemProps {
  category: Category;
  level: number;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children?: React.ReactNode; // For nested SortableCategoryList
}

export function SortableCategoryItem({
  category,
  level,
  isOpen,
  onToggle,
  children,
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = category.children && category.children.length > 0;
  const indentClass = level > 0 ? `ml-${level * 6}` : "";

  // Rendu de l'icône de catégorie
  const renderCategoryIcon = (icon: string | null, color: string | null) => {
    if (!icon) return null;

    // Vérifier si c'est un emoji
    if (
      icon.length <= 4 &&
      /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
        icon
      )
    ) {
      return <span className="text-lg">{icon}</span>;
    }

    // Vérifier si c'est une icône Lucide
    const IconComponent = (
      LucideIcons as unknown as Record<string, React.FC<{ className?: string }>>
    )[icon];
    if (IconComponent) {
      return (
        <span style={{ color: color || undefined }}>
          <IconComponent className="w-5 h-5" />
        </span>
      );
    }

    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("space-y-1 mb-1", isDragging && "relative")}
    >
      <Collapsible
        open={isOpen}
        onOpenChange={() => hasChildren && onToggle(category.id)}
      >
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
            indentClass
          )}
        >
          {/* Handle de drag */}
          <div {...attributes} {...listeners} className="cursor-grab touch-none">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

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
                <span>{category.children?.length || 0} sous-catégorie(s)</span>
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
              <Link
                href={`/dashboard/admin/place-categories/${category.id}/edit`}
              >
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link
                href={`/dashboard/admin/place-categories/new?parentId=${category.id}`}
              >
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Sous-catégories */}
        {hasChildren && (
          <CollapsibleContent className="space-y-1">
             <div className="ml-6 border-l-2 border-muted pl-4 space-y-1 pt-1">
              {children}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}
