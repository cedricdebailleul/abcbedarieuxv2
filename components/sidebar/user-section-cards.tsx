import { IconTrendingDown, IconTrendingUp, IconMapPin, IconFileText, IconCalendar, IconHeart, IconAward, IconEye } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStats } from "@/hooks/use-user-stats";

export function UserSectionCards() {
  const { stats, loading, error } = useUserStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
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
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="col-span-full">
          <CardHeader>
            <CardDescription>Erreur de chargement</CardDescription>
            <CardTitle className="text-destructive">
              {error || "Impossible de charger vos statistiques"}
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
        description: "En croissance"
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
        text: "Nouveau",
        description: "Premiers pas"
      };
    }
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      
      {/* Mes Places */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Mes Places</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconMapPin className="size-6 text-blue-500" />
            {formatNumber(stats.totalPlaces)}
          </CardTitle>
          <CardAction>
            {stats.growth.places > 0 ? (
              <Badge variant="default">
                <IconTrendingUp className="size-3" />
                +{stats.growth.places}%
              </Badge>
            ) : (
              <Badge variant="secondary">
                Nouveau
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.totalPlaceFavorites} favoris total <IconHeart className="size-4" />
          </div>
          <div className="text-muted-foreground">Places que vous gérez</div>
        </CardFooter>
      </Card>

      {/* Mes Articles */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Mes Articles</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconFileText className="size-6 text-green-500" />
            {formatNumber(stats.totalPosts)}
          </CardTitle>
          <CardAction>
            {stats.growth.posts > 0 ? (
              <Badge variant="default">
                <IconTrendingUp className="size-3" />
                +{stats.growth.posts}%
              </Badge>
            ) : (
              <Badge variant="secondary">
                Nouveau
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {formatNumber(stats.totalViews)} vues total <IconEye className="size-4" />
          </div>
          <div className="text-muted-foreground">Articles que vous avez publiés</div>
        </CardFooter>
      </Card>

      {/* Mes Événements */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Mes Événements</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconCalendar className="size-6 text-orange-500" />
            {formatNumber(stats.totalEvents)}
          </CardTitle>
          <CardAction>
            {stats.growth.events > 0 ? (
              <Badge variant="default">
                <IconTrendingUp className="size-3" />
                +{stats.growth.events}%
              </Badge>
            ) : (
              <Badge variant="secondary">
                Nouveau
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.totalEventParticipants} participants <IconCalendar className="size-4" />
          </div>
          <div className="text-muted-foreground">Événements que vous organisez</div>
        </CardFooter>
      </Card>

      {/* Mon Activité */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Score d'Activité</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconAward className="size-6 text-purple-500" />
            {stats.activityScore}/100
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.totalBadges} badges
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.totalFavorites} favoris donnés <IconHeart className="size-4" />
          </div>
          <div className="text-muted-foreground">Votre engagement sur la plateforme</div>
        </CardFooter>
      </Card>
    </div>
  );
}