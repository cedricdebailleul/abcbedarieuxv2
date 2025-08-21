"use client";

import { useEffect, useState } from "react";
import { Users, Award, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { getBadgesAction } from "@/actions/badge";
import {
  RARITY_COLORS,
  RARITY_LABELS,
  BadgeRarity,
} from "@/lib/validations/badge";
import { BadgeListItem } from "@/lib/types/badge";
import Image from "next/image";

export function BadgeDistributionTable() {
  const [data, setData] = useState<{
    badges: BadgeListItem[];
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const result = await getBadgesAction({
          page: 1,
          limit: 100, // Charger tous les badges
          search: "",
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        if (result.success) {
          setData({
            ...result.data!,
            badges: result.data!.badges.map((badge) => ({
              ...badge,
              iconUrl: badge.iconUrl || null, // Ensure iconUrl is always present
            })),
          });
        } else {
          toast.error(result.error || "Erreur lors du chargement");
        }
      } catch {
        toast.error("Erreur lors du chargement des badges");
      }
      setLoading(false);
    };

    loadBadges();
  }, []);

  const getRarityColor = (rarity: BadgeRarity): string => {
    return RARITY_COLORS[rarity] || RARITY_COLORS.COMMON;
  };

  const renderBadgeIcon = (iconUrl: string | null) => {
    if (!iconUrl) return <Award className="w-5 h-5 text-muted-foreground" />;

    const isUrl =
      iconUrl.startsWith("http://") ||
      iconUrl.startsWith("https://") ||
      iconUrl.startsWith("/");

    if (isUrl) {
      return <Image src={iconUrl} alt="" className="w-5 h-5 object-contain" />;
    } else {
      return <span className="text-lg">{iconUrl}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Distribution des badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.badges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Distribution des badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Aucun badge trouvé
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trier les badges par nombre d'utilisateurs (décroissant)
  const sortedBadges = [...data.badges].sort(
    (a, b) => b._count.users - a._count.users
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Distribution des badges
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Badges classés par nombre d&apos;attributions
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Badge</TableHead>
                <TableHead>Rareté</TableHead>
                <TableHead className="text-center">Utilisateurs</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBadges.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {renderBadgeIcon(badge.iconUrl)}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {badge.title}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {badge.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: getRarityColor(badge.rarity),
                        color: getRarityColor(badge.rarity),
                      }}
                    >
                      {
                        RARITY_LABELS[
                          badge.rarity as keyof typeof RARITY_LABELS
                        ]
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{badge._count.users}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={badge.isActive ? "default" : "secondary"}>
                      {badge.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/admin/badges/${badge.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {sortedBadges.length > 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/badges">Voir tous les badges</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
