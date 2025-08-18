"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { IconEye, IconTrendingUp, IconTrendingDown, IconUsers, IconExternalLink } from "@tabler/icons-react";

interface ViewsData {
  totalViews: number;
  periodViews: number;
  uniqueViewers: number;
  growthRate: number;
  topPosts: Array<{
    id: string;
    title: string;
    slug: string;
    totalViews: number;
    periodViews: number;
    author: {
      name: string;
      email: string;
    };
  }>;
  viewsOverTime: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
  }>;
  topReferrers: Array<{
    domain: string;
    count: number;
  }>;
  period: string;
  startDate: string;
  endDate: string;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export function ViewsAnalytics() {
  const [data, setData] = useState<ViewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('7d');

  const fetchData = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/dashboard/views?period=${selectedPeriod}`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? IconTrendingUp : IconTrendingDown;
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? "text-green-500" : "text-red-500";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-8 bg-muted rounded w-20"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="h-64 bg-muted rounded animate-pulse"></CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Erreur de chargement</CardTitle>
          <CardDescription>{error || "Impossible de charger les statistiques de vues"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const GrowthIcon = getGrowthIcon(data.growthRate);

  return (
    <div className="space-y-6">
      {/* Header avec sélecteur de période */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Analytique des Vues</h2>
          <p className="text-muted-foreground">Statistiques détaillées du trafic des articles</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24h</SelectItem>
            <SelectItem value="7d">7 jours</SelectItem>
            <SelectItem value="30d">30 jours</SelectItem>
            <SelectItem value="90d">90 jours</SelectItem>
            <SelectItem value="1y">1 an</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Vues Totales</CardDescription>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <IconEye className="size-6 text-blue-500" />
              {formatNumber(data.periodViews)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GrowthIcon className={`size-4 ${getGrowthColor(data.growthRate)}`} />
              <span className={`text-sm font-medium ${getGrowthColor(data.growthRate)}`}>
                {data.growthRate > 0 ? '+' : ''}{data.growthRate}%
              </span>
              <span className="text-sm text-muted-foreground">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Visiteurs Uniques</CardDescription>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <IconUsers className="size-6 text-green-500" />
              {formatNumber(data.uniqueViewers)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreforeground">
              Taux de pages/visiteur: {data.uniqueViewers > 0 ? (data.periodViews / data.uniqueViewers).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Historique</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {formatNumber(data.totalViews)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Toutes les vues depuis le lancement
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution temporelle */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Vues</CardTitle>
          <CardDescription>Vues et visiteurs uniques dans le temps</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.viewsOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-muted-foreground text-sm"
                tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              />
              <YAxis className="text-muted-foreground text-sm" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Vues"
              />
              <Line
                type="monotone"
                dataKey="uniqueVisitors"
                stroke="#22c55e"
                strokeWidth={2}
                name="Visiteurs uniques"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Top articles */}
        <Card>
          <CardHeader>
            <CardTitle>Articles les Plus Vus</CardTitle>
            <CardDescription>Classement pour la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPosts.map((post, index) => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                      {index + 1}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{post.title}</p>
                      <p className="text-sm text-muted-foreground">par {post.author.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{post.periodViews}</p>
                    <p className="text-xs text-muted-foreground">{post.totalViews} total</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sources de trafic */}
        <Card>
          <CardHeader>
            <CardTitle>Sources de Trafic</CardTitle>
            <CardDescription>Principaux referrers</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topReferrers.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.topReferrers.slice(0, 7)}
                    dataKey="count"
                    nameKey="domain"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    {data.topReferrers.slice(0, 7).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <IconExternalLink className="size-12 mx-auto mb-2" />
                  <p>Aucune source de trafic externe</p>
                  <p className="text-sm">Le trafic provient principalement du site</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}