import { Metadata } from "next";
import { ArrowLeft, BarChart3, Award, Users, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { BadgeStatsCharts } from "../_components/badge-stats-charts";
import { BadgeDistributionTable } from "../_components/badge-distribution-table";
import { getBadgeStatsAction } from "@/actions/badge";

export const metadata: Metadata = {
  title: "Statistiques des badges | Administration",
  description: "Statistiques détaillées sur l'utilisation des badges",
};

export default async function BadgeStatsPage() {
  const statsResult = await getBadgeStatsAction();
  
  if (!statsResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/admin/badges">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Statistiques des badges</h1>
            <p className="text-muted-foreground">Impossible de charger les statistiques</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Erreur lors du chargement des statistiques
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = statsResult.data;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/admin/badges">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Statistiques des badges</h1>
            <p className="text-muted-foreground">
              Analyse détaillée de l'utilisation des badges sur la plateforme
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques générales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total des badges */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total badges</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Badges créés sur la plateforme
            </p>
          </CardContent>
        </Card>

        {/* Badges actifs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress 
                value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0} 
                className="flex-1" 
              />
              <span className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total attributions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attributions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalAwarded}</div>
            <p className="text-xs text-muted-foreground">
              Badges attribués aux utilisateurs
            </p>
          </CardContent>
        </Card>

        {/* Moyenne par badge */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne / badge</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.active > 0 ? Math.round(stats.totalAwarded / stats.active * 10) / 10 : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Attributions par badge actif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(stats.categoriesStats).map(([category, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const categoryLabels = {
                ACHIEVEMENT: "Accomplissements",
                COMMUNITY: "Communauté", 
                SPECIAL: "Spéciaux",
                TIME: "Temporels"
              };
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{categoryLabels[category as keyof typeof categoryLabels] || category}</span>
                    <span className="font-medium">{count} badge{count > 1 ? 's' : ''}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {Math.round(percentage)}% du total
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Répartition par rareté */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par rareté</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats.raritiesStats).map(([rarity, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const rarityLabels = {
                COMMON: "Communs",
                UNCOMMON: "Peu communs",
                RARE: "Rares", 
                EPIC: "Épiques",
                LEGENDARY: "Légendaires"
              };
              const rarityColors = {
                COMMON: "#6B7280",
                UNCOMMON: "#10B981",
                RARE: "#3B82F6",
                EPIC: "#8B5CF6", 
                LEGENDARY: "#F59E0B"
              };
              
              return (
                <div key={rarity} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: rarityColors[rarity as keyof typeof rarityColors] }}
                      />
                      <span>{rarityLabels[rarity as keyof typeof rarityLabels] || rarity}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {Math.round(percentage)}% du total
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Graphiques détaillés */}
      <BadgeStatsCharts stats={stats} />

      {/* Table de distribution */}
      <BadgeDistributionTable />
    </div>
  );
}