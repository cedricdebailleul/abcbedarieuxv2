import { useEffect, useState } from "react";

interface UserStats {
  // Métriques principales
  totalPlaces: number;
  totalPosts: number;
  totalEvents: number;
  totalFavorites: number;
  totalBadges: number;
  
  // Métriques d'engagement
  totalViews: number;
  totalLikes: number;
  totalPlaceFavorites: number;
  totalEventParticipants: number;
  activityScore: number;
  
  // Données détaillées
  recentPlaces: Array<{
    id: string;
    name: string;
    _count: { reviews: number; favorites: number };
  }>;
  recentPosts: Array<{
    id: string;
    title: string;
    viewCount: number;
    likeCount: number;
    createdAt: string;
  }>;
  recentEvents: Array<{
    id: string;
    title: string;
    participantCount: number;
    startDate: string;
  }>;
  recentBadges: Array<{
    badge: {
      id: string;
      name: string;
      description: string;
      icon: string;
      color: string;
    };
    awardedAt: string;
  }>;
  
  // Croissance
  growth: {
    places: number;
    posts: number;
    events: number;
    views: number;
  };
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/dashboard/user-stats', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des statistiques');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        console.error('Erreur stats utilisateur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const refetch = async () => {
    await fetchStats();
  };

  return {
    stats,
    loading,
    error,
    refetch
  };

  async function fetchStats() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/user-stats', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur stats utilisateur:', err);
    } finally {
      setLoading(false);
    }
  }
}