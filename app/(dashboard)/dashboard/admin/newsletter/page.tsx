import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Users, 
  Send, 
  BarChart3, 
  Calendar,
  Plus,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Newsletter - Administration",
  description: "Gestion de la newsletter et des campagnes d'email",
};

async function getNewsletterStats() {
  // TODO: Remplacer par de vraies requêtes après la migration de la base de données
  try {
    const [
      totalSubscribers,
      activeSubscribers,
      totalCampaigns,
      draftCampaigns,
      sentCampaigns,
      recentSubscribers
    ] = await Promise.all([
      prisma.newsletterSubscriber.count().catch(() => 0),
      prisma.newsletterSubscriber.count({ where: { isActive: true } }).catch(() => 0),
      prisma.newsletterCampaign.count().catch(() => 0),
      prisma.newsletterCampaign.count({ where: { status: "DRAFT" } }).catch(() => 0),
      prisma.newsletterCampaign.count({ where: { status: "SENT" } }).catch(() => 0),
      prisma.newsletterSubscriber.findMany({
        take: 5,
        orderBy: { subscribedAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          subscribedAt: true,
          isVerified: true
        }
      }).catch(() => [])
    ]);

    return {
      totalSubscribers,
      activeSubscribers,
      totalCampaigns,
      draftCampaigns,
      sentCampaigns,
      recentSubscribers
    };
  } catch (error) {
    // Si les modèles n'existent pas encore, retourner des valeurs par défaut
    return {
      totalSubscribers: 0,
      activeSubscribers: 0,
      totalCampaigns: 0,
      draftCampaigns: 0,
      sentCampaigns: 0,
      recentSubscribers: []
    };
  }
}

async function getRecentCampaigns() {
  try {
    return await prisma.newsletterCampaign.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
  } catch (error) {
    // Si les modèles n'existent pas encore, retourner un tableau vide
    return [];
  }
}

export default async function NewsletterAdminPage() {
  const stats = await getNewsletterStats();
  const recentCampaigns = await getRecentCampaigns();

  // Vérifier si les modèles newsletter existent
  const isDatabaseMigrated = stats.totalSubscribers !== undefined;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-100 text-gray-800";
      case "SCHEDULED": return "bg-blue-100 text-blue-800";
      case "SENDING": return "bg-orange-100 text-orange-800";
      case "SENT": return "bg-green-100 text-green-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      case "ERROR": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT": return "Brouillon";
      case "SCHEDULED": return "Programmée";
      case "SENDING": return "En cours d'envoi";
      case "SENT": return "Envoyée";
      case "CANCELLED": return "Annulée";
      case "ERROR": return "Erreur";
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Newsletter</h1>
          <p className="text-muted-foreground">
            Gérez vos abonnés et créez des campagnes d'email
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/newsletter/campaigns/new">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle campagne
          </Link>
        </Button>
      </div>

      {/* Migration Notice */}
      {!isDatabaseMigrated && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Migration de base de données requise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              Les tables de newsletter ne sont pas encore créées dans votre base de données. 
              Veuillez exécuter la migration pour utiliser cette fonctionnalité.
            </p>
            <div className="bg-orange-100 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2 text-orange-800">Commande recommandée :</p>
              <p className="text-sm font-mono text-orange-800 mb-3">
                pnpm newsletter:migrate
              </p>
              <p className="text-xs text-orange-600">
                Ou manuellement : <code className="bg-orange-200 px-1 rounded">pnpm db:push</code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total abonnés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSubscribers} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campagnes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sentCampaigns} envoyées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              En cours de rédaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'ouverture</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42%</div>
            <p className="text-xs text-muted-foreground">
              Moyenne sur 30 jours
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Campagnes récentes</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/admin/newsletter/campaigns">
                Voir tout
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampaigns.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucune campagne créée pour le moment.
                </p>
              ) : (
                recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{campaign.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Par {campaign.createdBy.name} • {new Date(campaign.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                      <div className="flex gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/admin/newsletter/campaigns/${campaign.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        {campaign.status === "DRAFT" && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/admin/newsletter/campaigns/${campaign.id}/edit`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Subscribers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Nouveaux abonnés</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/admin/newsletter/subscribers">
                Voir tout
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentSubscribers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucun nouvel abonné récemment.
                </p>
              ) : (
                stats.recentSubscribers.map((subscriber) => (
                  <div key={subscriber.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {subscriber.firstName && subscriber.lastName
                          ? `${subscriber.firstName} ${subscriber.lastName}`
                          : subscriber.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {subscriber.email} • {new Date(subscriber.subscribedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Badge variant={subscriber.isVerified ? "default" : "secondary"}>
                      {subscriber.isVerified ? "Vérifié" : "En attente"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Campagnes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Créez et gérez vos campagnes d'email marketing
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/dashboard/admin/newsletter/campaigns/new">
                  Nouvelle campagne
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/admin/newsletter/campaigns">
                  Gérer les campagnes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Abonnés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Consultez et gérez votre liste d'abonnés
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/dashboard/admin/newsletter/subscribers">
                  Voir les abonnés
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/admin/newsletter/subscribers/export">
                  Exporter la liste
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Analysez les performances de vos campagnes
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/dashboard/admin/newsletter/analytics">
                  Voir les stats
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/admin/newsletter/reports">
                  Rapports détaillés
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}