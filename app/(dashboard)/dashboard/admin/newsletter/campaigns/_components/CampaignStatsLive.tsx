"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  MousePointer, 
  Mail, 
  MailX,
  Activity,
  RefreshCw,
  TrendingUp,
  Clock,
  BarChart3
} from "lucide-react";

interface CampaignStatsLiveProps {
  campaignId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

interface StatsData {
  campaign: {
    id: string;
    title: string;
    status: string;
    sentAt: string | null;
  };
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    unsubscribed: number;
    rates: {
      delivery: number;
      open: number;
      click: number;
      failure: number;
    };
  };
  recentActivity: Array<{
    email: string;
    name: string;
    action: 'opened' | 'clicked';
    timestamp: string;
  }>;
}

export function CampaignStatsLive({ 
  campaignId, 
  autoRefresh = true, 
  refreshInterval = 15000,
  className = ""
}: CampaignStatsLiveProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setIsRefreshing(true);
      setError(null);

      const response = await fetch(`/api/admin/newsletter/campaigns/${campaignId}/stats`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setStats(data);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      console.error('Erreur stats:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchStats();
  }, [campaignId, fetchStats]);

  useEffect(() => {
    if (autoRefresh && campaignId && refreshInterval > 0) {
      const interval = setInterval(() => fetchStats(false), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, campaignId, refreshInterval, fetchStats]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'opened': return <Eye className="w-3 h-3 text-blue-500" />;
      case 'clicked': return <MousePointer className="w-3 h-3 text-green-500" />;
      default: return <Activity className="w-3 h-3 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'opened': return 'a ouvert';
      case 'clicked': return 'a cliqué';
      default: return 'action';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 animate-pulse" />
            Chargement des statistiques...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <MailX className="w-5 h-5" />
            Erreur de chargement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec actualisation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Statistiques en temps réel
            </CardTitle>
            <div className="flex items-center gap-2">
              {autoRefresh && (
                <Badge variant="secondary" className="text-xs">
                  <Activity className="w-3 h-3 mr-1" />
                  Auto
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fetchStats(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <strong>{stats.campaign.title}</strong>
            <Badge variant="outline" className="ml-2">
              {stats.campaign.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Envoyés */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Envoyés</p>
                <p className="text-2xl font-bold">{stats.stats.sent}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Ouverts */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ouverts</p>
                <p className="text-2xl font-bold text-green-600">{stats.stats.opened}</p>
                <p className="text-xs text-muted-foreground">{stats.stats.rates.open}%</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
            <Progress 
              value={stats.stats.rates.open} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        {/* Cliqués */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clics</p>
                <p className="text-2xl font-bold text-orange-600">{stats.stats.clicked}</p>
                <p className="text-xs text-muted-foreground">{stats.stats.rates.click}%</p>
              </div>
              <MousePointer className="w-8 h-8 text-orange-500" />
            </div>
            <Progress 
              value={stats.stats.rates.click} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        {/* Échecs */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-red-600">{stats.stats.failed}</p>
                <p className="text-xs text-muted-foreground">{stats.stats.rates.failure}%</p>
              </div>
              <MailX className="w-8 h-8 text-red-500" />
            </div>
            <Progress 
              value={stats.stats.rates.failure} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activité récente
            {stats.recentActivity.length > 0 && (
              <Badge variant="secondary">
                {stats.recentActivity.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {stats.recentActivity.map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      {getActionIcon(activity.action)}
                      <span className="text-sm">
                        <strong>{activity.name}</strong> {getActionLabel(activity.action)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatTime(activity.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucune activité récente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résumé des performances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance de la campagne
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Taux de livraison:</span>
              <span className="font-medium ml-2">{stats.stats.rates.delivery}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Taux d&apos;ouverture:</span>
              <span className="font-medium ml-2">{stats.stats.rates.open}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Taux de clic:</span>
              <span className="font-medium ml-2">{stats.stats.rates.click}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Taux d&apos;échec:</span>
              <span className="font-medium ml-2">{stats.stats.rates.failure}%</span>
            </div>
          </div>

          {/* Indicateur de performance globale */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Performance globale</span>
              <Badge 
                variant={stats.stats.rates.open >= 20 ? "default" : stats.stats.rates.open >= 10 ? "secondary" : "destructive"}
              >
                {stats.stats.rates.open >= 20 ? "Excellente" : stats.stats.rates.open >= 10 ? "Bonne" : "À améliorer"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.stats.rates.open >= 20 
                ? "Votre campagne performe très bien ! Taux d'ouverture supérieur à la moyenne."
                : stats.stats.rates.open >= 10
                ? "Performance correcte. Vous pouvez optimiser le sujet et l'heure d'envoi."
                : "Performance faible. Vérifiez vos listes et améliorez vos sujets d'emails."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}