import {
  Building,
  CheckCircle,
  Clock,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  Star,
  Twitter,
  User,
  MapPin} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClaimPlaceButton } from "@/components/claim-place-button";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlaceCategoriesBadges } from "@/components/places/place-categories-badges";
import { FavoriteButton } from "@/components/places/favorite-button";
import { SocialShare } from "@/components/shared/social-share";
import { PlaceSchema } from "@/components/structured-data/place-schema";
import { PrintHeader } from "@/components/print/print-header";
import { PlaceTabs } from "@/components/places/place-tabs";
import { PlaceAboutTab } from "@/components/places/place-about-tab";
import { ContactForm } from "@/components/places/contact-form";
import { PlaceReviewsTab } from "@/components/places/place-reviews-tab";
import { ContactButtons } from "@/components/places/contact-buttons";
import { StickyMobileActions } from "@/components/places/sticky-mobile-actions";
import { PlaceStatus } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { generatePlaceShareData } from "@/lib/share-utils";

// ---------- helpers ----------
const DAY_LABEL: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};
const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

function toArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  try {
    const parsed = JSON.parse(String(val));
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}
function isExternal(url?: string | null) {
  return !!url && /^https?:\/\//i.test(url);
}

function normalizeImagePath(path?: string | null): string | null {
  if (!path) return null;

  // Si c'est une URL externe, retourner tel quel
  if (isExternal(path)) return path;

  // Si c'est un chemin local, s'assurer qu'il commence par "/"
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
}
function timeToMin(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}
function formatHm(t: string) {
  // s'assure de "HH:MM"
  const [h, m] = t.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

function parseSocials(
  socialsJson: string | Record<string, string> | null | undefined
): Record<string, string> {
  if (!socialsJson) return {};
  try {
    if (typeof socialsJson === "string") {
      return JSON.parse(socialsJson);
    }
    return socialsJson || {};
  } catch {
    return {};
  }
}
type Slot = { openTime: string; closeTime: string };
function groupOpeningHours(
  items: Array<{
    dayOfWeek: string;
    isClosed?: boolean;
    openTime: string | null;
    closeTime: string | null;
  }>
) {
  const byDay: Record<string, Slot[]> = {};
  for (const d of DAY_ORDER) byDay[d] = [];
  for (const h of items) {
    // Si isClosed n'est pas défini, considérer ouvert si openTime et closeTime existent
    const isClosed = h.isClosed ?? false;
    if (!isClosed && h.openTime && h.closeTime) {
      byDay[h.dayOfWeek].push({ openTime: h.openTime, closeTime: h.closeTime });
    }
  }
  for (const d of DAY_ORDER) {
    byDay[d].sort((a, b) => a.openTime.localeCompare(b.openTime));
  }
  return byDay;
}
function computeOpenState(
  grouped: Record<string, Slot[]>,
  nowDate = new Date()
) {
  const dow = nowDate.getDay(); // 0=Dim..6=Sam
  const mapIdx: Record<number, (typeof DAY_ORDER)[number]> = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
  };
  const todayKey = mapIdx[dow];
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();
  const todaySlots = grouped[todayKey] || [];

  let open = false;
  let pause = false;
  let nextChange: { type: "close" | "open"; at: string } | null = null;

  // ouvert maintenant ?
  for (const s of todaySlots) {
    const a = timeToMin(s.openTime);
    const b = timeToMin(s.closeTime);
    if (nowMin >= a && nowMin < b) {
      open = true;
      nextChange = { type: "close", at: s.closeTime };
      break;
    }
  }

  if (!open) {
    // pause midi ? => il y a un slot passé ET un slot à venir aujourd’hui
    const hasPast = todaySlots.some((s) => timeToMin(s.closeTime) <= nowMin);
    const nextToday = todaySlots.find((s) => nowMin < timeToMin(s.openTime));
    if (hasPast && nextToday) {
      pause = true;
      nextChange = { type: "open", at: nextToday.openTime };
    } else if (nextToday) {
      nextChange = { type: "open", at: nextToday.openTime };
    } else {
      // prochain jour ouvert
      for (let i = 1; i <= 7; i++) {
        const idx = (dow + i) % 7;
        const dk = mapIdx[idx];
        const slots = grouped[dk] || [];
        if (slots.length > 0) {
          nextChange = {
            type: "open",
            at: `${DAY_LABEL[dk]} ${slots[0].openTime}`,
          };
          break;
        }
      }
    }
  }
  return { open, pause, nextChange, todayKey, todaySlots };
}

