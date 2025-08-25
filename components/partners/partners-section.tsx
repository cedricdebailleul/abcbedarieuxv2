"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PartnerCard } from "./partner-card";
import {
  Search,
  Filter,
  Users,
  Building2,
  TrendingUp,
  Handshake,
  Package,
  Star,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Partner {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  partnerType: string;
  category?: string;
  isFeatured: boolean;
}

interface PartnersStats {
  total: number;
  featured: number;
  byType: Record<string, number>;
}

interface PartnersSectionProps {
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
  showStats?: boolean;
  limit?: number;
  featuredOnly?: boolean;
  type?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const partnerTypeLabels = {
  COMMERCIAL: "Commercial",
  INSTITUTIONAL: "Institutionnel",
  MEDIA: "Média",
  TECHNICAL: "Technique",
  SPONSOR: "Sponsor",
  SUPPLIER: "Fournisseur",
  OTHER: "Autre",
};

const partnerTypeIcons = {
  COMMERCIAL: Building2,
  INSTITUTIONAL: Users,
  MEDIA: TrendingUp,
  TECHNICAL: Package,
  SPONSOR: Star,
  SUPPLIER: Handshake,
  OTHER: Building2,
};

export function PartnersSection({
  title = "Nos Partenaires",
  subtitle,
  showFilters = false,
  showStats = false,
  limit,
  featuredOnly = false,
  type,
  size = "md",
  className = "",
}: PartnersSectionProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<PartnersStats>({
    total: 0,
    featured: 0,
    byType: {},
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState(type || "all");

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (limit) params.append("limit", limit.toString());
      if (featuredOnly) params.append("featured", "true");
      if (selectedType && selectedType !== "all")
        params.append("type", selectedType);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/partners?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setPartners(data.partners);
      setStats(data.stats);
    } catch (error) {
      console.error("Erreur lors du chargement des partenaires:", error);
    } finally {
      setLoading(false);
    }
  }, [limit, featuredOnly, selectedType, searchTerm]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const gridCols =
    size === "sm"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : size === "lg"
        ? "grid-cols-1 lg:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  if (loading) {
    return (
      <div className={`space-y-8 ${className}`}>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        {subtitle && (
          <p className="text-lg text-muted-foreground mb-6">{subtitle}</p>
        )}

        {showStats && (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground">Partenaires</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.featured}
              </div>
              <div className="text-sm text-muted-foreground">Mis en avant</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un partenaire..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Type de partenaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(partnerTypeLabels).map(([value, label]) => {
                    const Icon =
                      partnerTypeIcons[value as keyof typeof partnerTypeIcons];
                    const count = stats.byType[value] || 0;
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {label}
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {count}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partners Grid */}
      {partners.length > 0 ? (
        <div className={`grid ${gridCols} gap-6`}>
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} size={size} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun partenaire trouvé</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedType !== "all"
              ? "Essayez de modifier vos critères de recherche"
              : "Aucun partenaire n'est actuellement disponible"}
          </p>
        </div>
      )}

      {/* View All Button */}
      {!showFilters && partners.length > 0 && (
        <div className="text-center">
          <Button asChild variant="outline">
            <Link href="/partenaires">
              Voir tous les partenaires ({stats.total})
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
