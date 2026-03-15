"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodSelector, type Period } from "@/components/analytics/period-selector";
import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { AnalyticsTopTable } from "@/components/analytics/analytics-top-table";
import {
  IconEye,
  IconUsers,
  IconBuilding,
  IconCalendar,
  IconArticle,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";

const STORAGE_KEY = "admin-analytics-period";

export default function AdminAnalyticsPage() {
  const [tab, setTab] = useState("global");
  const [period, setPeriod] = useState<Period>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(STORAGE_KEY) as Period) || "30d";
    }
    return "30d";
  });
  const [customRange, setCustomRange] = useState<
    { from: string; to: string } | undefined
  >();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab, period });
      if (period === "custom" && customRange) {
        params.set("from", customRange.from);
        params.set("to", customRange.to);
      }
      const res = await fetch(`/api/analytics/admin?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tab, period, customRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodChange = (
    p: Period,
    range?: { from: string; to: string }
  ) => {
    setPeriod(p);
    setCustomRange(range);
    if (p !== "custom") localStorage.setItem(STORAGE_KEY, p);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Statistiques globales de la plateforme
          </p>
        </div>
        <PeriodSelector
          value={period}
          customRange={customRange}
          onChange={handlePeriodChange}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="global" className="gap-1.5">
            <IconEye className="h-4 w-4" /> Global
          </TabsTrigger>
          <TabsTrigger value="posts" className="gap-1.5">
            <IconArticle className="h-4 w-4" /> Articles
          </TabsTrigger>
          <TabsTrigger value="places" className="gap-1.5">
            <IconBuilding className="h-4 w-4" /> Places
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5">
            <IconCalendar className="h-4 w-4" /> Événements
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <IconUsers className="h-4 w-4" /> Utilisateurs
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="global" className="space-y-6 mt-6">
              {data && (
                <>
                  <AnalyticsKpiCards
                    cards={[
                      {
                        label: "Vues totales",
                        value: (data.totalViews as number) ?? 0,
                        growth: data.growth as number,
                        icon: <IconEye className="h-4 w-4" />,
                      },
                      {
                        label: "Visiteurs uniques",
                        value: (data.uniqueViewers as number) ?? 0,
                      },
                      {
                        label: "Nouveaux inscrits",
                        value: (data.newUsers as number) ?? 0,
                      },
                    ]}
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Vues dans le temps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsChart
                        type="line"
                        series={[
                          {
                            key: "posts",
                            label: "Articles",
                            color: "#6366f1",
                            data:
                              (
                                data.series as Record<
                                  string,
                                  { date: string; count: number }[]
                                >
                              )?.posts ?? [],
                          },
                          {
                            key: "places",
                            label: "Places",
                            color: "#10b981",
                            data:
                              (
                                data.series as Record<
                                  string,
                                  { date: string; count: number }[]
                                >
                              )?.places ?? [],
                          },
                          {
                            key: "events",
                            label: "Événements",
                            color: "#f59e0b",
                            data:
                              (
                                data.series as Record<
                                  string,
                                  { date: string; count: number }[]
                                >
                              )?.events ?? [],
                          },
                        ]}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-6 mt-6">
              {data && (
                <>
                  <AnalyticsKpiCards
                    cards={[
                      {
                        label: "Vues articles",
                        value: (data.totalViews as number) ?? 0,
                      },
                      {
                        label: "Visiteurs uniques",
                        value: (data.uniqueViewers as number) ?? 0,
                      },
                    ]}
                  />
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Vues dans le temps
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AnalyticsChart
                          type="bar"
                          series={[
                            {
                              key: "count",
                              label: "Articles",
                              color: "#6366f1",
                              data:
                                (data.timeSeries as {
                                  date: string;
                                  count: number;
                                }[]) ?? [],
                            },
                          ]}
                        />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Top articles</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AnalyticsTopTable
                          items={
                            (data.topItems as {
                              id: string;
                              name: string;
                              slug: string;
                              views: number;
                            }[]) ?? []
                          }
                          hrefPrefix="/posts"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="places" className="space-y-6 mt-6">
              {data && (
                <>
                  <AnalyticsKpiCards
                    cards={[
                      {
                        label: "Vues places",
                        value: (data.totalViews as number) ?? 0,
                      },
                      {
                        label: "Visiteurs uniques",
                        value: (data.uniqueViewers as number) ?? 0,
                      },
                    ]}
                  />
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Vues dans le temps
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AnalyticsChart
                          type="bar"
                          series={[
                            {
                              key: "count",
                              label: "Places",
                              color: "#10b981",
                              data:
                                (data.timeSeries as {
                                  date: string;
                                  count: number;
                                }[]) ?? [],
                            },
                          ]}
                        />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Top places</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AnalyticsTopTable
                          items={
                            (data.topItems as {
                              id: string;
                              name: string;
                              slug: string;
                              views: number;
                            }[]) ?? []
                          }
                          hrefPrefix="/places"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="events" className="space-y-6 mt-6">
              {data && (
                <>
                  <AnalyticsKpiCards
                    cards={[
                      {
                        label: "Vues événements",
                        value: (data.totalViews as number) ?? 0,
                      },
                      {
                        label: "Visiteurs uniques",
                        value: (data.uniqueViewers as number) ?? 0,
                      },
                    ]}
                  />
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Vues dans le temps
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AnalyticsChart
                          type="bar"
                          series={[
                            {
                              key: "count",
                              label: "Événements",
                              color: "#f59e0b",
                              data:
                                (data.timeSeries as {
                                  date: string;
                                  count: number;
                                }[]) ?? [],
                            },
                          ]}
                        />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Top événements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AnalyticsTopTable
                          items={
                            (data.topItems as {
                              id: string;
                              name: string;
                              slug: string;
                              views: number;
                              participants?: number;
                            }[]) ?? []
                          }
                          hrefPrefix="/events"
                          showParticipants
                        />
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-6 mt-6">
              {data && (
                <>
                  <AnalyticsKpiCards
                    cards={[
                      {
                        label: "Total utilisateurs",
                        value: (data.totalUsers as number) ?? 0,
                      },
                      {
                        label: "Nouveaux inscrits",
                        value: (data.newUsers as number) ?? 0,
                        growth: data.growth as number,
                      },
                    ]}
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Inscriptions dans le temps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsChart
                        type="bar"
                        series={[
                          {
                            key: "count",
                            label: "Inscriptions",
                            color: "#8b5cf6",
                            data:
                              (data.timeSeries as {
                                date: string;
                                count: number;
                              }[]) ?? [],
                          },
                        ]}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
