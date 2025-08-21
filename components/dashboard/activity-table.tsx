"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { IconTrophy, IconClock } from "@tabler/icons-react";

export function ActivityTable() {
  const { stats, loading, error } = useDashboardStats();

  const recentActivity = useMemo(() => {
    if (!stats) return [];

    // Simuler une activité récente basée sur les stats
    return [
      {
        id: 1,
        type: "Nouveaux utilisateurs",
        count: stats.recentUsers,
        status:
          stats.recentUsers > 10
            ? "success"
            : stats.recentUsers > 5
            ? "warning"
            : "default",
        period: "Ce mois",
        description: `${stats.recentUsers} inscriptions`,
      },
      {
        id: 2,
        type: "Articles publiés",
        count: stats.recentPosts,
        status:
          stats.recentPosts > 20
            ? "success"
            : stats.recentPosts > 10
            ? "warning"
            : "default",
        period: "Ce mois",
        description: `${stats.recentPosts} nouveaux articles`,
      },
      {
        id: 3,
        type: "Commerces actifs",
        count: stats.activePlaces,
        status:
          stats.engagementRate > 70
            ? "success"
            : stats.engagementRate > 50
            ? "warning"
            : "default",
        period: "Actuellement",
        description: `${stats.engagementRate}% d'engagement`,
      },
      {
        id: 4,
        type: "Newsletter",
        count: stats.newsletterSubscribers,
        status: "success",
        period: "Abonnés",
        description: "Actifs et engagés",
      },
      {
        id: 5,
        type: "Réclamations",
        count: stats.pendingClaims,
        status: stats.pendingClaims > 5 ? "warning" : "default",
        period: "En attente",
        description: `${stats.pendingClaims} à traiter`,
      },
      {
        id: 6,
        type: "Activité semaine",
        count: stats.weeklyActivity.total,
        status:
          stats.weeklyActivity.total > 50
            ? "success"
            : stats.weeklyActivity.total > 20
            ? "warning"
            : "default",
        period: "7 derniers jours",
        description: "Toutes contributions",
      },
    ];
  }, [stats]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "🟢";
      case "warning":
        return "🟡";
      default:
        return "⚪";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48"></div>
          <div className="h-4 bg-muted rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-4 animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-40"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">
            Erreur de chargement
          </CardTitle>
          <CardDescription>
            {error || "Impossible de charger les données d'activité"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconClock className="size-5 text-blue-500" />
          Aperçu de l&apos;Activité
        </CardTitle>
        <CardDescription>
          Résumé des principales métriques et activités récentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Nombre</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActivity.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.type}</TableCell>
                <TableCell className="text-center font-mono font-semibold">
                  {activity.count}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {activity.period}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusVariant(activity.status)}
                    className="gap-1"
                  >
                    <span className="text-xs">
                      {getStatusIcon(activity.status)}
                    </span>
                    {activity.status === "success"
                      ? "Excellent"
                      : activity.status === "warning"
                      ? "Attention"
                      : "Normal"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {activity.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Top Contributeurs */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <IconTrophy className="size-5 text-yellow-500" />
            <h4 className="font-semibold">Top Contributeurs ce Mois</h4>
          </div>
          <div className="grid gap-3">
            {stats.topContributors.map((contributor, index) => (
              <div
                key={contributor.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="w-8 h-8 rounded-full flex items-center justify-center p-0"
                  >
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">
                      {contributor.name || "Utilisateur"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {contributor.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{contributor.postsCount}</p>
                  <p className="text-xs text-muted-foreground">articles</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
