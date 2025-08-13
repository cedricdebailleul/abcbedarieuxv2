import { Metadata } from "next";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PlaceCategoryForm } from "../_components/place-category-form";

export const metadata: Metadata = {
  title: "Nouvelle catégorie de place | Administration",
  description: "Créer une nouvelle catégorie pour organiser les places",
};

interface NewPlaceCategoryPageProps {
  searchParams: {
    parentId?: string;
  };
}

export default function NewPlaceCategoryPage({ searchParams }: NewPlaceCategoryPageProps) {
  const parentId = searchParams.parentId;

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
          <Plus className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {parentId ? "Nouvelle sous-catégorie" : "Nouvelle catégorie"}
            </h1>
            <p className="text-muted-foreground">
              {parentId 
                ? "Créez une sous-catégorie pour mieux organiser vos places"
                : "Créez une nouvelle catégorie pour organiser vos places"
              }
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
            mode="create" 
            initialData={parentId ? { parentId } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}