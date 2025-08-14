import { Metadata } from "next";
import { ArrowLeft, Edit, Users, Award, Calendar, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { getBadgeAction } from "@/actions/badge";
import {
  CATEGORY_LABELS,
  RARITY_LABELS,
  RARITY_COLORS,
} from "@/lib/validations/badge";
import { ManualAwardBadge } from "../_components/manual-award-badge";
import { RevokeBadgeButton } from "../_components/revoke-badge-button";

interface BadgeDetailPageProps {
  params: Promise<{
    badgeId: string;
  }>;
}

export async function generateMetadata({
  params,
}: BadgeDetailPageProps): Promise<Metadata> {
  const { badgeId } = await params;
  const result = await getBadgeAction(badgeId);

  return {
    title: result.success
      ? `${result.data.title} | Administration`
      : "Badge introuvable | Administration",
    description: "Détails et gestion du badge",
  };
}

export default async function BadgeDetailPage({
  params,
}: BadgeDetailPageProps) {
  const { badgeId } = await params;
  const result = await getBadgeAction(badgeId);

  if (!result.success) {
    notFound();
  }

  const badge = result.data;

  // Rendu de l'icône du badge
  const renderBadgeIcon = () => {
    if (!badge.iconUrl)
      return <Award className="w-16 h-16 text-muted-foreground" />;

    const isUrl =
      badge.iconUrl.startsWith("http://") ||
      badge.iconUrl.startsWith("https://") ||
      badge.iconUrl.startsWith("/");

    if (isUrl) {
      return (
        <img
          src={badge.iconUrl}
          alt={badge.title}
          className="w-16 h-16 object-contain"
        />
      );
    } else {
      return <span className="text-6xl">{badge.iconUrl}</span>;
    }
  };

  const getRarityColor = () => {
    return (
      RARITY_COLORS[badge.rarity as keyof typeof RARITY_COLORS] ||
      RARITY_COLORS.COMMON
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/admin/badges">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{badge.title}</h1>
            <p className="text-muted-foreground">Détails et gestion du badge</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/admin/badges/${badge.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations du badge */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte principale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Informations du badge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Badge preview */}
              <div className="flex items-center gap-4 p-6 border rounded-lg bg-muted/50">
                <div
                  className="w-20 h-20 rounded-full border-4 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: badge.color || getRarityColor(),
                    backgroundColor: `${badge.color || getRarityColor()}20`,
                  }}
                >
                  {renderBadgeIcon()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{badge.title}</h2>
                  <p className="text-muted-foreground mt-1">
                    {badge.description}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: badge.color || getRarityColor(),
                        color: badge.color || getRarityColor(),
                      }}
                    >
                      {
                        RARITY_LABELS[
                          badge.rarity as keyof typeof RARITY_LABELS
                        ]
                      }
                    </Badge>
                    <Badge variant="outline">
                      {
                        CATEGORY_LABELS[
                          badge.category as keyof typeof CATEGORY_LABELS
                        ]
                      }
                    </Badge>
                    <Badge variant={badge.isActive ? "default" : "secondary"}>
                      {badge.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Détails techniques */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Couleur:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{
                        backgroundColor: badge.color || getRarityColor(),
                      }}
                    />
                    <span className="font-mono">
                      {badge.color || getRarityColor()}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Icône:</span>
                  <div className="mt-1 font-mono text-xs">
                    {badge.iconUrl || "Aucune"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Utilisateurs ayant ce badge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Utilisateurs ({badge._count.users})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badge.users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur n'a encore ce badge
                </div>
              ) : (
                <div className="space-y-3">
                  {badge.users.map((userBadge: any) => (
                    <div
                      key={userBadge.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={userBadge.user.image} />
                          <AvatarFallback>
                            {userBadge.user.name?.[0] ||
                              userBadge.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {userBadge.user.name || userBadge.user.email}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {userBadge.reason}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(userBadge.earnedAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </div>
                        </div>
                      </div>
                      <RevokeBadgeButton
                        badgeId={badge.id}
                        userId={userBadge.user.id}
                        badgeTitle={badge.title}
                        userEmail={userBadge.user.email}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          {/* Attribution manuelle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attribution manuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <ManualAwardBadge badgeId={badge.id} badgeTitle={badge.title} />
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Utilisateurs:</span>
                <span className="font-medium">{badge._count.users}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut:</span>
                <Badge variant={badge.isActive ? "default" : "secondary"}>
                  {badge.isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé le:</span>
                <span className="text-sm">
                  {new Date(badge.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modifié le:</span>
                <span className="text-sm">
                  {new Date(badge.updatedAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