// ---------- SEO ----------
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = await prisma.place.findFirst({
    where: { slug, status: PlaceStatus.ACTIVE, isActive: true },
    select: {
      name: true,
      summary: true,
      metaTitle: true,
      metaDescription: true,
      coverImage: true,
      ogImage: true,
      images: true,
      slug: true,
      street: true,
      postalCode: true,
      city: true,
    },
  });
  if (!place)
    return {
      title: "Établissement introuvable",
      robots: { index: false, follow: false },
    };

  const gallery = toArray(place.images);
  const ogImg = place.ogImage || place.coverImage || gallery[0];
  const fullAddress = `${place.street}, ${place.postalCode} ${place.city}`;

  // URL absolue pour l'image
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const absoluteImageUrl = ogImg
    ? ogImg.startsWith("http")
      ? ogImg
      : `${baseUrl}${ogImg}`
    : `${baseUrl}/images/og-place-default.jpg`;

  return {
    title: place.metaTitle || `${place.name} — Établissement à ${place.city}`,
    description:
      place.metaDescription ||
      place.summary ||
      `Découvrez ${place.name}, établissement situé ${fullAddress}.`,
    openGraph: {
      title: place.name,
      description:
        place.summary ||
        place.metaDescription ||
        `Établissement situé ${fullAddress}`,
      url: `${baseUrl}/places/${place.slug}`,
      siteName: "ABC Bédarieux",
      locale: "fr_FR",
      type: "article",
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: `${place.name} - ${place.city}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: place.name,
      description: place.summary || `Établissement situé ${fullAddress}`,
      images: [absoluteImageUrl],
      creator: "@abc_bedarieux",
    },
    // alternates: { canonical: `${baseUrl}/places/${place.slug}` },
  };
}

// ---------- Page ----------
export default async function PlacePage({ params }: PageProps) {
  const { slug } = await params;
  const place = await prisma.place.findFirst({
    where: { slug, status: PlaceStatus.ACTIVE },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
          slug: true,
          profile: {
            select: {
              firstname: true,
              lastname: true,
              bio: true,
              phone: true,
              socials: true,
              isPublic: true,
              showEmail: true,
              showPhone: true,
            },
          },
        },
      },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      googleReviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
      },
      openingHours: { orderBy: { dayOfWeek: "asc" } },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true,
            },
          },
        },
      },
      _count: {
        select: { reviews: true, favorites: true, googleReviews: true },
      },
    },
  });
  if (!place) notFound();

  const gallery = toArray(place.images);
  const cover = normalizeImagePath(place.coverImage || gallery[0]);
  const logo = normalizeImagePath(place.logo);

  const grouped = groupOpeningHours(place.openingHours);
  const { open, pause, nextChange, todayKey } = computeOpenState(grouped);

  const fullAddress = `${place.street} ${place.streetNumber || ""}, ${
    place.postalCode
  } ${place.city}`.trim();
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const mapSrc =
    place.latitude && place.longitude
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${place.latitude},${place.longitude}&zoom=16`
      : `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${encodeURIComponent(
          fullAddress
        )}&zoom=16`;
  const directionsHref =
    place.latitude && place.longitude
      ? `https://www.google.com/maps?daddr=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps?daddr=${encodeURIComponent(fullAddress)}`;

  // Calcul de la note moyenne
  const averageRating =
    place.reviews && place.reviews.length > 0
      ? place.reviews.reduce((acc, review) => acc + (review.rating || 0), 0) /
        place.reviews.length
      : 0;

  const normalizedPlace = {
    ...place,
    images: Array.isArray(place.images)
      ? place.images.filter((img): img is string => typeof img === "string")
      : typeof place.images === "string"
        ? [place.images]
        : [],
  };

  return (
    <div className="relative pb-20 md:pb-0">
      {/* Données structurées pour SEO et réseaux sociaux */}
      <PlaceSchema place={place} />

      {/* En-tête d'impression */}
      <PrintHeader
        title={place.name}
        subtitle={`${place.type} - ${place.city}`}
        date={fullAddress}
      />

      {/* Cover hero section */}
      <div className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[800px] bg-muted z-0">
        {cover ? (
          <SafeImage
            src={cover}
            alt={`Couverture — ${place.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
            fallbackClassName="w-full h-full bg-gradient-to-br from-muted to-muted/50"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Contenu */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header amélioré avec logo, titre et actions */}
        <div className="bg-white rounded-lg shadow-lg border -mt-16 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
            {/* Logo et titre */}
            <div className="flex items-start gap-3 md:gap-4 flex-1 w-full">
              <div className="relative size-16 sm:size-20 md:size-24 rounded-xl md:rounded-2xl overflow-hidden border-2 border-white bg-background shadow-lg flex-shrink-0">
                {logo ? (
                  <SafeImage
                    src={logo}
                    alt={`Logo — ${place.name}`}
                    fill
                    className="object-cover"
                    sizes="112px"
                    fallbackClassName="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Building className="h-12 w-12 text-primary/50" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2 leading-tight">
                  {place.name}
                </h1>

                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                  <Badge variant="outline" className="text-sm">
                    {place.type}
                  </Badge>
                  {place.isFeatured && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800 border-yellow-300"
                    >
                      <Star className="h-3 w-3 mr-1 fill-current" />À la une
                    </Badge>
                  )}
                  {place.isActive && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 border-green-300"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground">
                  <span className="inline-flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="leading-none break-words">
                      {fullAddress}
                    </span>
                  </span>

                  {/* Note moyenne */}
                  {averageRating > 0 && (
                    <span className="inline-flex items-center text-sm">
                      <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                      <span className="leading-none font-medium">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="leading-none text-muted-foreground ml-1">
                        ({place.reviews?.length || 0})
                      </span>
                    </span>
                  )}
                </div>

                {/* Boutons de contact - Masqués sur mobile car dans la sticky bar */}
                <div className="hidden md:flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
                  {place.phone && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${place.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Appeler
                      </a>
                    </Button>
                  )}

                  {place.website && (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Site web
                      </a>
                    </Button>
                  )}

                  <Button asChild size="sm" variant="outline">
                    <a
                      href={directionsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Itinéraire
                    </a>
                  </Button>
                </div>

                {/* Catégories de la place */}
                {place.categories && place.categories.length > 0 && (
                  <div className="mt-4">
                    <PlaceCategoriesBadges
                      categories={place.categories}
                      maxDisplay={5}
                      size="default"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions et statut */}
            <div className="flex flex-col md:items-end gap-3 md:gap-4 w-full md:w-auto order-last md:order-none">
              {/* Boutons d'action */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <SocialShare
                  data={generatePlaceShareData(place)}
                  variant="outline"
                  size="sm"
                  className="hidden md:flex flex-1 md:flex-initial"
                />
                <FavoriteButton
                  placeId={place.id}
                  placeName={place.name}
                  variant="outline"
                  size="sm"
                  className="flex-1 md:flex-initial"
                />
              </div>

              {/* Statut d'ouverture amélioré */}
              <div className="bg-gray-50 border rounded-lg p-3 shadow-sm w-full md:w-auto md:min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      open ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    Statut
                  </span>
                </div>

                <div
                  className={`text-sm font-semibold ${
                    open ? "text-emerald-700" : "text-rose-700"
                  }`}
                  aria-live="polite"
                >
                  {open
                    ? pause
                      ? "En pause bientôt"
                      : "Ouvert maintenant"
                    : pause
                      ? "En pause"
                      : "Fermé"}
                </div>

                {nextChange && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {nextChange.at.includes(" ") ? (
                      // Format avec jour: "Ouvre Mardi à 10:00h"
                      <>
                        {nextChange.type === "close" ? "Ferme" : "Ouvre"}{" "}
                        {nextChange.at.split(" ")[0]} à{" "}
                        {formatHm(nextChange.at.split(" ")[1])}h
                      </>
                    ) : (
                      // Format heure seule: "Ferme à 17:30h"
                      <>
                        {nextChange.type === "close" ? "Ferme à" : "Ouvre à"}{" "}
                        {formatHm(nextChange.at)}h
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 relative z-10">
          {/* Colonne principale avec onglets */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 relative z-10">
            <PlaceTabs
              placeId={place.id}
              placeName={place.name}
              isOwner={!!place.owner}
              placeType={place.type}
              aboutContent={
                <PlaceAboutTab
                  place={{
                    ...normalizedPlace,
                    categories: (place.categories || []).map((c) => c.category),
                  }}
                  gallery={gallery}
                />
              }
              reviewsContent={
                <PlaceReviewsTab
                  placeId={place.id}
                  placeName={place.name}
                  reviews={place.reviews}
                  googleReviews={place.googleReviews.map((review) => {
                    // narrow the shape safely without using `any`
                    const rev = review as unknown as Record<string, unknown>;
                    const authorField = rev["author"];
                    const fallbackName =
                      (rev["authorName"] as string | undefined) ??
                      (rev["author_name"] as string | undefined) ??
                      null;

                    // Ensure we provide a string name for `author` to match GoogleReview type
                    const authorName =
                      typeof authorField === "string"
                        ? authorField
                        : typeof authorField === "object" &&
                            authorField !== null &&
                            "name" in (authorField as object)
                          ? ((authorField as { name?: string | null }).name ??
                            fallbackName ??
                            "")
                          : (fallbackName ?? "");

                    return {
                      ...review,
                      createdAt: review.createdAt.toISOString(),
                      author: authorName,
                    };
                  })}
                />
              }
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6 relative z-10">
            {/* Bouton de revendication pour les places sans propriétaire */}
            {!place.ownerId && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Cette place n&apos;a pas de propriétaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cette fiche a été créée par l&apos;administration et peut
                    être revendiquée. En la revendiquant, vous deviendrez
                    propriétaire et pourrez la gérer.
                  </p>
                  <ClaimPlaceButton
                    placeId={place.id}
                    placeName={place.name}
                    placeSlug={place.slug}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            )}

            {/* Contact */}
            {(place.phone || place.email || place.website) && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactButtons
                    phone={place.phone}
                    email={place.email}
                    website={place.website}
                  />
                </CardContent>
              </Card>
            )}

            {/* Formulaire de contact */}
            {(place.owner?.email || place.email) && (
              <ContactForm
                placeId={place.id}
                placeName={place.name}
                ownerEmail={place.owner?.email || place.email || ""}
              />
            )}

            {/* Horaires + état actuel */}
            {place.openingHours.length > 0 && (
              <Card aria-label="Horaires d'ouverture">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Horaires d&apos;ouverture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div
                    className={`px-3 py-1 rounded-full text-sm inline-block ${
                      open
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                    aria-live="polite"
                  >
                    {open
                      ? pause
                        ? "En pause bientôt"
                        : "Ouvert maintenant"
                      : pause
                        ? "En pause"
                        : "Fermé pour le moment"}
                    {nextChange && (
                      <span className="ml-2 text-foreground/70">
                        •{" "}
                        {nextChange.at.includes(" ") ? (
                          // Format avec jour: "Ouvre Mardi à 10:00h"
                          <>
                            {nextChange.type === "close" ? "Ferme" : "Ouvre"}{" "}
                            {nextChange.at.split(" ")[0]} à{" "}
                            {formatHm(nextChange.at.split(" ")[1])}h
                          </>
                        ) : (
                          // Format heure seule: "Ferme à 17:30h"
                          <>
                            {nextChange.type === "close"
                              ? "Ferme à"
                              : "Ouvre à"}{" "}
                            {formatHm(nextChange.at)}h
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    {DAY_ORDER.map((d) => {
                      const slots = grouped[d];
                      const isToday = d === todayKey;
                      return (
                        <div
                          key={d}
                          className={`flex items-start justify-between gap-3 rounded-md px-2 py-1 ${
                            isToday ? "bg-muted/60" : ""
                          }`}
                        >
                          <span
                            className={`font-medium ${
                              isToday ? "text-foreground" : ""
                            }`}
                          >
                            {DAY_LABEL[d]}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {slots.length === 0
                              ? "Fermé"
                              : slots
                                  .map(
                                    (s) =>
                                      `${formatHm(s.openTime)} – ${formatHm(
                                        s.closeTime
                                      )}`
                                  )
                                  .join("  •  ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Localisation / carte */}
            <Card>
              <CardHeader>
                <CardTitle>Localisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                  <span>{fullAddress}</span>
                </div>
                <div className="overflow-hidden rounded-xl border relative z-0">
                  <iframe
                    title={`Carte — ${place.name}`}
                    src={mapSrc}
                    className="w-full h-56"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <Button asChild className="w-full">
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Itinéraire
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Galerie */}
            {gallery.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Galerie</CardTitle>
                </CardHeader>
                <CardContent>
                  <GalleryLightbox images={gallery} placeName={place.name} />
                </CardContent>
              </Card>
            )}

            {/* Propriétaire */}
            {place.owner?.profile?.isPublic && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Propriétaire
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Nom complet ou nom d'utilisateur */}
                  <div>
                    <h3 className="font-medium text-foreground">
                      {place.owner.profile.firstname &&
                      place.owner.profile.lastname
                        ? `${place.owner.profile.firstname} ${place.owner.profile.lastname}`
                        : place.owner.name}
                    </h3>
                  </div>

                  {/* Bio */}
                  {place.owner.profile.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {place.owner.profile.bio}
                    </p>
                  )}

                  {/* Contact */}
                  {(place.owner.profile.showEmail ||
                    place.owner.profile.showPhone) && (
                    <div className="space-y-2">
                      {place.owner.profile.showEmail && place.owner.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          asChild
                        >
                          <a href={`mailto:${place.owner.email}`}>
                            <Mail className="w-4 h-4 mr-2" />
                            Contacter par email
                          </a>
                        </Button>
                      )}

                      {place.owner.profile.showPhone &&
                        place.owner.profile.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            asChild
                          >
                            <a href={`tel:${place.owner.profile.phone}`}>
                              <Phone className="w-4 h-4 mr-2" />
                              Appeler
                            </a>
                          </Button>
                        )}
                    </div>
                  )}

                  {/* Lien vers fiche complète */}
                  {place.owner.slug && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href={`/profil/${place.owner.slug}`}>
                        <User className="w-4 h-4 mr-2" />
                        Voir la fiche complète
                      </a>
                    </Button>
                  )}

                  {/* Réseaux sociaux du propriétaire */}
                  {(() => {
                    const socials = parseSocials(
                      typeof place.owner.profile.socials === "string" ||
                        (typeof place.owner.profile.socials === "object" &&
                          !Array.isArray(place.owner.profile.socials) &&
                          place.owner.profile.socials !== null)
                        ? (place.owner.profile.socials as Record<
                            string,
                            string
                          >)
                        : null
                    );
                    const hasSocials = Object.keys(socials).some(
                      (key) => socials[key]
                    );

                    if (!hasSocials) return null;

                    return (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-foreground">
                            Réseaux sociaux
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {socials.facebook && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={socials.facebook}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 justify-center"
                                >
                                  <Facebook className="w-4 h-4" />
                                </a>
                              </Button>
                            )}

                            {socials.instagram && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={socials.instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 justify-center"
                                >
                                  <Instagram className="w-4 h-4" />
                                </a>
                              </Button>
                            )}

                            {socials.twitter && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={socials.twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 justify-center"
                                >
                                  <Twitter className="w-4 h-4" />
                                </a>
                              </Button>
                            )}

                            {socials.linkedin && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={socials.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 justify-center"
                                >
                                  <Linkedin className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Réseaux sociaux */}
            {(place.facebook ||
              place.instagram ||
              place.twitter ||
              place.linkedin) && (
              <Card>
                <CardHeader>
                  <CardTitle>Réseaux sociaux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {place.facebook && (
                    <a
                      href={place.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <Facebook className="w-4 h-4 mr-2" /> Facebook
                    </a>
                  )}
                  {place.instagram && (
                    <a
                      href={place.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <Instagram className="w-4 h-4 mr-2" /> Instagram
                    </a>
                  )}
                  {place.twitter && (
                    <a
                      href={place.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <Twitter className="w-4 h-4 mr-2" /> Twitter
                    </a>
                  )}
                  {place.linkedin && (
                    <a
                      href={place.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <StickyMobileActions
        phone={place.phone}
        website={place.website}
        directionsUrl={directionsHref}
        placeName={place.name}
        shareData={{
          title: place.name,
          text: place.summary || `Découvrez ${place.name} à ${place.city}`,
          url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/places/${place.slug}`,
        }}
      />
    </div>
  );
}
