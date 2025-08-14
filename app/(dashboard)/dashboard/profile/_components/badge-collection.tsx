"use client";

import {
  Award,
  Calendar,
  Eye,
  EyeOff,
  Search,
  Shield,
  Star,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserBadgeData {
  id: string;
  earnedAt: string;
  reason?: string | null;
  isVisible: boolean;
  badge: {
    id: string;
    title: string;
    description: string;
    iconUrl?: string;
    color?: string;
    category: string;
    rarity: string;
  };
}

interface Badge {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
  color?: string;
  category: string;
  rarity: string;
}

interface BadgeCollectionProps {
  userBadges: UserBadgeData[];
  allBadges: Badge[];
}

export default function BadgeCollection({
  userBadges,
  allBadges,
}: BadgeCollectionProps) {
  const [_selectedBadge, _setSelectedBadge] = useState<Badge | null>(null);
  const [_selectedUserBadge, _setSelectedUserBadge] =
    useState<UserBadgeData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [showOnlyEarned, setShowOnlyEarned] = useState(false);

  // Créer un map des badges utilisateur pour un accès rapide
  const userBadgeMap = new Map(userBadges.map((ub) => [ub.badge.id, ub]));

  // Filtrer et enrichir les badges
  const enrichedBadges = allBadges
    .map((badge) => {
      const userBadge = userBadgeMap.get(badge.id);
      return {
        ...badge,
        isEarned: !!userBadge,
        userBadgeData: userBadge,
      };
    })
    .filter((badge) => {
      const matchesSearch =
        badge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || badge.category === categoryFilter;
      const matchesRarity =
        rarityFilter === "all" || badge.rarity === rarityFilter;
      const matchesEarnedFilter = !showOnlyEarned || badge.isEarned;

      return (
        matchesSearch && matchesCategory && matchesRarity && matchesEarnedFilter
      );
    });

  // Grouper par catégorie
  const badgesByCategory = enrichedBadges.reduce((acc, badge) => {
    const category = badge.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, typeof enrichedBadges>);

  // Statistiques des badges
  const stats = {
    total: allBadges.length,
    earned: userBadges.length,
    visible: userBadges.filter((b) => b.isVisible).length,
    byCategory: userBadges.reduce((acc, b) => {
      acc[b.badge.category] = (acc[b.badge.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byRarity: userBadges.reduce((acc, b) => {
      acc[b.badge.rarity] = (acc[b.badge.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      GENERAL: Trophy,
      ACHIEVEMENT: Award,
      PARTICIPATION: Star,
      SPECIAL: Shield,
      ANNIVERSARY: Calendar,
    };
    return icons[category as keyof typeof icons] || Trophy;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      GENERAL: "Général",
      ACHIEVEMENT: "Accomplissement",
      PARTICIPATION: "Participation",
      SPECIAL: "Spécial",
      ANNIVERSARY: "Anniversaire",
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getRarityLabel = (rarity: string) => {
    const labels = {
      COMMON: "Commun",
      UNCOMMON: "Peu commun",
      RARE: "Rare",
      EPIC: "Épique",
      LEGENDARY: "Légendaire",
    };
    return labels[rarity as keyof typeof labels] || rarity;
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      COMMON: "text-gray-600",
      UNCOMMON: "text-green-600",
      RARE: "text-blue-600",
      EPIC: "text-purple-600",
      LEGENDARY: "text-yellow-600",
    };
    return colors[rarity as keyof typeof colors] || "text-gray-600";
  };

  const getRarityBadgeVariant = (rarity: string) => {
    const variants = {
      COMMON: "secondary",
      UNCOMMON: "default",
      RARE: "default",
      EPIC: "default",
      LEGENDARY: "default",
    } as const;
    return variants[rarity as keyof typeof variants] || "secondary";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getHowToEarnMessage = (badgeTitle: string, category: string) => {
    const messages: Record<string, string> = {
      Bienvenue:
        "Badge automatiquement attribué lors de votre inscription sur la plateforme.",
      "Premier pas":
        "Connectez-vous pour la première fois après votre inscription.",
      "Profil complété":
        "Remplissez toutes les informations de votre profil (nom, prénom, bio, photo).",
      "Premier article":
        "Publiez votre premier article ou contenu sur la plateforme.",
      "Contributeur actif":
        "Publiez 10 articles ou contenus pour démontrer votre engagement.",
      Expert: "Publiez 50 articles de qualité pour être reconnu comme expert.",
      Légende:
        "Atteignez 100 publications pour rejoindre les légendes de la plateforme.",
      "Membre fidèle": "Restez actif pendant 30 jours consécutifs.",
      Vétéran: "Célébrez votre première année sur la plateforme.",
      Fondateur: "Badge spécial réservé aux premiers membres de la communauté.",
      "Beta testeur": "Participez aux tests de nouvelles fonctionnalités.",
      "Aide précieuse":
        "Aidez d'autres membres et recevez des commentaires positifs.",
    };

    const categoryMessages: Record<string, string> = {
      GENERAL: "Badge général obtenu par diverses actions sur la plateforme.",
      ACHIEVEMENT:
        "Badge d'accomplissement obtenu en atteignant certains objectifs.",
      PARTICIPATION:
        "Badge de participation obtenu en étant actif dans la communauté.",
      SPECIAL: "Badge spécial attribué lors d'événements particuliers.",
      ANNIVERSARY: "Badge anniversaire célébrant votre fidélité.",
    };

    return (
      messages[badgeTitle] ||
      categoryMessages[category] ||
      "Continuez à être actif sur la plateforme pour débloquer ce badge !"
    );
  };

  const uniqueCategories = Array.from(
    new Set(allBadges.map((b) => b.category))
  );
  const uniqueRarities = Array.from(new Set(allBadges.map((b) => b.rarity)));

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Statistiques des badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Badges total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.earned}
              </div>
              <div className="text-sm text-gray-600">Obtenus</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((stats.earned / stats.total) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Progression</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.byRarity.LEGENDARY || 0}
              </div>
              <div className="text-sm text-gray-600">Légendaires</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un badge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={rarityFilter} onValueChange={setRarityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Rareté" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les raretés</SelectItem>
                {uniqueRarities.map((rarity) => (
                  <SelectItem key={rarity} value={rarity}>
                    {getRarityLabel(rarity)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showOnlyEarned ? "default" : "outline"}
              onClick={() => setShowOnlyEarned(!showOnlyEarned)}
              className="flex items-center gap-2"
            >
              {showOnlyEarned ? (
                <>
                  <Trophy className="h-4 w-4" />
                  Obtenus seulement
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4" />
                  Tous les badges
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collection de badges */}
      {Object.keys(badgesByCategory).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Aucun badge trouvé avec ces filtres</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(badgesByCategory).map(([category, categoryBadges]) => {
          const CategoryIcon = getCategoryIcon(category);

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CategoryIcon className="h-5 w-5" />
                  {getCategoryLabel(category)}
                  <Badge variant="secondary">{categoryBadges.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {categoryBadges.map((badge) => (
                    <Dialog key={badge.id}>
                      <DialogTrigger asChild>
                        <div
                          className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                            badge.isEarned ? "opacity-100" : "opacity-60"
                          } ${badge.isEarned ? "shadow-md" : "shadow-sm"}`}
                          style={{
                            borderColor: badge.isEarned
                              ? badge.color || "#3B82F6"
                              : "#D1D5DB",
                          }}
                        >
                          {badge.isEarned &&
                            badge.userBadgeData &&
                            !badge.userBadgeData.isVisible && (
                              <EyeOff className="absolute top-2 right-2 h-4 w-4 text-gray-400" />
                            )}

                          {badge.isEarned && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Trophy className="h-3 w-3 text-white" />
                            </div>
                          )}

                          <div className="text-center">
                            <div
                              className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                                badge.isEarned ? "text-white" : "text-gray-400"
                              }`}
                              style={{
                                backgroundColor: badge.isEarned
                                  ? badge.color || "#3B82F6"
                                  : "#F3F4F6",
                                filter: badge.isEarned
                                  ? "none"
                                  : "grayscale(100%)",
                              }}
                            >
                              <Trophy className="h-8 w-8" />
                            </div>

                            <div className="space-y-1">
                              <h3
                                className={`font-medium text-sm truncate ${
                                  badge.isEarned
                                    ? "text-gray-900"
                                    : "text-gray-500"
                                }`}
                                title={badge.title}
                              >
                                {badge.title}
                              </h3>
                              <Badge
                                variant={getRarityBadgeVariant(badge.rarity)}
                                className={`text-xs ${getRarityColor(
                                  badge.rarity
                                )} ${badge.isEarned ? "" : "opacity-60"}`}
                              >
                                {getRarityLabel(badge.rarity)}
                              </Badge>
                              {!badge.isEarned && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Non obtenu
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <div className="text-center mb-4">
                            <div
                              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center relative ${
                                badge.isEarned ? "text-white" : "text-gray-400"
                              }`}
                              style={{
                                backgroundColor: badge.isEarned
                                  ? badge.color || "#3B82F6"
                                  : "#F3F4F6",
                                filter: badge.isEarned
                                  ? "none"
                                  : "grayscale(100%)",
                              }}
                            >
                              <Trophy className="h-12 w-12" />
                              {badge.isEarned && (
                                <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                  <Trophy className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>
                            <DialogTitle className="text-xl">
                              {badge.title}
                            </DialogTitle>
                            <div className="flex items-center justify-center gap-2 mt-2">
                              <Badge
                                variant={getRarityBadgeVariant(badge.rarity)}
                                className={badge.isEarned ? "" : "opacity-60"}
                              >
                                {getRarityLabel(badge.rarity)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={badge.isEarned ? "" : "opacity-60"}
                              >
                                {getCategoryLabel(badge.category)}
                              </Badge>
                              <Badge
                                variant={
                                  badge.isEarned ? "default" : "secondary"
                                }
                              >
                                {badge.isEarned ? "Obtenu" : "Non obtenu"}
                              </Badge>
                            </div>
                          </div>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-1">Description</h4>
                            <p className="text-gray-600">{badge.description}</p>
                          </div>

                          {badge.isEarned && badge.userBadgeData ? (
                            <>
                              <div>
                                <h4 className="font-medium mb-1">Obtenu le</h4>
                                <p className="text-gray-600">
                                  {formatDate(badge.userBadgeData.earnedAt)}
                                </p>
                              </div>

                              {badge.userBadgeData.reason && (
                                <div>
                                  <h4 className="font-medium mb-1">Raison</h4>
                                  <p className="text-gray-600">
                                    {badge.userBadgeData.reason}
                                  </p>
                                </div>
                              )}

                              <div>
                                <h4 className="font-medium mb-1">Visibilité</h4>
                                <div className="flex items-center gap-2">
                                  {badge.userBadgeData.isVisible ? (
                                    <>
                                      <Eye className="h-4 w-4 text-green-600" />
                                      <span className="text-green-600">
                                        Visible sur le profil
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                      <span className="text-gray-500">
                                        Masqué sur le profil
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium mb-2 text-gray-700">
                                💡 Comment l'obtenir ?
                              </h4>
                              <p className="text-gray-600 text-sm">
                                {getHowToEarnMessage(
                                  badge.title,
                                  badge.category
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
