import { useState, useEffect } from 'react';

export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalPlaces: number;
  totalEvents: number;
  recentUsers: number;
  recentPosts: number;
  growthRate: number;
  newsletterSubscribers: number;
  activePlaces: number;
  engagementRate: number;
  pendingClaims: number;
  weeklyActivity: {
    posts: number;
    events: number;
    places: number;
    users: number;
    total: number;
  };
  monthlyUsers: Array<{
    month: string;
    count: number;
  }>;
  topContributors: Array<{
    id: string;
    name: string | null;
    email: string;
    postsCount: number;
  }>;
  lastUpdated: string;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/stats');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Vous devez être connecté pour voir les statistiques');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur lors de la récupération des stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Rafraîchir les stats toutes les 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}