"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodSelector, type Period } from "@/components/analytics/period-selector";
import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { UserTopTable } from "@/components/analytics/user-top-table";
import { IconEye, IconStar, IconUsers, IconHeart } from "@tabler/icons-react";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "analytics-period";

interface AnalyticsData {
  hasContent: boolean;
  totalViews: number;
  postViews: number;
  placeViews: number;
  eventViews: number;
  favoritesReceived: number;
  reviewsReceived: number;
  participants: number;
  timeSeries: { date: string; count: number }[];
  topPosts: { id: string; name: string; slug: string; views: number }[];
  topPlaces: { id: string; name: string; slug: string; views: number }[];
  topEvents: { id: string; name: string; slug: string; views: number; participants: number }[];
}

export function UserAnalytics() {
  const [period, setPeriod] = useState<Period>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      const VALID_PERIODS: Period[] = ["7d", "30d", "12m"];
      return VALID_PERIODS.includes(stored as Period) ? (stored as Period) : "30d";
    }
    return "30d";
  });
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | undefined>();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom" && customRange) {
        params.set("from", customRange.from);
        params.set("to", customRange.to);
      }
      const res = await fetch(`/api/analytics/user?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [period, customRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePeriodChange = (p: Period, range?: { from: string; to: string }) => {
    setPeriod(p);
    setCustomRange(range);
    if (p !== "custom") localStorage.setItem(STORAGE_KEY, p);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasNoContent = data && !data.hasContent;
  const hasContentButNoViews = data && data.hasContent && data.totalViews === 0;

  if (hasNoContent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <IconEye className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <p className="font-medium">Aucun contenu pour l&apos;instant</p>
          <p className="text-sm text-muted-foreground mt-1">
            Publiez des articles, places ou événements pour voir vos statistiques ici.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/posts/new"><PlusCircle className="h-3.5 w-3.5 mr-1" />Nouvel article</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/places/new"><PlusCircle className="h-3.5 w-3.5 mr-1" />Nouvelle place</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (hasContentButNoViews) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            Vous avez du contenu publié, mais les statistiques de vues commencent à être collectées maintenant.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Revenez dans quelques jours pour voir vos premières statistiques.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mon activité</h2>
        <PeriodSelector value={period} customRange={customRange} onChange={handlePeriodChange} />
      </div>

      {data && (
        <>
          <AnalyticsKpiCards cards={[
            { label: "Vues totales", value: data.totalViews, icon: <IconEye className="h-4 w-4" /> },
            { label: "Favoris reçus", value: data.favoritesReceived, icon: <IconHeart className="h-4 w-4" /> },
            { label: "Avis reçus", value: data.reviewsReceived, icon: <IconStar className="h-4 w-4" /> },
            { label: "Participants events", value: data.participants, icon: <IconUsers className="h-4 w-4" /> },
          ]} />

          {data.timeSeries.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Vues dans le temps</CardTitle></CardHeader>
              <CardContent>
                <AnalyticsChart
                  type="line"
                  series={[{ key: "count", label: "Vues", color: "#6366f1", data: data.timeSeries }]}
                />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {data.topPosts.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Mes articles</CardTitle></CardHeader>
                <CardContent>
                  <UserTopTable items={data.topPosts} hrefPrefix="/posts" />
                  <div className="mt-3">
                    <Link href="/dashboard/posts" className="text-xs text-muted-foreground hover:underline">
                      Voir tous mes articles →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.topPlaces.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Mes places</CardTitle></CardHeader>
                <CardContent>
                  <UserTopTable items={data.topPlaces} hrefPrefix="/places" />
                  <div className="mt-3">
                    <Link href="/dashboard/places" className="text-xs text-muted-foreground hover:underline">
                      Voir toutes mes places →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {data.topEvents.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Mes événements</CardTitle></CardHeader>
              <CardContent>
                <UserTopTable items={data.topEvents} hrefPrefix="/events" showParticipants />
                <div className="mt-3">
                  <Link href="/dashboard/events" className="text-xs text-muted-foreground hover:underline">
                    Voir tous mes événements →
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
