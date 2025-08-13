"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";

interface PlaceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface PlaceCategoryRelation {
  category: PlaceCategory;
}

interface PlaceCategoriesBadgesProps {
  categories?: PlaceCategoryRelation[];
  maxDisplay?: number;
  size?: "sm" | "default";
  clickable?: boolean;
}

export function PlaceCategoriesBadges({ 
  categories = [], 
  maxDisplay = 3, 
  size = "sm",
  clickable = true
}: PlaceCategoriesBadgesProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const displayCategories = categories.slice(0, maxDisplay);
  const remainingCount = categories.length - maxDisplay;

  const renderCategoryIcon = (icon: string | null) => {
    if (!icon) return null;
    
    // Vérifier si c'est un emoji
    if (icon.length <= 4 && /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon)) {
      return <span className="text-xs mr-1">{icon}</span>;
    }
    
    // Vérifier si c'est une icône Lucide
    const IconComponent = (LucideIcons as any)[icon];
    if (IconComponent) {
      return <IconComponent className="w-3 h-3 mr-1" />;
    }
    
    return null;
  };

  const BadgeContent = ({ category }: { category: PlaceCategory }) => (
    <Badge
      variant="secondary"
      className={`
        text-xs px-2 py-0.5 
        ${size === "sm" ? "text-xs" : "text-sm"} 
        flex items-center
        ${clickable ? 'hover:scale-105 transition-transform cursor-pointer' : ''}
      `}
      style={{
        backgroundColor: category.color ? `${category.color}15` : undefined,
        borderColor: category.color ? `${category.color}40` : undefined,
        color: category.color || undefined,
      }}
    >
      {renderCategoryIcon(category.icon)}
      {category.name}
    </Badge>
  );

  return (
    <div className="flex flex-wrap gap-1">
      {displayCategories.map(({ category }) => {
        if (clickable) {
          return (
            <Link key={category.id} href={`/categories/${category.slug}`}>
              <BadgeContent category={category} />
            </Link>
          );
        } else {
          return <BadgeContent key={category.id} category={category} />;
        }
      })}
      
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className={`
            text-xs px-2 py-0.5 text-muted-foreground
            ${size === "sm" ? "text-xs" : "text-sm"}
          `}
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}