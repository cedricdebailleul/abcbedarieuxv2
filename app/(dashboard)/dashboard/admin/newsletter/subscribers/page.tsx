"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Search, 
  Download, 
  Mail,
  Calendar,
  MapPin,
  FileText,
  UserCheck,
  UserX,
  Filter,
  Trash2
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

interface Subscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isVerified: boolean;
  subscribedAt: string;
  lastEmailSent?: string;
  preferences?: {
    events: boolean;
    places: boolean;
    offers: boolean;
    news: boolean;
    frequency: string;
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

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Filtres
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (verifiedFilter !== "all") params.append("verified", verifiedFilter);

      const response = await fetch(`/api/admin/newsletter/subscribers?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubscribers(data.subscribers);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des abonnés");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchSubscribers, search ? 500 : 0);
    return () => clearTimeout(timeout);
  }, [search, statusFilter, verifiedFilter, pagination.page]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(subscribers.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkAction = async (action: "delete" | "activate" | "deactivate") => {
    if (selectedIds.length === 0) {
      toast.error("Aucun abonné sélectionné");
      return;
    }

    const confirmed = confirm(`Êtes-vous sûr de vouloir ${action === "delete" ? "supprimer" : action === "activate" ? "activer" : "désactiver"} ${selectedIds.length} abonné(s) ?`);
    if (!confirmed) return;

    try {
      const response = await fetch("/api/admin/newsletter/subscribers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: selectedIds }),
      });

      if (response.ok) {
        toast.success(`${selectedIds.length} abonné(s) ${action === "delete" ? "supprimé(s)" : action === "activate" ? "activé(s)" : "désactivé(s)"}`);
        setSelectedIds([]);
        fetchSubscribers();
      }
    } catch (error) {
      toast.error("Erreur lors de l'action groupée");
    }
  };

  const exportSubscribers = async () => {
    try {
      const response = await fetch("/api/admin/newsletter/subscribers/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Export en cours de téléchargement");
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const getPreferencesText = (preferences: Subscriber["preferences"]) => {
    if (!preferences) return "Non configurées";
    const active = [];
    if (preferences.events) active.push("Événements");
    if (preferences.places) active.push("Commerces");
    if (preferences.offers) active.push("Offres");
    if (preferences.news) active.push("Actualités");
    return active.length > 0 ? active.join(", ") : "Aucune";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Abonnés Newsletter</h1>
          <p className="text-muted-foreground">
            Gérez votre liste d'abonnés et leurs préférences
          </p>
        </div>
        <Button onClick={exportSubscribers}>
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total abonnés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {subscribers.filter(s => s.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vérifiés</CardTitle>
            <Mail className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {subscribers.filter(s => s.isVerified).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {subscribers.filter(s => !s.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email ou nom..."
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
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vérification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="verified">Vérifiés</SelectItem>
                <SelectItem value="unverified">Non vérifiés</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchSubscribers}>
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions groupées */}
      {selectedIds.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">
                {selectedIds.length} abonné(s) sélectionné(s)
              </span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleBulkAction("activate")}>
                  Activer
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("deactivate")}>
                  Désactiver
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des abonnés */}
      <Card>
        <CardHeader>
          <CardTitle>
            Abonnés ({pagination.totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun abonné trouvé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === subscribers.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Abonné</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Préférences</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead>Dernier email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(subscriber.id)}
                        onCheckedChange={(checked) => handleSelectOne(subscriber.id, checked as boolean)}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscriber.email}</div>
                        {(subscriber.firstName || subscriber.lastName) && (
                          <div className="text-sm text-muted-foreground">
                            {subscriber.firstName} {subscriber.lastName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={subscriber.isActive ? "default" : "secondary"}>
                          {subscriber.isActive ? "Actif" : "Inactif"}
                        </Badge>
                        <Badge variant={subscriber.isVerified ? "default" : "outline"}>
                          {subscriber.isVerified ? "Vérifié" : "Non vérifié"}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {getPreferencesText(subscriber.preferences)}
                      </div>
                      {subscriber.preferences && (
                        <div className="text-xs text-muted-foreground">
                          Fréquence: {subscriber.preferences.frequency || "Hebdomadaire"}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {new Date(subscriber.subscribedAt).toLocaleDateString("fr-FR")}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {subscriber.lastEmailSent 
                          ? new Date(subscriber.lastEmailSent).toLocaleDateString("fr-FR")
                          : "Jamais"
                        }
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
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Envoyer un email
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem>
                            {subscriber.isActive ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activer
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
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