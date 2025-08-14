import {
  Award,
  CalendarDays,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Trophy,
  Twitter,
  User,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper functions
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
  }).format(date);
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const user = await prisma.user.findFirst({
    where: { slug, profile: { isPublic: true } },
    select: {
      name: true,
      profile: {
        select: {
          firstname: true,
          lastname: true,
          bio: true,
        },
      },
    },
  });

  if (!user) {
    return {
      title: "Profil introuvable",
    };
  }

  const displayName =
    user.profile?.firstname && user.profile?.lastname
      ? `${user.profile.firstname} ${user.profile.lastname}`
      : user.name;

  return {
    title: `Profil de ${displayName}`,
    description:
      user.profile?.bio ||
      `Découvrez le profil de ${displayName} sur ABC Bédarieux`,
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { slug } = await params;

  const user = await prisma.user.findFirst({
    where: {
      slug,
      profile: { isPublic: true },
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      profile: {
        select: {
          firstname: true,
          lastname: true,
          bio: true,
          phone: true,
          address: true,
          socials: true,
          showEmail: true,
          showPhone: true,
        },
      },
      badges: {
        select: {
          id: true,
          earnedAt: true,
          reason: true,
          isVisible: true,
          badge: {
            select: {
              id: true,
              title: true,
              description: true,
              iconUrl: true,
              color: true,
              category: true,
              rarity: true,
            },
          },
        },
        where: { isVisible: true },
        orderBy: { earnedAt: "desc" },
      },
      places: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          city: true,
          status: true,
          isActive: true,
        },
        where: {
          status: "ACTIVE",
          isActive: true,
        },
      },
      _count: {
        select: {
          places: { where: { status: "ACTIVE", isActive: true } },
          reviews: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const displayName =
    user.profile?.firstname && user.profile?.lastname
      ? `${user.profile.firstname} ${user.profile.lastname}`
      : user.name;

  const socials = parseSocials(user.profile?.socials);
  const hasSocials = Object.keys(socials).some((key) => socials[key]);

  const badgesByCategory = user.badges.reduce((acc, userBadge) => {
    const category = userBadge.badge.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(userBadge);
    return acc;
  }, {} as Record<string, typeof user.badges>);

  const rarityOrder = ["LEGENDARY", "EPIC", "RARE", "UNCOMMON", "COMMON"];
  const rarityColors = {
    LEGENDARY: "bg-gradient-to-r from-yellow-400 to-orange-500",
    EPIC: "bg-gradient-to-r from-purple-500 to-pink-500",
    RARE: "bg-gradient-to-r from-blue-500 to-cyan-500",
    UNCOMMON: "bg-gradient-to-r from-green-500 to-emerald-500",
    COMMON: "bg-gradient-to-r from-gray-400 to-gray-500",
  };

  const rarityLabels = {
    LEGENDARY: "Légendaire",
    EPIC: "Épique",
    RARE: "Rare",
    UNCOMMON: "Peu commune",
    COMMON: "Commune",
  };

  const categoryLabels = {
    GENERAL: "Général",
    ACHIEVEMENT: "Accomplissement",
    PARTICIPATION: "Participation",
    SPECIAL: "Spécial",
    ANNIVERSARY: "Anniversaire",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex-shrink-0">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={`Avatar de ${displayName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {displayName}
                </h1>

                {user.profile?.bio && (
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {user.profile.bio}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    Membre depuis {formatDate(user.createdAt)}
                  </div>

                  {user._count.places > 0 && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {user._count.places} lieu
                      {user._count.places > 1 ? "x" : ""}
                    </div>
                  )}

                  {user.badges.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {user.badges.length} badge
                      {user.badges.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Badges */}
          {user.badges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Badges ({user.badges.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(badgesByCategory).map(([category, badges]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                      {categoryLabels[
                        category as keyof typeof categoryLabels
                      ] || category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {badges
                        .sort(
                          (a, b) =>
                            rarityOrder.indexOf(a.badge.rarity) -
                            rarityOrder.indexOf(b.badge.rarity)
                        )
                        .map((userBadge) => (
                          <div
                            key={userBadge.id}
                            className="relative p-4 rounded-lg border bg-card"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                                  rarityColors[userBadge.badge.rarity]
                                } shadow-lg`}
                              >
                                <Trophy className="w-7 h-7" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground">
                                  {userBadge.badge.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {userBadge.badge.description}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                      borderColor:
                                        userBadge.badge.color ?? "transparent",
                                      color: userBadge.badge.color ?? undefined,
                                    }}
                                  >
                                    {
                                      rarityLabels[
                                        userBadge.badge
                                          .rarity as keyof typeof rarityLabels
                                      ]
                                    }
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(userBadge.earnedAt)}
                                  </span>
                                </div>
                                {userBadge.reason && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    {userBadge.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Lieux */}
          {user.places.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Lieux ({user.places.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.places.map((place) => (
                    <div
                      key={place.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div>
                        <h4 className="font-medium text-foreground">
                          {place.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{place.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {place.city}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/places/${place.slug}`}>Voir</a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          {(user.profile?.showEmail || user.profile?.showPhone) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.profile.showEmail && user.email && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={`mailto:${user.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer un email
                    </a>
                  </Button>
                )}

                {user.profile.showPhone && user.profile.phone && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={`tel:${user.profile.phone}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Réseaux sociaux */}
          {hasSocials && (
            <Card>
              <CardHeader>
                <CardTitle>Réseaux sociaux</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
