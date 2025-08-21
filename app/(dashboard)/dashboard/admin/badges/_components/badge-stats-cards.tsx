"use client";

import { useEffect, useState } from "react";
import { Award, Eye, EyeOff, Users } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { getBadgeStatsAction } from "@/actions/badge";
import { BadgeStats } from "@/lib/types/badge";

export function BadgeStatsCards() {
  const [stats, setStats] = useState<BadgeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getBadgeStatsAction();
        if (result.success) {
          setStats(result.data || null);
        } else {
          toast.error(
            result.error || "Erreur lors du chargement des statistiques"
          );
        }
      } catch {
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
      {/* Total des badges */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total badges</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Badges disponibles</p>
        </CardContent>
      </Card>

      {/* Badges actifs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Actifs</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.active}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0
              ? `${Math.round((stats.active / stats.total) * 100)}% du total`
              : "0% du total"}
          </p>
        </CardContent>
      </Card>

      {/* Badges inactifs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.inactive}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0
              ? `${Math.round((stats.inactive / stats.total) * 100)}% du total`
              : "0% du total"}
          </p>
        </CardContent>
      </Card>

      {/* Total des attributions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Attributions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalAwarded}
          </div>
          <p className="text-xs text-muted-foreground">Badges attribués</p>
        </CardContent>
      </Card>
    </div>
  );
}
