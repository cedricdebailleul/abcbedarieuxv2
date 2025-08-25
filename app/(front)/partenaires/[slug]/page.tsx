import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PartnersSection } from "@/components/partners/partners-section";
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Building2,
  Users,
  Award,
  TrendingUp,
  Handshake,
  Package,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PartnerPageProps {
  params: {
    slug: string;
  };
}

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
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

const partnerTypeLabels = {
  COMMERCIAL: "Partenaire Commercial",
  INSTITUTIONAL: "Partenaire Institutionnel",
  MEDIA: "Partenaire Média",
  TECHNICAL: "Partenaire Technique", 
  SPONSOR: "Sponsor",
  SUPPLIER: "Fournisseur",
  OTHER: "Autre Partenaire",
};

const partnerTypeColors = {
  COMMERCIAL: "bg-blue-100 text-blue-800 border-blue-200",
  INSTITUTIONAL: "bg-purple-100 text-purple-800 border-purple-200",
  MEDIA: "bg-orange-100 text-orange-800 border-orange-200",
  TECHNICAL: "bg-green-100 text-green-800 border-green-200",
  SPONSOR: "bg-yellow-100 text-yellow-800 border-yellow-200",
  SUPPLIER: "bg-gray-100 text-gray-800 border-gray-200",
  OTHER: "bg-slate-100 text-slate-800 border-slate-200",
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

async function getPartner(slug: string): Promise<{ partner: Partner; similarPartners: Partner[] } | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/partners/${slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching partner:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PartnerPageProps): Promise<Metadata> {
  const data = await getPartner(params.slug);

  if (!data) {
    return {
      title: "Partenaire non trouvé - ABC Bédarieux",
    };
  }

  const { partner } = data;

  return {
    title: `${partner.name} - Partenaire ABC Bédarieux`,
    description: partner.description || `Découvrez ${partner.name}, ${partnerTypeLabels[partner.partnerType as keyof typeof partnerTypeLabels]} d'ABC Bédarieux`,
    openGraph: {
      title: `${partner.name} - Partenaire ABC Bédarieux`,
      description: partner.description,
      images: partner.logo ? [{ url: partner.logo }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${partner.name} - Partenaire ABC Bédarieux`,
      description: partner.description,
      images: partner.logo ? [partner.logo] : undefined,
    },
  };
}

export default async function PartnerPage({ params }: PartnerPageProps) {
  const data = await getPartner(params.slug);

  if (!data) {
    notFound();
  }

  const { partner, similarPartners } = data;
  const TypeIcon = partnerTypeIcons[partner.partnerType as keyof typeof partnerTypeIcons];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header avec navigation */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/partenaires">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux partenaires
              </Link>
            </Button>
            <div className="flex items-center text-sm text-muted-foreground">
              <Link
                href="/partenaires"
                className="hover:text-primary transition-colors"
              >
                Partenaires
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{partner.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              {partner.logo ? (
                <div className="w-32 h-32 relative rounded-2xl overflow-hidden bg-white border-2 border-gray-100 shadow-sm">
                  <Image
                    src={partner.logo}
                    alt={`Logo ${partner.name}`}
                    fill
                    className="object-contain p-4"
                    sizes="128px"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-muted rounded-2xl flex items-center justify-center border-2 border-gray-100">
                  <TypeIcon className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Informations principales */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge
                  variant="outline"
                  className={`${partnerTypeColors[partner.partnerType as keyof typeof partnerTypeColors]} font-medium`}
                >
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {partnerTypeLabels[partner.partnerType as keyof typeof partnerTypeLabels]}
                </Badge>
                
                {partner.isFeatured && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Partenaire privilégié
                  </Badge>
                )}

                {partner.category && (
                  <Badge variant="secondary">
                    {partner.category}
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                {partner.name}
              </h1>

              {partner.description && (
                <p className="text-xl text-gray-600 leading-relaxed mb-6">
                  {partner.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {partner.website && (
                  <Button asChild>
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visiter le site web
                    </a>
                  </Button>
                )}

                {partner.email && (
                  <Button variant="outline" asChild>
                    <a href={`mailto:${partner.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer un email
                    </a>
                  </Button>
                )}

                {partner.phone && (
                  <Button variant="outline" asChild>
                    <a href={`tel:${partner.phone}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Informations détaillées */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informations de contact */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Informations de contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {partner.website && (
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Site web</p>
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {partner.website}
                      </a>
                    </div>
                  </div>
                )}

                {partner.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a
                        href={`mailto:${partner.email}`}
                        className="text-primary hover:underline"
                      >
                        {partner.email}
                      </a>
                    </div>
                  </div>
                )}

                {partner.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <a
                        href={`tel:${partner.phone}`}
                        className="text-primary hover:underline"
                      >
                        {partner.phone}
                      </a>
                    </div>
                  </div>
                )}

                {!partner.website && !partner.email && !partner.phone && (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune information de contact publique disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Métadonnées */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-1">
                    Type de partenariat
                  </p>
                  <p className="text-sm">
                    {partnerTypeLabels[partner.partnerType as keyof typeof partnerTypeLabels]}
                  </p>
                </div>

                {partner.category && (
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">
                      Catégorie
                    </p>
                    <p className="text-sm">{partner.category}</p>
                  </div>
                )}

                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-1">
                    Partenaire depuis
                  </p>
                  <p className="text-sm">{formatDate(partner.createdAt)}</p>
                </div>

                {partner.startDate && (
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">
                      Début du partenariat
                    </p>
                    <p className="text-sm">{formatDate(partner.startDate)}</p>
                  </div>
                )}

                {partner.endDate && (
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">
                      Fin du partenariat
                    </p>
                    <p className="text-sm">{formatDate(partner.endDate)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partenaires similaires */}
      {similarPartners.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <Separator className="mb-12" />
            <PartnersSection
              title="Partenaires similaires"
              subtitle={`Découvrez d'autres ${partnerTypeLabels[partner.partnerType as keyof typeof partnerTypeLabels].toLowerCase()}s`}
              type={partner.partnerType}
              limit={6}
              size="md"
              className="mt-0"
            />
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Vous aussi, rejoignez nos partenaires
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Découvrez les avantages d&apos;un partenariat avec ABC Bédarieux et développez votre activité localement.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/contact">
                <Handshake className="w-5 h-5 mr-2" />
                Devenir partenaire
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/partenaires">
                Voir tous les partenaires
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}