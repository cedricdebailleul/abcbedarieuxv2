"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Edit, 
  Send, 
  Calendar, 
  Users,
  BarChart3,
  Mail,
  Copy,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  scheduledAt?: string;
  includedEvents: string[];
  includedPlaces: string[];
  includedPosts: string[];
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalUnsubscribed: number;
  createdBy: {
    name: string;
    email: string;
  };
}

interface CampaignDetailsProps {
  params: { id: string };
}

export default function CampaignDetailsPage({ params }: CampaignDetailsProps) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/newsletter/campaigns/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setCampaign(data.campaign);
      } else {
        toast.error("Campagne introuvable");
        router.push("/dashboard/admin/newsletter/campaigns");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement de la campagne");
      router.push("/dashboard/admin/newsletter/campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  const handleSendNow = async () => {
    if (!confirm("Êtes-vous sûr de vouloir envoyer cette campagne maintenant ?")) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/newsletter/campaigns/${params.id}/send`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Campagne envoyée avec succès");
        fetchCampaign();
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/newsletter/campaigns/${params.id}/duplicate`, {
        method: "POST",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Campagne dupliquée");
        router.push(`/dashboard/admin/newsletter/campaigns/${data.campaign.id}`);
      }
    } catch (error) {
      toast.error("Erreur lors de la duplication");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette campagne ?")) return;

    try {
      const response = await fetch(`/api/admin/newsletter/campaigns/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Campagne supprimée");
        router.push("/dashboard/admin/newsletter/campaigns");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "NEWSLETTER": return "Newsletter";
      case "ANNOUNCEMENT": return "Annonce";
      case "EVENT_DIGEST": return "Événements";
      case "PLACE_UPDATE": return "Commerces";
      case "PROMOTIONAL": return "Promotion";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement de la campagne...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Campagne introuvable</h2>
        <p className="text-muted-foreground mb-4">
          Cette campagne n'existe pas ou a été supprimée.
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
            <Link href="/dashboard/admin/newsletter/campaigns">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Badge className={getStatusColor(campaign.status)}>
                {getStatusLabel(campaign.status)}
              </Badge>
              <span>•</span>
              <Badge variant="secondary">
                {getTypeLabel(campaign.type)}
              </Badge>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {campaign.status === "DRAFT" && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/admin/newsletter/campaigns/${campaign.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Link>
              </Button>
              <Button onClick={handleSendNow} disabled={actionLoading}>
                <Send className="w-4 h-4 mr-2" />
                Envoyer maintenant
              </Button>
            </>
          )}

          {campaign.status === "SENT" && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/admin/newsletter/campaigns/${campaign.id}/analytics`}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Statistiques
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Aperçu du contenu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Aperçu de la campagne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Objet</label>
                  <div className="mt-1 p-3 bg-muted rounded-lg">
                    {campaign.subject}
                  </div>
                </div>

                {campaign.content && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Message personnalisé</label>
                    <div className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                      {campaign.content}
                    </div>
                  </div>
                )}

                {/* Contenu sélectionné */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">Contenu inclus</label>
                  
                  {campaign.includedEvents.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          {campaign.includedEvents.length} événement(s)
                        </span>
                      </div>
                    </div>
                  )}

                  {campaign.includedPlaces.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          {campaign.includedPlaces.length} commerce(s)
                        </span>
                      </div>
                    </div>
                  )}

                  {campaign.includedPosts.length > 0 && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-purple-800">
                          {campaign.includedPosts.length} article(s)
                        </span>
                      </div>
                    </div>
                  )}

                  {campaign.includedEvents.length === 0 && 
                   campaign.includedPlaces.length === 0 && 
                   campaign.includedPosts.length === 0 && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                      Aucun contenu spécifique sélectionné
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques d'envoi */}
          {campaign.status === "SENT" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Statistiques d'envoi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Envoyés</span>
                      <span className="font-medium">{campaign.totalSent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Livrés</span>
                      <span className="font-medium">{campaign.totalDelivered}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ouverts</span>
                      <span className="font-medium">{campaign.totalOpened}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cliqués</span>
                      <span className="font-medium">{campaign.totalClicked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Désabonnements</span>
                      <span className="font-medium">{campaign.totalUnsubscribed}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Taux de livraison</span>
                      <span className="font-medium">
                        {campaign.totalSent > 0 ? Math.round((campaign.totalDelivered / campaign.totalSent) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux d'ouverture</span>
                      <span className="font-medium">
                        {campaign.totalDelivered > 0 ? Math.round((campaign.totalOpened / campaign.totalDelivered) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux de clic</span>
                      <span className="font-medium">
                        {campaign.totalOpened > 0 ? Math.round((campaign.totalClicked / campaign.totalOpened) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux de désabonnement</span>
                      <span className="font-medium">
                        {campaign.totalSent > 0 ? Math.round((campaign.totalUnsubscribed / campaign.totalSent) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Créé par</label>
                <div className="mt-1">
                  <div className="font-medium">{campaign.createdBy.name}</div>
                  <div className="text-sm text-muted-foreground">{campaign.createdBy.email}</div>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                <div className="mt-1">
                  {new Date(campaign.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
              </div>

              {campaign.scheduledAt && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Programmée pour</label>
                    <div className="mt-1">
                      {new Date(campaign.scheduledAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long", 
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                </>
              )}

              {campaign.sentAt && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Envoyée le</label>
                    <div className="mt-1 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {new Date(campaign.sentAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric", 
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">Destinataires</label>
                <div className="mt-1 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {campaign.totalRecipients} abonné{campaign.totalRecipients > 1 ? "s" : ""}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" onClick={handleDuplicate} disabled={actionLoading}>
                <Copy className="w-4 h-4 mr-2" />
                Dupliquer
              </Button>

              {["DRAFT", "CANCELLED"].includes(campaign.status) && (
                <Button variant="destructive" className="w-full" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}