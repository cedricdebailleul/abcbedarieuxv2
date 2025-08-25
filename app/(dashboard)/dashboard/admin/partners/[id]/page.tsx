import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, ExternalLink, Calendar, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PageProps {
  params: {
    id: string;
  };
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

const partnerTypeColors = {
  COMMERCIAL: "bg-blue-100 text-blue-800",
  INSTITUTIONAL: "bg-purple-100 text-purple-800",
  MEDIA: "bg-orange-100 text-orange-800",
  TECHNICAL: "bg-green-100 text-green-800",
  SPONSOR: "bg-yellow-100 text-yellow-800",
  SUPPLIER: "bg-gray-100 text-gray-800",
  OTHER: "bg-slate-100 text-slate-800",
};

export async function generateMetadata({ params }: PageProps) {
  const partner = await prisma.partner.findUnique({
    where: { id: params.id },
  });

  if (!partner) {
    return {
      title: "Partenaire non trouvé",
    };
  }

  return {
    title: `${partner.name} - Admin`,
    description: partner.description || `Détails du partenaire ${partner.name}`,
  };
}

export default async function PartnerDetailPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "moderator")) {
    redirect("/dashboard");
  }

  const partner = await prisma.partner.findUnique({
    where: { id: params.id },
  });

  if (!partner) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin/partners">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{partner.name}</h1>
            <p className="text-muted-foreground">
              Détails du partenaire
            </p>
          </div>
        </div>
        {session.user.role === "admin" && (
          <Button asChild>
            <Link href={`/dashboard/admin/partners/${partner.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {partner.logo ? (
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {partner.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{partner.name}</h2>
                  <p className="text-muted-foreground">/{partner.slug}</p>
                </div>
              </div>

              {partner.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {partner.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Type</h3>
                  <Badge
                    variant="secondary"
                    className={partnerTypeColors[partner.partnerType as keyof typeof partnerTypeColors]}
                  >
                    {partnerTypeLabels[partner.partnerType as keyof typeof partnerTypeLabels]}
                  </Badge>
                </div>

                {partner.category && (
                  <div>
                    <h3 className="font-semibold mb-2">Catégorie</h3>
                    <p className="text-muted-foreground">{partner.category}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Priorité</h3>
                  <Badge variant="outline">{partner.priority}</Badge>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Statut</h3>
                  <div className="flex gap-2">
                    <Badge
                      variant={partner.isActive ? "default" : "secondary"}
                      className={
                        partner.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {partner.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    {partner.isFeatured && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Mis en avant
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact et liens */}
          <Card>
            <CardHeader>
              <CardTitle>Contact et liens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partner.website && (
                  <div>
                    <h3 className="font-semibold mb-2">Site web</h3>
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {partner.website}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}

                {partner.email && (
                  <div>
                    <h3 className="font-semibold mb-2">Email</h3>
                    <a
                      href={`mailto:${partner.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {partner.email}
                    </a>
                  </div>
                )}

                {partner.phone && (
                  <div>
                    <h3 className="font-semibold mb-2">Téléphone</h3>
                    <a
                      href={`tel:${partner.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {partner.phone}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          {(partner.startDate || partner.endDate) && (
            <Card>
              <CardHeader>
                <CardTitle>Dates du partenariat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partner.startDate && (
                    <div>
                      <h3 className="font-semibold mb-2">Date de début</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(partner.startDate)}
                      </div>
                    </div>
                  )}

                  {partner.endDate && (
                    <div>
                      <h3 className="font-semibold mb-2">Date de fin</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(partner.endDate)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Métadonnées */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métadonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Créé le</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(partner.createdAt)}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Dernière modification</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(partner.updatedAt)}
                </div>
              </div>

              {partner.createdBy && (
                <div>
                  <h3 className="font-semibold mb-2">Créé par</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    {partner.createdBy}
                  </div>
                </div>
              )}

              {partner.updatedBy && (
                <div>
                  <h3 className="font-semibold mb-2">Modifié par</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    {partner.updatedBy}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}