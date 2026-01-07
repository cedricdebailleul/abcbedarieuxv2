import { Suspense } from "react";
import { Metadata } from "next";
import { FolderTree, Plus, BarChart3, Settings } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { PlaceCategoriesTable } from "./_components/place-categories-table";
import { PlaceCategoryStatsCards } from "./_components/place-category-stats-cards";
import { PlaceCategoryFilters } from "./_components/place-category-filters";
import { PlaceCategoryHierarchy } from "./_components/place-category-hierarchy";
import { PlaceCategoryImportDialog } from "./_components/place-category-import-dialog";
import { PlaceCategoryExportButton } from "./_components/place-category-export-button";

export const metadata: Metadata = {
  title: "Catégories de places | Administration",
  description: "Gérez les catégories et sous-catégories des places",
};

interface PlaceCategoriesPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    isActive?: string;
    parentId?: string;
    sortBy?: string;
    sortOrder?: string;
    view?: "list" | "hierarchy";
  }>;
}

export default async function PlaceCategoriesPage(props: PlaceCategoriesPageProps) {
  const searchParams = await props.searchParams;

  // Construire les filtres depuis les paramètres de recherche
  const filters = {
    page: Number.parseInt(searchParams.page || "1"),
    limit: Number.parseInt(searchParams.limit || "20"),
    search: searchParams.search || "",
    isActive: searchParams.isActive
      ? searchParams.isActive === "true"
      : undefined,
    parentId: searchParams.parentId || undefined,
    sortBy:
      (searchParams.sortBy as
        | "name"
        | "sortOrder"
        | "createdAt"
        | "placeCount"
        | undefined) || "sortOrder",
    sortOrder: (searchParams.sortOrder as "asc" | "desc" | undefined) || "asc",
  };

  const currentView = searchParams.view || "list";

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Catégories de places
            </h1>
            <p className="text-muted-foreground">
              Organisez et gérez les catégories des lieux et commerces
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <PlaceCategoryExportButton />
          <PlaceCategoryImportDialog />
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/place-categories/stats">
              <BarChart3 className="mr-2 h-4 w-4" />
              Statistiques
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/admin/place-categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle catégorie
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <PlaceCategoryStatsCards />
      </Suspense>

      {/* Sélecteur de vue et filtres */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={currentView === "list" ? "default" : "outline"}
            asChild
          >
            <Link href="?view=list">
              <Settings className="mr-2 h-4 w-4" />
              Vue liste
            </Link>
          </Button>
          <Button
            variant={currentView === "hierarchy" ? "default" : "outline"}
            asChild
          >
            <Link href="?view=hierarchy">
              <FolderTree className="mr-2 h-4 w-4" />
              Vue hiérarchique
            </Link>
          </Button>
        </div>
      </div>

      {currentView === "hierarchy" ? (
        // Vue hiérarchique
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Structure hiérarchique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              }
            >
              <PlaceCategoryHierarchy />
            </Suspense>
          </CardContent>
        </Card>
      ) : (
        // Vue liste avec filtres
        <>
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Filtres et recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlaceCategoryFilters initialFilters={filters} />
            </CardContent>
          </Card>

          {/* Table des catégories */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                }
              >
                <PlaceCategoriesTable filters={filters} />
              </Suspense>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
