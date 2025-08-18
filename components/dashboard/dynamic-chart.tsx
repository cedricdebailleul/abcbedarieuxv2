"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { IconUsers, IconTrendingUp, IconActivity } from "@tabler/icons-react";

export function DynamicChart() {
  const { stats, loading, error } = useDashboardStats();

  const chartData = useMemo(() => {
    if (!stats) return [];
    
    return stats.monthlyUsers.map(item => ({
      month: item.month,
      utilisateurs: item.count,
      croissance: item.count > 0 ? Math.round(((item.count - (stats.monthlyUsers[0]?.count || 0)) / (stats.monthlyUsers[0]?.count || 1)) * 100) : 0
    }));
  }, [stats]);

  const activityData = useMemo(() => {
    if (!stats) return [];
    
    return [
      { name: 'Articles', value: stats.weeklyActivity.posts, color: '#22c55e' },
      { name: 'Événements', value: stats.weeklyActivity.events, color: '#3b82f6' },
      { name: 'Commerces', value: stats.weeklyActivity.places, color: '#f59e0b' },
      { name: 'Utilisateurs', value: stats.weeklyActivity.users, color: '#8b5cf6' }
    ];
  }, [stats]);

  if (loading) {
    return (
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="animate-pulse">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="animate-pulse">
            <div className="h-6 bg-muted rounded w-48"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Erreur de chargement</CardTitle>
          <CardDescription>
            {error || "Impossible de charger les graphiques"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Graphique d'évolution des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUsers className="size-5 text-blue-500" />
            Évolution des Utilisateurs
          </CardTitle>
          <CardDescription>
            Nouveaux utilisateurs sur les 6 derniers mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-muted-foreground text-sm"
              />
              <YAxis className="text-muted-foreground text-sm" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="utilisateurs"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#userGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <IconTrendingUp className="size-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Croissance: {stats.growthRate}%
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {stats.totalUsers}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphique d'activité de la semaine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconActivity className="size-5 text-green-500" />
            Activité de la Semaine
          </CardTitle>
          <CardDescription>
            Nouvelles contributions des 7 derniers jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-muted-foreground text-sm"
              />
              <YAxis className="text-muted-foreground text-sm" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <IconActivity className="size-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Total cette semaine: {stats.weeklyActivity.total}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Activité régulière
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}