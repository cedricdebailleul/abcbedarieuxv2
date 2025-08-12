import { Globe, Mail, MapPin, Phone, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceStatus } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Répertoire des établissements</h1>
        <p className="text-gray-600 mt-2">
          Découvrez tous les établissements référencés à Bédarieux
        </p>
      </div>

      {places.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun établissement n'est encore référencé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((place) => (
            <Link
              key={place.id}
              href={`/places/${place.slug}`}
              className="block hover:transform hover:scale-105 transition-transform"
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{place.name}</CardTitle>
                    {place.isFeatured && <Badge variant="secondary">À la une</Badge>}
                  </div>
                  <CardDescription className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {place.city}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {place.summary && (
                    <p className="text-sm text-gray-600 line-clamp-2">{place.summary}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className="text-xs">
                      {place.type}
                    </Badge>

                    {place.rating && place.rating > 0 && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span>{place.rating.toFixed(1)}</span>
                        <span className="text-gray-400 ml-1">({place._count.reviews})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 text-xs text-gray-500">
                    {place.phone && <Phone className="w-3 h-3" />}
                    {place.email && <Mail className="w-3 h-3" />}
                    {place.website && <Globe className="w-3 h-3" />}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
