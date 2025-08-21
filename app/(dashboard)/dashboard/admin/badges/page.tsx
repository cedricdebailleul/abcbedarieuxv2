import { Suspense } from "react";
import { Metadata } from "next";
import { Badge, Plus, Award, BarChart3 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { BadgesTable } from "./_components/badges-table";
import { BadgeStatsCards } from "./_components/badge-stats-cards";
import { BadgeFilters } from "./_components/badge-filters";

export const metadata: Metadata = {
  title: "Gestion des badges | Administration",
  description: "Gérez les badges de la plateforme",
};

interface BadgesPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    category?: string;
    rarity?: string;
    isActive?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export default function BadgesPage({ searchParams }: BadgesPageProps) {
  // Construire les filtres depuis les paramètres de recherche
  const filters = {
    page: Number.parseInt(searchParams.page || "1"),
    limit: Number.parseInt(searchParams.limit || "10"),
    search: searchParams.search || "",
    category: searchParams.category?.toUpperCase() as
      | "GENERAL"
      | "ACHIEVEMENT"
      | "PARTICIPATION"
      | "SPECIAL"
      | "ANNIVERSARY"
      | undefined,
    rarity: searchParams.rarity?.toUpperCase() as
      | "COMMON"
      | "RARE"
      | "EPIC"
      | "LEGENDARY"
      | undefined,
    isActive: searchParams.isActive
      ? searchParams.isActive === "true"
      : undefined,
    sortBy:
      (searchParams.sortBy as
        | "createdAt"
        | "title"
        | "category"
        | "rarity"
        | undefined) || "createdAt",
    sortOrder: (searchParams.sortOrder as "asc" | "desc" | undefined) || "desc",
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Gestion des badges
            </h1>
            <p className="text-muted-foreground">
              Créez, modifiez et gérez les badges de récompense
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/badges/stats">
              <BarChart3 className="mr-2 h-4 w-4" />
              Statistiques
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/admin/badges/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau badge
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
        <BadgeStatsCards />
      </Suspense>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="h-4 w-4" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeFilters initialFilters={filters} />
        </CardContent>
      </Card>

      {/* Table des badges */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des badges</CardTitle>
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
            <BadgesTable filters={filters} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
