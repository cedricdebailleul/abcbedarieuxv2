"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Trophy, 
  Star, 
  Award, 
  Shield, 
  Calendar,
  Search,
  Filter,
  Eye,
  EyeOff
} from "lucide-react";

interface BadgeData {
  id: string;
  earnedAt: string;
  reason?: string;
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

interface BadgeCollectionProps {
  badges: BadgeData[];
}

export default function BadgeCollection({ badges }: BadgeCollectionProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [rarityFilter, setRarityFilter] = useState<string>("");
  const [showHidden, setShowHidden] = useState(false);

  // Filtrer les badges
  const filteredBadges = badges.filter((badgeData) => {
    const matchesSearch = badgeData.badge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         badgeData.badge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || badgeData.badge.category === categoryFilter;
    const matchesRarity = !rarityFilter || badgeData.badge.rarity === rarityFilter;
    const matchesVisibility = showHidden || badgeData.isVisible;

    return matchesSearch && matchesCategory && matchesRarity && matchesVisibility;
  });

  // Grouper par catégorie
  const badgesByCategory = filteredBadges.reduce((acc, badgeData) => {
    const category = badgeData.badge.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(badgeData);
    return acc;
  }, {} as Record<string, BadgeData[]>);

  // Statistiques des badges
  const stats = {
    total: badges.length,
    visible: badges.filter(b => b.isVisible).length,
    byCategory: badges.reduce((acc, b) => {
      acc[b.badge.category] = (acc[b.badge.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byRarity: badges.reduce((acc, b) => {
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

  const uniqueCategories = Array.from(new Set(badges.map(b => b.badge.category)));
  const uniqueRarities = Array.from(new Set(badges.map(b => b.badge.rarity)));

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
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.visible}</div>
              <div className="text-sm text-gray-600">Visibles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.byRarity.LEGENDARY || 0}
              </div>
              <div className="text-sm text-gray-600">Légendaires</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Object.keys(badgesByCategory).length}
              </div>
              <div className="text-sm text-gray-600">Catégories</div>
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
                <SelectItem value="">Toutes les catégories</SelectItem>
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
                <SelectItem value="">Toutes les raretés</SelectItem>
                {uniqueRarities.map((rarity) => (
                  <SelectItem key={rarity} value={rarity}>
                    {getRarityLabel(rarity)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowHidden(!showHidden)}
              className="flex items-center gap-2"
            >
              {showHidden ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Masquer cachés
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Voir cachés
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
                  {categoryBadges.map((badgeData) => (
                    <Dialog key={badgeData.id}>
                      <DialogTrigger asChild>
                        <div
                          className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                            badgeData.isVisible ? "opacity-100" : "opacity-50"
                          }`}
                          style={{ borderColor: badgeData.badge.color || "#3B82F6" }}
                        >
                          {!badgeData.isVisible && (
                            <EyeOff className="absolute top-2 right-2 h-4 w-4 text-gray-400" />
                          )}
                          
                          <div className="text-center">
                            <div 
                              className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: badgeData.badge.color || "#3B82F6" }}
                            >
                              <Trophy className="h-8 w-8" />
                            </div>
                            
                            <div className="space-y-1">
                              <h3 className="font-medium text-sm truncate" title={badgeData.badge.title}>
                                {badgeData.badge.title}
                              </h3>
                              <Badge 
                                variant={getRarityBadgeVariant(badgeData.badge.rarity)}
                                className={`text-xs ${getRarityColor(badgeData.badge.rarity)}`}
                              >
                                {getRarityLabel(badgeData.badge.rarity)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <div className="text-center mb-4">
                            <div 
                              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: badgeData.badge.color || "#3B82F6" }}
                            >
                              <Trophy className="h-10 w-10" />
                            </div>
                            <DialogTitle className="text-xl">{badgeData.badge.title}</DialogTitle>
                            <div className="flex items-center justify-center gap-2 mt-2">
                              <Badge variant={getRarityBadgeVariant(badgeData.badge.rarity)}>
                                {getRarityLabel(badgeData.badge.rarity)}
                              </Badge>
                              <Badge variant="outline">
                                {getCategoryLabel(badgeData.badge.category)}
                              </Badge>
                            </div>
                          </div>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-1">Description</h4>
                            <p className="text-gray-600">{badgeData.badge.description}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-1">Obtenu le</h4>
                            <p className="text-gray-600">{formatDate(badgeData.earnedAt)}</p>
                          </div>
                          
                          {badgeData.reason && (
                            <div>
                              <h4 className="font-medium mb-1">Raison</h4>
                              <p className="text-gray-600">{badgeData.reason}</p>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-medium mb-1">Statut</h4>
                            <div className="flex items-center gap-2">
                              {badgeData.isVisible ? (
                                <>
                                  <Eye className="h-4 w-4 text-green-600" />
                                  <span className="text-green-600">Visible sur le profil</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-500">Masqué sur le profil</span>
                                </>
                              )}
                            </div>
                          </div>
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