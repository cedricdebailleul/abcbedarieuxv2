import { useState, useEffect } from 'react';

export interface ContentItem {
  id: string;
  type: 'event' | 'place' | 'post';
  title: string;
  slug: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isAllDay?: boolean;
  publishedAt?: string;
  coverImage?: string;
  author?: string;
  category?: {
    name: string;
    color?: string;
    icon?: string;
  } | null;
  phone?: string;
  website?: string;
  logo?: string;
  placeSlug?: string;
  url: string; // URL vers la page du contenu
}

export interface ContentStats {
  eventsCount: number;
  placesCount: number;
  postsCount: number;
  totalSubscribers: number;
}

export interface AvailableContent {
  events: ContentItem[];
  places: ContentItem[];
  posts: ContentItem[];
}

export function useAvailableContent() {
  const [content, setContent] = useState<AvailableContent>({
    events: [],
    places: [],
    posts: []
  });
  const [stats, setStats] = useState<ContentStats>({
    eventsCount: 0,
    placesCount: 0,
    postsCount: 0,
    totalSubscribers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/newsletter/content/available', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setContent(data.content);
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Erreur lors du chargement du contenu');
      }
    } catch (err) {
      console.error('Erreur lors du chargement du contenu:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const refetch = () => {
    fetchContent();
  };

  return {
    content,
    stats,
    loading,
    error,
    refetch
  };
}