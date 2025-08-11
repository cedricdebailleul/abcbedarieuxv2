import { prisma } from "@/lib/prisma";
import { PlaceStatus } from "@/lib/generated/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Clock, 
  ExternalLink,
  Facebook,
  Instagram,
  Twitter,
  Linkedin
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PlacePage({ params }: PageProps) {
  const { slug } = await params;
  
  const place = await prisma.place.findUnique({
    where: {
      slug: slug,
      status: PlaceStatus.ACTIVE,
      isActive: true
    },
    include: {
      owner: {
        select: { name: true }
      },
      reviews: {
        include: {
          user: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      openingHours: {
        orderBy: {
          dayOfWeek: "asc"
        }
      },
      _count: {
        select: { reviews: true, favorites: true }
      }
    }
  });

  if (!place) {
    notFound();
  }

  const dayNames = {
    MONDAY: "Lundi",
    TUESDAY: "Mardi", 
    WEDNESDAY: "Mercredi",
    THURSDAY: "Jeudi",
    FRIDAY: "Vendredi",
    SATURDAY: "Samedi",
    SUNDAY: "Dimanche"
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{place.name}</h1>
            <div className="flex items-center mt-2 text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{place.street} {place.streetNumber}, {place.postalCode} {place.city}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline">{place.type}</Badge>
            {place.isFeatured && (
              <Badge variant="secondary">À la une</Badge>
            )}
          </div>
        </div>

        {place.rating && place.rating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-500 mr-1" />
              <span className="text-lg font-semibold">{place.rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-500">
              ({place._count.reviews} {place._count.reviews > 1 ? 'avis' : 'avis'})
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {(place.summary || place.description) && (
            <Card>
              <CardHeader>
                <CardTitle>À propos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {place.summary && (
                  <p className="text-gray-700 font-medium">{place.summary}</p>
                )}
                {place.description && (
                  <p className="text-gray-600 whitespace-pre-wrap">{place.description}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Horaires */}
          {place.openingHours.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Horaires d'ouverture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {place.openingHours.map((hours) => (
                    <div key={hours.id} className="flex justify-between">
                      <span className="font-medium">
                        {dayNames[hours.dayOfWeek as keyof typeof dayNames]}
                      </span>
                      <span className="text-gray-600">
                        {hours.isClosed ? 'Fermé' : `${hours.openTime} - ${hours.closeTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Avis */}
          {place.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Avis clients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {place.reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{review.user.name}</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span>{review.rating}/5</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                    )}
                    <div className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    <Separator />
                  </div>
                ))}
                {place.reviews.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    Et {place.reviews.length - 3} autre{place.reviews.length - 3 > 1 ? 's' : ''} avis...
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {place.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  <a 
                    href={`tel:${place.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {place.phone}
                  </a>
                </div>
              )}
              
              {place.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  <a 
                    href={`mailto:${place.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {place.email}
                  </a>
                </div>
              )}
              
              {place.website && (
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-3 text-gray-400" />
                  <a 
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    Site web <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Réseaux sociaux */}
          {(place.facebook || place.instagram || place.twitter || place.linkedin) && (
            <Card>
              <CardHeader>
                <CardTitle>Réseaux sociaux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {place.facebook && (
                  <a 
                    href={place.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </a>
                )}
                
                {place.instagram && (
                  <a 
                    href={place.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-pink-600 hover:underline"
                  >
                    <Instagram className="w-4 h-4 mr-2" />
                    Instagram
                  </a>
                )}
                
                {place.twitter && (
                  <a 
                    href={place.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-400 hover:underline"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </a>
                )}
                
                {place.linkedin && (
                  <a 
                    href={place.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-700 hover:underline"
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Google Maps */}
          {place.googleMapsUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Localisation</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a 
                    href={place.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Voir sur Google Maps
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Actions pour propriétaire */}
          {!place.ownerId && (
            <Card>
              <CardHeader>
                <CardTitle>Vous êtes le propriétaire ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Revendiquez cet établissement pour gérer ses informations.
                </p>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/places/claim/${place.id}`}>
                    Revendiquer cet établissement
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}