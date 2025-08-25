"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { lucideIconToEmoji } from "@/lib/share-utils";

interface PlaceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null | undefined;
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
  clickable = true,
}: PlaceCategoriesBadgesProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const displayCategories = categories.slice(0, maxDisplay);
  const remainingCount = categories.length - maxDisplay;

  const renderCategoryIcon = (icon: string | null) => {
    if (!icon) return null;

    // Si l'icône commence par une majuscule, c'est probablement un nom Lucide
    if (/^[A-Z]/.test(icon)) {
      const emoji = lucideIconToEmoji(icon);
      return <span className="text-xs mr-1">{emoji}</span>;
    }

    // Sinon, c'est déjà un emoji ou un caractère spécial
    return <span className="text-xs mr-1">{icon}</span>;
  };

  const BadgeContent = ({ category }: { category: PlaceCategory }) => (
    <Badge
      variant="secondary"
      className={`
        text-xs px-2 py-0.5 
        ${size === "sm" ? "text-xs" : "text-sm"} 
        flex items-center
        ${
          clickable ? "cursor-pointer" : ""
        }
      `}
      style={{
        backgroundColor: category.color ? `${category.color}15` : undefined,
        borderColor: category.color ? `${category.color}40` : undefined,
        color: category.color || undefined,
      }}
    >
      {renderCategoryIcon(category.icon ?? null)}
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
