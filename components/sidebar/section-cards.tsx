import {
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
  IconFileText,
  IconBuilding,
  IconMail,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

export function SectionCards() {
  const { stats, loading, error } = useDashboardStats();

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
              {error || "Impossible de charger les statistiques"}
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
        description: "Croissance positive",
      };
    } else if (rate < 0) {
      return {
        icon: IconTrendingDown,
        variant: "destructive" as const,
        text: `${rate}%`,
        description: "En baisse ce mois",
      };
    } else {
      return {
        icon: IconTrendingUp,
        variant: "secondary" as const,
        text: "0%",
        description: "Stable",
      };
    }
  };

  const growth = getGrowthIndicator(stats.growthRate);

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Utilisateurs Total */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Utilisateurs Inscrits</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconUsers className="size-6 text-blue-500" />
            {formatNumber(stats.totalUsers)}
          </CardTitle>
          <CardAction>
            <Badge variant={growth.variant}>
              <growth.icon className="size-3" />
              {growth.text}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.recentUsers} nouveaux ce mois{" "}
            <IconUsers className="size-4" />
          </div>
          <div className="text-muted-foreground">{growth.description}</div>
        </CardFooter>
      </Card>

      {/* Articles/Posts */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Articles Publiés</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconFileText className="size-6 text-green-500" />
            {formatNumber(stats.totalPosts)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="size-3" />+{stats.recentPosts}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.recentPosts} nouveaux ce mois{" "}
            <IconFileText className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Contenu dynamique et actuel
          </div>
        </CardFooter>
      </Card>

      {/* Commerces */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Commerces Référencés</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconBuilding className="size-6 text-orange-500" />
            {formatNumber(stats.totalPlaces)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="size-3" />
              {stats.engagementRate}% actifs
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.activePlaces} commerces actifs{" "}
            <IconBuilding className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Bon taux d&apos;engagement
          </div>
        </CardFooter>
      </Card>

      {/* Newsletter */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Abonnés Newsletter</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconMail className="size-6 text-purple-500" />
            {formatNumber(stats.newsletterSubscribers)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="size-3" />
              Actifs
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Abonnements newsletter <IconMail className="size-4" />
          </div>
          <div className="text-muted-foreground">Communication directe</div>
        </CardFooter>
      </Card>
    </div>
  );
}
