import { Metadata } from "next";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getPlaceCategoryAction } from "@/actions/place-category";
import { PlaceCategoryForm } from "../../_components/place-category-form";

export const metadata: Metadata = {
  title: "Modifier la catégorie | Administration",
  description: "Modifier les informations de la catégorie de place",
};

interface EditPlaceCategoryPageProps {
  params: {
    categoryId: string;
  };
}

export default async function EditPlaceCategoryPage({ params }: EditPlaceCategoryPageProps) {
  // Charger la catégorie
  const result = await getPlaceCategoryAction(params.categoryId);

  if (!result.success || !result.data) {
    notFound();
  }

  const category = result.data;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/admin/place-categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Edit className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Modifier "{category.name}"
            </h1>
            <p className="text-muted-foreground">
              Modifiez les informations de cette catégorie
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de la catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <PlaceCategoryForm 
            mode="edit" 
            categoryId={params.categoryId}
            initialData={{
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: category.description || "",
              icon: category.icon || "",
              color: category.color || "#6B7280",
              bgColor: category.bgColor || "bg-gray-100",
              textColor: category.textColor || "text-gray-700",
              borderColor: category.borderColor || "border-gray-200",
              isActive: category.isActive,
              sortOrder: category.sortOrder,
              parentId: category.parentId || null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}