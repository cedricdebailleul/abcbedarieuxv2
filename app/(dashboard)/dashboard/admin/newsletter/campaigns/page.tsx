"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Send,
  Calendar,
  Users,
  BarChart3,
  Filter
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Campaign {
  id: string;
  title: string;
  subject: string;
  type: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  scheduledAt?: string;
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  createdBy: {
    name: string;
    email: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Filtres
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const response = await fetch(`/api/admin/newsletter/campaigns?${params}`);
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.campaigns);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des campagnes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchCampaigns, search ? 500 : 0);
    return () => clearTimeout(timeout);
  }, [search, statusFilter, typeFilter, pagination.page]);

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette campagne ?")) return;

    try {
      const response = await fetch(`/api/admin/newsletter/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Campagne supprimée");
        fetchCampaigns();
      } else {
        toast.error("Erreur lors de la suppression");
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
      case "SENDING": return "En cours";
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campagnes Newsletter</h1>
          <p className="text-muted-foreground">
            Gérez toutes vos campagnes d'email marketing
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/newsletter/campaigns/new">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle campagne
          </Link>
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une campagne..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="DRAFT">Brouillons</SelectItem>
                <SelectItem value="SCHEDULED">Programmées</SelectItem>
                <SelectItem value="SENT">Envoyées</SelectItem>
                <SelectItem value="CANCELLED">Annulées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="NEWSLETTER">Newsletter</SelectItem>
                <SelectItem value="ANNOUNCEMENT">Annonce</SelectItem>
                <SelectItem value="EVENT_DIGEST">Événements</SelectItem>
                <SelectItem value="PLACE_UPDATE">Commerces</SelectItem>
                <SelectItem value="PROMOTIONAL">Promotion</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchCampaigns}>
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des campagnes */}
      <Card>
        <CardHeader>
          <CardTitle>
            {pagination.totalCount} campagne{pagination.totalCount > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune campagne trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campagne</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Destinataires</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {campaign.subject}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Par {campaign.createdBy.name}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="secondary">
                        {getTypeLabel(campaign.type)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {campaign.totalRecipients}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {campaign.status === "SENT" && (
                        <div className="text-sm">
                          <div>Envoyés: {campaign.totalSent}</div>
                          <div>Ouverts: {campaign.totalOpened}</div>
                          <div className="text-xs text-muted-foreground">
                            Taux: {campaign.totalSent > 0 ? Math.round((campaign.totalOpened / campaign.totalSent) * 100) : 0}%
                          </div>
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {campaign.sentAt && (
                          <div>✅ {new Date(campaign.sentAt).toLocaleDateString("fr-FR")}</div>
                        )}
                        {campaign.scheduledAt && campaign.status === "SCHEDULED" && (
                          <div>📅 {new Date(campaign.scheduledAt).toLocaleDateString("fr-FR")}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Créée le {new Date(campaign.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/admin/newsletter/campaigns/${campaign.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir
                            </Link>
                          </DropdownMenuItem>
                          
                          {campaign.status === "DRAFT" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/admin/newsletter/campaigns/${campaign.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                          )}
                          
                          {campaign.status === "SENT" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/admin/newsletter/campaigns/${campaign.id}/analytics`}>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Statistiques
                              </Link>
                            </DropdownMenuItem>
                          )}
                          
                          {["DRAFT", "CANCELLED"].includes(campaign.status) && (
                            <DropdownMenuItem 
                              onClick={() => handleDelete(campaign.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Précédent
          </Button>
          
          <span className="flex items-center px-4">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            disabled={!pagination.hasNextPage}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}