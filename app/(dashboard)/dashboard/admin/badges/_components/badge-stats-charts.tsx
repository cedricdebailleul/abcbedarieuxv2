"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BadgeStatsChartsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    totalAwarded: number;
    categoriesStats: Record<string, number>;
    raritiesStats: Record<string, number>;
  };
}

export function BadgeStatsCharts({ stats }: BadgeStatsChartsProps) {
  const rarityLabels = {
    COMMON: "Communs",
    UNCOMMON: "Peu communs",
    RARE: "Rares",
    EPIC: "Épiques",
    LEGENDARY: "Légendaires",
  };

  const rarityColors = {
    COMMON: "#6B7280",
    UNCOMMON: "#10B981",
    RARE: "#3B82F6",
    EPIC: "#8B5CF6",
    LEGENDARY: "#F59E0B",
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Vue d'ensemble */}
      <Card>
        <CardHeader>
          <CardTitle>Vue d&apos;ensemble</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total créés:</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actifs:</span>
                <span className="font-medium text-green-600">
                  {stats.active}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inactifs:</span>
                <span className="font-medium text-orange-600">
                  {stats.inactive}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attribués:</span>
                <span className="font-medium text-blue-600">
                  {stats.totalAwarded}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Taux d&apos;utilisation:
                </span>
                <span className="font-medium">
                  {stats.total > 0
                    ? Math.round((stats.active / stats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Moy. / badge:</span>
                <span className="font-medium">
                  {stats.active > 0
                    ? Math.round((stats.totalAwarded / stats.active) * 10) / 10
                    : 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Répartition visuelle */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par rareté</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.raritiesStats)
              .sort(([, a], [, b]) => b - a) // Trier par count décroissant
              .map(([rarity, count]) => {
                const percentage =
                  stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={rarity} className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor:
                          rarityColors[rarity as keyof typeof rarityColors],
                        color:
                          rarityColors[rarity as keyof typeof rarityColors],
                        minWidth: "100px",
                      }}
                    >
                      {rarityLabels[rarity as keyof typeof rarityLabels] ||
                        rarity}
                    </Badge>
                    <div className="flex-1 flex items-center gap-2">
                      <div
                        className="h-2 bg-current opacity-20 rounded-full"
                        style={{
                          width: `${Math.max(percentage, 5)}%`,
                          backgroundColor:
                            rarityColors[rarity as keyof typeof rarityColors],
                        }}
                      />
                      <span className="text-sm font-medium min-w-0">
                        {count} ({Math.round(percentage)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
