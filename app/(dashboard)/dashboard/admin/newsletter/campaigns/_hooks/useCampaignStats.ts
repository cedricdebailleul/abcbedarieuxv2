import { useState, useEffect, useCallback } from 'react';

export interface CampaignStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalUnsubscribed: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  recentOpens: Array<{
    id: string;
    subscriberEmail: string;
    subscriberName?: string;
    openedAt: string;
    userAgent?: string;
  }>;
  opensByTime: Array<{
    hour: string;
    opens: number;
  }>;
}

interface UseCampaignStatsOptions {
  campaignId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useCampaignStats({ 
  campaignId, 
  autoRefresh = false, 
  refreshInterval = 10000 
}: UseCampaignStatsOptions) {
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/newsletter/campaigns/${campaignId}/stats`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchStats();
    }
  }, [campaignId, fetchStats]);

  useEffect(() => {
    if (autoRefresh && campaignId && refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, campaignId, refreshInterval, fetchStats]);

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refetch: fetchStats
  };
}