"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Mail,
  Phone,
  Star,
  Building2,
  Users,
  TrendingUp,
  Handshake,
  Package,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Partner, PARTNER_TYPE_LABELS } from "@/lib/types/partners";

interface PartnerCardProps {
  partner: Partner;
  showDescription?: boolean;
  size?: "sm" | "md" | "lg";
}

const partnerTypeColors: Record<string, string> = {
  COMMERCIAL: "bg-blue-100 text-blue-800 border-blue-200",
  INSTITUTIONAL: "bg-purple-100 text-purple-800 border-purple-200",
  MEDIA: "bg-orange-100 text-orange-800 border-orange-200",
  TECHNICAL: "bg-green-100 text-green-800 border-green-200",
  SPONSOR: "bg-yellow-100 text-yellow-800 border-yellow-200",
  SUPPLIER: "bg-gray-100 text-gray-800 border-gray-200",
  OTHER: "bg-slate-100 text-slate-800 border-slate-200",
};
const partnerTypeIcons: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  COMMERCIAL: Building2,
  INSTITUTIONAL: Users,
  MEDIA: TrendingUp,
  TECHNICAL: Package,
  SPONSOR: Star,
  SUPPLIER: Handshake,
  OTHER: Building2,
};

export function PartnerCard({
  partner,
  showDescription = true,
  size = "md",
}: PartnerCardProps) {
  const TypeIcon = partnerTypeIcons[partner.partnerType];

  const cardClassName =
    size === "sm" ? "h-full" : size === "lg" ? "h-full" : "h-full";
  const logoSize = size === "sm" ? 48 : size === "lg" ? 80 : 64;
  const titleSize =
    size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";
  const descriptionLines = size === "sm" ? 2 : size === "lg" ? 4 : 3;

  return (
    <Card
      className={`group hover:shadow-lg transition-all duration-300 cursor-pointer ${cardClassName}`}
    >
      <Link href={`/partenaires/${partner.slug}`} className="block h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {partner.logo ? (
                <div
                  className="relative flex-shrink-0 rounded-lg overflow-hidden bg-white border"
                  style={{ width: logoSize, height: logoSize }}
                >
                  <Image
                    src={partner.logo}
                    alt={`Logo ${partner.name}`}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 48px, (max-width: 1024px) 64px, 80px"
                  />
                </div>
              ) : (
                <div
                  className="flex-shrink-0 bg-muted rounded-lg flex items-center justify-center"
                  style={{ width: logoSize, height: logoSize }}
                >
                  <TypeIcon
                    className={`${size === "sm" ? "w-5 h-5" : "w-6 h-6"} text-muted-foreground`}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`${titleSize} font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1`}
                  >
                    {partner.name}
                  </h3>
                  {partner.isFeatured && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                  )}
                </div>

                <Badge
                  variant="outline"
                  className={`text-xs ${partnerTypeColors[partner.partnerType]}`}
                >
                  {(PARTNER_TYPE_LABELS as Record<string, string>)[partner.partnerType] || partner.partnerType}
                </Badge>

                {partner.category && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {partner.category}
                  </p>
                )}
              </div>
            </div>
          </div>

          {showDescription && partner.description && (
            <p
              className={`text-sm text-muted-foreground leading-relaxed line-clamp-${descriptionLines}`}
            >
              {partner.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {partner.website && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(
                    partner.website || "#",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Site web
              </Button>
            )}

            {partner.email && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `mailto:${partner.email}`;
                }}
              >
                <Mail className="w-3 h-3 mr-1" />
                Email
              </Button>
            )}

            {partner.phone && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `tel:${partner.phone}`;
                }}
              >
                <Phone className="w-3 h-3 mr-1" />
                Appeler
              </Button>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
