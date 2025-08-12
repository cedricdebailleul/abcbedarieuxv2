import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlaceStatus } from "@/lib/generated/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { SafeImage } from "@/components/safe-image";
import GoogleReviews from "@/components/google-reviews";
import { ClaimPlaceButton } from "@/components/claim-place-button";
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
  Linkedin,
  User,
} from "lucide-react";

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
    return "/" + path;
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

function parseSocials(socialsJson: any): Record<string, string> {
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
    isClosed: boolean;
    openTime: string | null;
    closeTime: string | null;
  }>
) {
  const byDay: Record<string, Slot[]> = {};
  for (const d of DAY_ORDER) byDay[d] = [];
  for (const h of items) {
    if (!h.isClosed && h.openTime && h.closeTime) {
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
type PageProps = { params: { slug: string } };

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
    },
  });
  if (!place)
    return {
      title: "Établissement introuvable",
      robots: { index: false, follow: false },
    };

  const gallery = toArray(place.images);
  const ogImg = place.ogImage || place.coverImage || gallery[0] || undefined;

  return {
    title: place.metaTitle || `${place.name} — Établissement`,
    description:
      place.metaDescription || place.summary || `Découvrez ${place.name}.`,
    openGraph: {
      title: place.name,
      description:
        place.summary || place.metaDescription || `Découvrez ${place.name}.`,
      images: ogImg ? [ogImg] : [],
      type: "article",
    },
    // alternates: { canonical: `https://ton-domaine.com/places/${place.slug}` },
  };
}

// ---------- Page ----------
export default async function PlacePage({ params }: PageProps) {
  const { slug } = await params;
  const place = await prisma.place.findFirst({
    where: { slug, status: PlaceStatus.ACTIVE, isActive: true },
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
  const mapSrc =
    place.latitude && place.longitude
      ? `https://www.google.com/maps?q=${place.latitude},${place.longitude}&z=16&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(
          fullAddress
        )}&z=16&output=embed`;
  const directionsHref =
    place.latitude && place.longitude
      ? `https://www.google.com/maps?daddr=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps?daddr=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="relative">
      {/* Cover full-bleed sous le header */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="relative h-[80vh] bg-muted">
          {cover ? (
            <SafeImage
              src={cover}
              alt={`Couverture — ${place.name}`}
              fill
              className="object-cover"
              sizes="80vw"
              fallbackClassName="w-full h-full bg-gradient-to-br from-muted to-muted/50"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto">
        {/* Titre + logo + meta */}
        <div className="w-full flex flex-col gap-4 bg-white mx-auto px-8">
          <div className="flex items-end gap-4">
            <div className="relative size-20 -mt-12 md:size-24 rounded-2xl overflow-hidden border bg-background shadow">
              {logo ? (
                <SafeImage
                  src={logo}
                  alt={`Logo — ${place.name}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                  fallbackClassName="w-full h-full bg-muted"
                />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {place.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                <Badge variant="outline">{place.type}</Badge>
                {place.isFeatured && (
                  <Badge variant="secondary">À la une</Badge>
                )}
                <span className="inline-flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="leading-none">{fullAddress}</span>
                </span>
              </div>
            </div>

            {/* Statut ouverture */}
            <div className="hidden md:flex flex-col items-end">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
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
              </div>
              {nextChange && (
                <span className="text-xs text-muted-foreground mt-1">
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
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <p className="text-foreground/90 font-medium">
                      {place.summary}
                    </p>
                  )}
                  {place.description && (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {place.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Avis */}
            {place.reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Avis clients
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {place.reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{review.user.name}</span>
                        {typeof review.rating === "number" && (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span>{review.rating}/5</span>
                          </div>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                      <Separator />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Avis Google */}
            <GoogleReviews
              reviews={place.googleReviews.map((review) => ({
                ...review,
                createdAt: review.createdAt.toISOString(),
              }))}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bouton de revendication pour les places sans propriétaire */}
            {!place.ownerId && (
              <Card>
                <CardHeader>
                  <CardTitle>Cette place n'a pas de propriétaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cette fiche a été créée par l'administration et peut être
                    revendiquée. En la revendiquant, vous deviendrez
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
                <CardContent className="space-y-3">
                  {place.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                      <a
                        href={`tel:${place.phone}`}
                        className="text-primary hover:underline"
                      >
                        {place.phone}
                      </a>
                    </div>
                  )}
                  {place.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
                      <a
                        href={`mailto:${place.email}`}
                        className="text-primary hover:underline"
                      >
                        {place.email}
                      </a>
                    </div>
                  )}
                  {place.website && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-3 text-muted-foreground" />
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center"
                      >
                        Site web <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Horaires + état actuel */}
            {place.openingHours.length > 0 && (
              <Card aria-label="Horaires d'ouverture">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Horaires d'ouverture
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
                <div className="overflow-hidden rounded-xl border">
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
            {place.owner &&
              place.owner.profile &&
              place.owner.profile.isPublic && (
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
                      const socials = parseSocials(place.owner.profile.socials);
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
    </div>
  );
}
