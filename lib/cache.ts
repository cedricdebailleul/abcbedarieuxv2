// Simple cache en mémoire pour les statistiques
class StatsCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000) { // 5 minutes par défaut
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Vérifier si l'item a expiré
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Nettoyage automatique des items expirés
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Statistiques du cache
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instance globale du cache
export const statsCache = new StatsCache();

// Nettoyage automatique toutes les 10 minutes
if (typeof window === 'undefined') { // Côté serveur seulement
  setInterval(() => {
    statsCache.cleanup();
  }, 10 * 60 * 1000);
}

// Fonctions utilitaires pour les clés de cache
export const getCacheKey = {
  dashboardStats: () => 'dashboard:stats',
  viewsStats: (period: string) => `views:stats:${period}`,
  userStats: (userId: string) => `user:stats:${userId}`,
  adminStats: () => 'admin:stats',
  postViews: (postId: string) => `post:views:${postId}`,
  monthlyData: (year: number, month: number) => `monthly:${year}:${month}`,
};

// Wrapper pour les requêtes avec cache
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000
): Promise<T> {
  // Essayer de récupérer du cache d'abord
  const cached = statsCache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Sinon, exécuter la requête et mettre en cache
  const data = await fetcher();
  statsCache.set(key, data, ttlMs);
  
  return data;
}