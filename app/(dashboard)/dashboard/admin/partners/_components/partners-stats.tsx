"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Star,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react";

interface PartnersStatsProps {
  totalPartners: number;
  activePartners: number;
  featuredPartners: number;
  partnersByType: Record<string, number>;
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
  TECHNICAL: Users,
  SPONSOR: Star,
  SUPPLIER: Users,
  OTHER: Users,
};

export function PartnersStats({
  totalPartners,
  activePartners,
  featuredPartners,
  partnersByType,
}: PartnersStatsProps) {
  const inactivePartners = totalPartners - activePartners;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total partenaires */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total partenaires
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPartners}</div>
          <p className="text-xs text-muted-foreground">
            Tous les partenaires
          </p>
        </CardContent>
      </Card>

      {/* Partenaires actifs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Partenaires actifs
          </CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {activePartners}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalPartners > 0
              ? `${Math.round((activePartners / totalPartners) * 100)}% du total`
              : "Aucun partenaire"}
          </p>
        </CardContent>
      </Card>

      {/* Partenaires inactifs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Partenaires inactifs
          </CardTitle>
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {inactivePartners}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalPartners > 0
              ? `${Math.round((inactivePartners / totalPartners) * 100)}% du total`
              : "Aucun partenaire"}
          </p>
        </CardContent>
      </Card>

      {/* Partenaires mis en avant */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Mis en avant
          </CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {featuredPartners}
          </div>
          <p className="text-xs text-muted-foreground">
            {activePartners > 0
              ? `${Math.round((featuredPartners / activePartners) * 100)}% des actifs`
              : "Aucun partenaire actif"}
          </p>
        </CardContent>
      </Card>

      {/* Répartition par type */}
      {Object.keys(partnersByType).length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Répartition par type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(partnersByType).map(([type, count]) => {
                const Icon = partnerTypeIcons[type as keyof typeof partnerTypeIcons] || Users;
                const label = partnerTypeLabels[type as keyof typeof partnerTypeLabels] || type;

                return (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}