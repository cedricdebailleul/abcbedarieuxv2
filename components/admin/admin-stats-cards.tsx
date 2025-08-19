import { IconTrendingDown, IconTrendingUp, IconUsers, IconFileText, IconBuilding, IconMail, IconFlag, IconHeart } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AdminStats {
  users: {
    total: number;
    recent: number;
    active: number;
    banned: number;
    growthRate: number;
  };
  content: {
    totalPosts: number;
    totalPlaces: number;
    totalEvents: number;
    publishedPosts: number;
    activePlaces: number;
    upcomingEvents: number;
    contentRatio: number;
  };
  newsletter: {
    subscribers: number;
    campaigns: number;
    conversionRate: number;
  };
  moderation: {
    pendingClaims: number;
    totalClaims: number;
    pendingReviews: number;
    claimsRatio: number;
  };
  engagement: {
    totalReviews: number;
    totalFavorites: number;
    totalBadges: number;
    engagementRate: number;
    reviewsPerUser: number;
  };
}

export function AdminStatsCards() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/stats', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des statistiques admin');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        console.error('Erreur stats admin:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <CardDescription className="h-4 bg-muted rounded"></CardDescription>
              <CardTitle className="h-8 bg-muted rounded w-24"></CardTitle>
            </CardHeader>
            <CardFooter className="h-16 bg-muted/10 rounded"></CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Erreur de chargement</CardDescription>
            <CardTitle className="text-destructive">
              {error || "Impossible de charger les statistiques admin"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getGrowthIndicator = (rate: number) => {
    if (rate > 0) {
      return {
        icon: IconTrendingUp,
        variant: "default" as const,
        text: `+${rate}%`,
        description: "Croissance positive"
      };
    } else if (rate < 0) {
      return {
        icon: IconTrendingDown,
        variant: "destructive" as const,
        text: `${rate}%`,
        description: "En baisse"
      };
    } else {
      return {
        icon: IconTrendingUp,
        variant: "secondary" as const,
        text: "Stable",
        description: "Pas de changement"
      };
    }
  };

  const userGrowth = getGrowthIndicator(stats.users.growthRate);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      
      {/* Utilisateurs Total */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Utilisateurs Inscrits</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
            <IconUsers className="size-6 text-blue-500" />
            {formatNumber(stats.users.total)}
          </CardTitle>
          <CardAction>
            <Badge variant={userGrowth.variant}>
              <userGrowth.icon className="size-3" />
              {userGrowth.text}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.users.recent} nouveaux ce mois <IconUsers className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {stats.users.active} actifs • {stats.users.banned} bannis
          </div>
        </CardFooter>
      </Card>

      {/* Contenu Total */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Contenu Publié</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
            <IconFileText className="size-6 text-green-500" />
            {formatNumber(stats.content.totalPosts + stats.content.totalPlaces + stats.content.totalEvents)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.content.contentRatio}% actif
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.content.publishedPosts} articles • {stats.content.activePlaces} places
          </div>
          <div className="text-muted-foreground">
            {stats.content.upcomingEvents} événements à venir
          </div>
        </CardFooter>
      </Card>

      {/* Places */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Commerces & Lieux</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
            <IconBuilding className="size-6 text-orange-500" />
            {formatNumber(stats.content.totalPlaces)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="size-3" />
              {stats.content.activePlaces} actifs
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.moderation.pendingClaims} réclamations en attente
          </div>
          <div className="text-muted-foreground">
            Répertoire des commerces locaux
          </div>
        </CardFooter>
      </Card>

      {/* Newsletter */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Newsletter</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
            <IconMail className="size-6 text-purple-500" />
            {formatNumber(stats.newsletter.subscribers)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.newsletter.conversionRate}% taux
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.newsletter.campaigns} campagnes envoyées
          </div>
          <div className="text-muted-foreground">
            Communication marketing
          </div>
        </CardFooter>
      </Card>

      {/* Modération */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Modération</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
            <IconFlag className="size-6 text-red-500" />
            {stats.moderation.pendingClaims}
          </CardTitle>
          <CardAction>
            <Badge variant={stats.moderation.pendingClaims > 0 ? "destructive" : "outline"}>
              En attente
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.moderation.totalClaims} réclamations total
          </div>
          <div className="text-muted-foreground">
            {stats.moderation.pendingReviews} reviews récentes
          </div>
        </CardFooter>
      </Card>

      {/* Engagement */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Engagement</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
            <IconHeart className="size-6 text-pink-500" />
            {formatNumber(stats.engagement.totalReviews + stats.engagement.totalFavorites)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.engagement.engagementRate} taux
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.engagement.totalReviews} avis • {stats.engagement.totalFavorites} favoris
          </div>
          <div className="text-muted-foreground">
            {stats.engagement.reviewsPerUser} avis/utilisateur
          </div>
        </CardFooter>
      </Card>

    </div>
  );
}