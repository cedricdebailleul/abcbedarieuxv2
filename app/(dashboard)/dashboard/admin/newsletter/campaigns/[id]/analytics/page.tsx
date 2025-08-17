"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  BarChart3,
  Users,
  Mail,
  MousePointer,
  AlertTriangle,
  TrendingUp,
  Clock,
  Activity,
  Eye,
  Loader,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface CampaignStats {
  campaign: {
    id: string;
    title: string;
    status: string;
    sentAt: string;
  };
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    unsubscribed: number;
    rates: {
      delivery: number;
      open: number;
      click: number;
      failure: number;
    };
  };
  errors: Array<{
    errorMessage: string;
    sentAt: string;
    subscriber: { email: string };
  }>;
  recentActivity: Array<{
    email: string;
    name: string;
    action: string;
    timestamp: string;
  }>;
}

interface CampaignAnalyticsProps {
  params: { id: string };
}

export default function CampaignAnalyticsPage({ params }: CampaignAnalyticsProps) {
  const router = useRouter();
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/newsletter/campaigns/${params.id}/stats`);
      const data = await response.json();

      if (data.success) {
        setStats(data);
      } else {
        toast.error("Erreur lors du chargement des statistiques");
        router.push("/dashboard/admin/newsletter/campaigns");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des statistiques");
      router.push("/dashboard/admin/newsletter/campaigns");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [params.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT": return "bg-green-100 text-green-800";
      case "SENDING": return "bg-orange-100 text-orange-800";
      case "ERROR": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SENT": return "Envoyée";
      case "SENDING": return "En cours d'envoi";
      case "ERROR": return "Erreur";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Statistiques indisponibles</h2>
        <p className="text-muted-foreground mb-4">
          Impossible de charger les statistiques de cette campagne.
        </p>
        <Button asChild>
          <Link href="/dashboard/admin/newsletter/campaigns">
            Retour aux campagnes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/admin/newsletter/campaigns/${params.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{stats.campaign.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge className={getStatusColor(stats.campaign.status)}>
                {getStatusLabel(stats.campaign.status)}
              </Badge>
              {stats.campaign.sentAt && (
                <>
                  <span>•</span>
                  <span>Envoyée le {new Date(stats.campaign.sentAt).toLocaleDateString("fr-FR")}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Envoyés</span>
            </div>
            <div className="text-2xl font-bold">{stats.stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Livrés</span>
            </div>
            <div className="text-2xl font-bold">{stats.stats.delivered}</div>
            <div className="text-xs text-muted-foreground">
              {stats.stats.rates.delivery}% du total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Ouverts</span>
            </div>
            <div className="text-2xl font-bold">{stats.stats.opened}</div>
            <div className="text-xs text-muted-foreground">
              {stats.stats.rates.open}% des livrés
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Cliqués</span>
            </div>
            <div className="text-2xl font-bold">{stats.stats.clicked}</div>
            <div className="text-xs text-muted-foreground">
              {stats.stats.rates.click}% des ouverts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium">Échecs</span>
            </div>
            <div className="text-2xl font-bold">{stats.stats.failed}</div>
            <div className="text-xs text-muted-foreground">
              {stats.stats.rates.failure}% du total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium">Désabonnements</span>
            </div>
            <div className="text-2xl font-bold">{stats.stats.unsubscribed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de performance */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Taux de performance
            </CardTitle>
            <CardDescription>
              Indicateurs clés de votre campagne
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Taux de livraison</span>
                <span>{stats.stats.rates.delivery}%</span>
              </div>
              <Progress value={stats.stats.rates.delivery} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Taux d'ouverture</span>
                <span>{stats.stats.rates.open}%</span>
              </div>
              <Progress value={stats.stats.rates.open} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Taux de clic</span>
                <span>{stats.stats.rates.click}%</span>
              </div>
              <Progress value={stats.stats.rates.click} className="h-2" />
            </div>

            {stats.stats.rates.failure > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Taux d'échec</span>
                  <span className="text-red-600">{stats.stats.rates.failure}%</span>
                </div>
                <Progress value={stats.stats.rates.failure} className="h-2 bg-red-100" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activité récente
            </CardTitle>
            <CardDescription>
              Dernières ouvertures et clics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {activity.action === 'clicked' ? (
                        <MousePointer className="w-3 h-3 text-orange-600" />
                      ) : (
                        <Eye className="w-3 h-3 text-purple-600" />
                      )}
                      <span className="font-medium">{activity.name}</span>
                      <span className="text-muted-foreground">
                        {activity.action === 'clicked' ? 'a cliqué' : 'a ouvert'}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString("fr-FR", {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Aucune activité récente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Erreurs d'envoi */}
      {stats.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Erreurs d'envoi
            </CardTitle>
            <CardDescription>
              Emails qui n'ont pas pu être envoyés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.errors.map((error, index) => (
                <div key={index} className="border-l-4 border-red-200 pl-4 py-2">
                  <div className="font-medium text-sm">{error.subscriber.email}</div>
                  <div className="text-xs text-red-600">{error.errorMessage}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(error.sentAt).toLocaleString("fr-FR")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}