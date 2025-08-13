"use client";

import { useEffect, useState } from "react";
import { FolderTree, Eye, EyeOff, Folder } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { getPlaceCategoryStatsAction } from "@/actions/place-category";

export function PlaceCategoryStatsCards() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getPlaceCategoryStatsAction();
        if (result.success) {
          setStats(result.data);
        } else {
          toast.error(result.error || "Erreur lors du chargement des statistiques");
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des statistiques");
      }
      setLoading(false);
    };

    loadStats();
  }, []);

  if (loading) {
    return (
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
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total des catégories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total catégories</CardTitle>
          <FolderTree className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Catégories créées
          </p>
        </CardContent>
      </Card>

      {/* Catégories actives */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Actives</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 
              ? `${Math.round((stats.active / stats.total) * 100)}% du total`
              : "0% du total"
            }
          </p>
        </CardContent>
      </Card>

      {/* Catégories racines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Catégories racines</CardTitle>
          <Folder className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.rootCategories}</div>
          <p className="text-xs text-muted-foreground">
            Catégories principales
          </p>
        </CardContent>
      </Card>

      {/* Sous-catégories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sous-catégories</CardTitle>
          <FolderTree className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.subCategories}</div>
          <p className="text-xs text-muted-foreground">
            Catégories enfants
          </p>
        </CardContent>
      </Card>
    </div>
  );
}