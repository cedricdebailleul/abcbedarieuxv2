"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableCategoryItem, Category } from "./sortable-category-item";

interface SortableCategoryListProps {
  categories: Category[];
  level: number;
  openItems: Set<string>;
  onToggle: (id: string) => void;
}

export function SortableCategoryList({
  categories,
  level,
  openItems,
  onToggle,
}: SortableCategoryListProps) {
  return (
    <SortableContext
      items={categories.map((cat) => cat.id)}
      strategy={verticalListSortingStrategy}
    >
      {categories.map((category) => (
        <SortableCategoryItem
          key={category.id}
          category={category}
          level={level}
          isOpen={openItems.has(category.id)}
          onToggle={onToggle}
        >
          {category.children && category.children.length > 0 && (
            <SortableCategoryList
              categories={category.children}
              level={level + 1}
              openItems={openItems}
              onToggle={onToggle}
            />
          )}
        </SortableCategoryItem>
      ))}
    </SortableContext>
  );
}
