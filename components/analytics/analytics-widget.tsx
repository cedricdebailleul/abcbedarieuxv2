"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconEye, IconUsers } from "@tabler/icons-react";
import { TrendingUp, ArrowRight } from "lucide-react";

interface WidgetData {
  totalViews: number;
  newUsers: number;
  growth: number;
}

export function AnalyticsWidget() {
  const [data, setData] = useState<WidgetData | null>(null);

  useEffect(() => {
    fetch("/api/analytics/admin?tab=global&period=7d")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Analytics — 7 derniers jours
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/dashboard/admin/analytics"
            className="flex items-center gap-1 text-xs"
          >
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {data ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <IconEye className="h-4 w-4 text-indigo-500 shrink-0" />
              <div>
                <p className="text-lg font-bold">
                  {data.totalViews.toLocaleString("fr-FR")}
                </p>
                <p className="text-xs text-muted-foreground">Vues totales</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconUsers className="h-4 w-4 text-purple-500 shrink-0" />
              <div>
                <p className="text-lg font-bold">
                  {data.newUsers.toLocaleString("fr-FR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Nouveaux inscrits
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp
                className={`h-4 w-4 shrink-0 ${data.growth >= 0 ? "text-green-500" : "text-red-500"}`}
              />
              <div>
                <p className="text-lg font-bold">
                  {data.growth > 0 ? "+" : ""}
                  {data.growth}%
                </p>
                <p className="text-xs text-muted-foreground">Croissance</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-12 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
