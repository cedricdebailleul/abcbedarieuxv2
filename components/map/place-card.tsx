"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  Navigation,
  Star,
  Clock,
  ChevronDown,
  ChevronUp,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SafeImage } from "@/components/safe-image";
import { PlaceCategoriesBadges } from "@/components/places/place-categories-badges";
import type { MapPlace } from "./interactive-map";
import { calculateDistance, formatDistance } from "@/lib/map-utils";
import {
  computeOpeningStatus,
  getOpeningStatusText,
  getNextChangeText,
  formatOpeningHours,
} from "@/lib/opening-hours-utils";
import { getPlaceTypeLabel } from "@/lib/share-utils";
import { cn } from "@/lib/utils";

interface PlaceCardProps {
  place: MapPlace;
  onClose: () => void;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
}

export function PlaceCard({
  place,
  onClose,
  userLocation,
  className,
}: PlaceCardProps) {
  const [showFullHours, setShowFullHours] = useState(false);

  // Calculer la distance si l'utilisateur a partagé sa position
  const distance =
    userLocation && place.latitude && place.longitude
      ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          place.latitude,
          place.longitude
        )
      : null;

  // Calculer le statut d'ouverture
  const openingStatus = computeOpeningStatus(place.openingHours);
  const statusInfo = getOpeningStatusText(openingStatus);
  const nextChangeText = getNextChangeText(openingStatus);
  const formattedHours = formatOpeningHours(place.openingHours);

  // Adresse complète
  const fullAddress = `${place.streetNumber ? `${place.streetNumber} ` : ""}${place.street}, ${place.postalCode} ${place.city}`;

  // URL Google Maps pour l'itinéraire
  const directionsUrl =
    place.latitude && place.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          fullAddress
        )}`;

  const cardVariants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      y: 20,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const mobileSlideVariants = {
    initial: {
      opacity: 0,
      y: "100%",
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      y: "100%",
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <AnimatePresence>
      <div className="relative h-full">
        {/* Overlay pour mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />

        {/* Card */}
        <motion.div
          variants={
            window.innerWidth < 1024 ? mobileSlideVariants : cardVariants
          }
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            "bg-background border shadow-lg overflow-hidden",
            "lg:rounded-xl lg:max-w-md",
            "fixed bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto",
            "z-50",
            className
          )}
        >
          <Card className="border-0 shadow-none h-full flex flex-col">
            {/* Header avec image */}
            <div className="relative h-48 lg:h-40 overflow-hidden">
              {place.coverImage || place.logo ? (
                <SafeImage
                  src={place.coverImage || place.logo!}
                  alt={place.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 384px"
                  fallbackClassName="w-full h-full bg-gradient-to-br from-muted to-muted/50"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-muted-foreground" />
                </div>
              )}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Bouton fermer */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-3 right-3 z-10 bg-red-600 text-white hover:bg-red-700 shadow-lg"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Badge featured */}
              {place.isFeatured && (
                <Badge className="absolute top-3 left-3 bg-yellow-500 text-yellow-900 hover:bg-yellow-500">
                  ⭐ À la une
                </Badge>
              )}

              {/* Statut ouverture */}
              <div className="absolute bottom-3 left-3">
                <Badge
                  className={cn(
                    "text-xs font-medium shadow-lg border-2 border-white/20",
                    statusInfo.className
                  )}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {statusInfo.text}
                </Badge>
              </div>

              {/* Distance */}
              {distance && (
                <div className="absolute bottom-3 right-3">
                  <Badge
                    variant="secondary"
                    className="bg-blue-600 text-white shadow-lg border-2 border-white/20 font-medium"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    {formatDistance(distance)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Contenu */}
            <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Titre et type */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {place.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {getPlaceTypeLabel(place.type)}
                  </Badge>
                  {place._count.reviews + place._count.googleReviews > 0 && (() => {
                    const allReviews = [...place.reviews, ...place.googleReviews];
                    const averageRating = allReviews.length > 0 
                      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
                      : 0;
                    
                    return (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium text-foreground">
                          {averageRating.toFixed(1)}
                        </span>
                        <span className="ml-1">
                          ({place._count.reviews + place._count.googleReviews} avis)
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Catégories */}
                {place.categories.length > 0 && (
                  <div className="mt-2">
                    <PlaceCategoriesBadges
                      categories={place.categories.map((category) => ({
                        ...category,
                        category: {
                          ...category.category,
                          icon: category.category.icon || null,
                          color: category.category.color ?? null,
                        },
                      }))}
                      maxDisplay={4}
                      size="sm"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              {place.summary && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {place.summary}
                </p>
              )}

              <Separator />

              {/* Statut et prochaine ouverture */}
              {nextChangeText && (
                <div className="text-xs text-muted-foreground">
                  {nextChangeText}
                </div>
              )}

              {/* Horaires */}
              {formattedHours.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto font-medium text-sm hover:bg-transparent"
                    onClick={() => setShowFullHours(!showFullHours)}
                  >
                    Horaires d&apos;ouverture
                    {showFullHours ? (
                      <ChevronUp className="w-3 h-3 ml-1" />
                    ) : (
                      <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>

                  <AnimatePresence>
                    {showFullHours && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 text-xs">
                          {formattedHours.map((day) => (
                            <div
                              key={day.dayKey}
                              className={cn(
                                "flex justify-between",
                                day.isToday
                                  ? "font-medium text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              <span>{day.day}</span>
                              <span>{day.slots}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <Separator />

              {/* Adresse */}
              <div className="space-y-2">
                <div className="flex items-start text-sm">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{fullAddress}</span>
                </div>

                {/* Contact - Boutons principaux */}
                {(place.phone || place.email || place.website) && (
                  <div className="grid grid-cols-1 gap-2">
                    {place.phone && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="justify-start"
                      >
                        <a href={`tel:${place.phone}`}>
                          <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                          Appeler
                        </a>
                      </Button>
                    )}

                    {place.email && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="justify-start"
                      >
                        <a href={`mailto:${place.email}`}>
                          <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                          Email
                        </a>
                      </Button>
                    )}

                    {place.website && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="justify-start"
                      >
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                          Site web
                          <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* Réseaux sociaux */}
                {(place.facebook || place.instagram || place.twitter || place.linkedin || place.tiktok) && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Réseaux sociaux
                    </div>
                    <div className="flex items-center gap-2">
                      {place.facebook && (
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          className="w-8 h-8"
                        >
                          <a
                            href={place.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Facebook"
                          >
                            <Facebook className="w-4 h-4" />
                          </a>
                        </Button>
                      )}

                      {place.instagram && (
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          className="w-8 h-8"
                        >
                          <a
                            href={place.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Instagram"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        </Button>
                      )}

                      {place.twitter && (
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          className="w-8 h-8"
                        >
                          <a
                            href={place.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Twitter"
                          >
                            <Twitter className="w-4 h-4" />
                          </a>
                        </Button>
                      )}

                      {place.linkedin && (
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          className="w-8 h-8"
                        >
                          <a
                            href={place.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="LinkedIn"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        </Button>
                      )}

                      {place.tiktok && (
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          className="w-8 h-8"
                        >
                          <a
                            href={place.tiktok}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="TikTok"
                          >
                            <span className="text-sm font-bold">TT</span>
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Actions */}
            <div className="border-t p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button asChild className="flex-1">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Itinéraire
                  </a>
                </Button>

                <Button variant="outline" asChild className="flex-1">
                  <Link href={`/places/${place.slug}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir la fiche
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
