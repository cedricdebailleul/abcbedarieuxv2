import { Globe, Mail, Phone, Star, MapPin, Building2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { SafeImage } from "@/components/safe-image";
import { getPlaceTypeLabel } from "@/lib/share-utils";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const INITIAL_COLORS = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-pink-500",
];

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return INITIAL_COLORS[hash % INITIAL_COLORS.length];
}

export default async function PublicPlacesPage() {
  const places = await prisma.place.findMany({
    where: {
      status: PlaceStatus.ACTIVE,
      isActive: true,
    },
    include: {
      _count: {
        select: { reviews: true },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
    take: 50,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold">Répertoire des établissements</h1>
        <p className="text-muted-foreground mt-2">
          Découvrez tous les établissements référencés à Bédarieux
        </p>
      </div>

      {places.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Aucun établissement n&apos;est encore référencé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((place) => {
            const initials = getInitials(place.name);
            const initialsColor = getColorFromName(place.name);

            return (
              <Link
                key={place.id}
                href={`/places/${place.slug}`}
                className="group block"
              >
                <Card className="overflow-hidden h-full transition-shadow duration-300 hover:shadow-lg">
                  {/* Cover image */}
                  <div className="relative h-44 overflow-hidden bg-muted">
                    {place.coverImage ? (
                      <SafeImage
                        src={place.coverImage}
                        alt={place.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        fallbackClassName="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Building2 className="w-14 h-14 text-primary/25" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

                    {/* Badge À la une */}
                    {place.isFeatured && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0 shadow-sm">
                          À la une
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Zone contenu avec logo chevauchant */}
                  <div className="relative">
                    {/* Logo en overlay sur la cover */}
                    <div className="absolute -top-6 left-4">
                      {place.logo ? (
                        <div className="w-12 h-12 rounded-full border-2 border-background shadow-md overflow-hidden bg-background">
                          <SafeImage
                            src={place.logo}
                            alt={`Logo ${place.name}`}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                            fallbackClassName="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs font-bold"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full border-2 border-background shadow-md flex items-center justify-center text-white font-bold text-sm ${initialsColor}`}
                        >
                          {initials}
                        </div>
                      )}
                    </div>

                    <CardContent className="pt-9 pb-4 px-4 space-y-2">
                      {/* Nom et ville */}
                      <div>
                        <h2 className="font-semibold text-base leading-tight line-clamp-1">
                          {place.name}
                        </h2>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span>{place.city}</span>
                        </div>
                      </div>

                      {/* Type et note */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getPlaceTypeLabel(place.type)}
                        </Badge>

                        {place.rating && place.rating > 0 ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium text-foreground">
                              {place.rating.toFixed(1)}
                            </span>
                            <span>({place._count.reviews})</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Summary */}
                      {place.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {place.summary}
                        </p>
                      )}

                      {/* Icônes contact */}
                      {(place.phone || place.email || place.website) && (
                        <div className="flex items-center gap-2 pt-1">
                          {place.phone && (
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          {place.email && (
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          {place.website && (
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
