"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  MoreHorizontal, 
  RefreshCw, 
  Trash2, 
  Copy,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Invitation {
  id: string;
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  attempts: number;
  status: "pending" | "expired" | "used";
  user?: {
    id: string;
    name: string;
    role: string;
    status: string;
    createdAt: string;
  };
  canResend: boolean;
}

interface InvitationsResponse {
  invitations: Invitation[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    total: number;
    pending: number;
    expired: number;
    used: number;
  };
}

export default function InvitationsTable() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, expired: 0, used: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  
  // Filtres
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // États pour les actions
  const [resendDialog, setResendDialog] = useState<{
    open: boolean;
    invitation?: Invitation;
  }>({ open: false });
  
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    invitation?: Invitation;
  }>({ open: false });

  // Charger les invitations
  const fetchInvitations = async (params: {
    page?: number;
    search?: string;
    status?: string;
  } = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      queryParams.append("page", (params.page || pagination.page).toString());
      queryParams.append("limit", pagination.limit.toString());
      
      if (params.search || search) {
        queryParams.append("search", params.search || search);
      }
      if ((params.status || statusFilter) && (params.status || statusFilter) !== "all") {
        queryParams.append("status", params.status || statusFilter);
      }

      const response = await fetch(`/api/admin/invitations?${queryParams}`);
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des invitations");
      }

      const data: InvitationsResponse = await response.json();
      setInvitations(data.invitations);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des invitations");
    } finally {
      setLoading(false);
    }
  };

  // Effet pour le chargement initial
  useEffect(() => {
    fetchInvitations();
  }, []);

  // Effet pour les filtres avec debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchInvitations({ page: 1 });
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  // Renvoyer une invitation
  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      const response = await fetch("/api/admin/invitations/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: invitation.email,
          role: "user", // Par défaut, ou récupérer depuis l'invitation précédente
          message: "Voici votre nouvelle invitation à rejoindre ABC Bédarieux.",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors du renvoi");
      }

      toast.success("Invitation renvoyée avec succès");
      fetchInvitations(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors du renvoi");
    } finally {
      setResendDialog({ open: false });
    }
  };

  // Copier le lien d'invitation
  const handleCopyInviteLink = (invitation: Invitation) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/accept-invitation?token=${invitation.token}&email=${encodeURIComponent(invitation.email)}&role=user`;
    
    navigator.clipboard.writeText(inviteUrl).then(() => {
      toast.success("Lien d'invitation copié dans le presse-papiers");
    }).catch(() => {
      toast.error("Impossible de copier le lien");
    });
  };

  // Supprimer une invitation
  const handleDeleteInvitation = async (invitation: Invitation) => {
    try {
      const response = await fetch("/api/admin/invitations/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: invitation.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      toast.success("Invitation supprimée avec succès");
      fetchInvitations(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  const getStatusBadge = (status: string, user?: any) => {
    if (user) {
      return <Badge variant="default" className="bg-green-600">Compte créé</Badge>;
    }

    const variants = {
      pending: "default",
      expired: "destructive",
      used: "secondary",
    } as const;

    const labels = {
      pending: "En attente",
      expired: "Expirée",
      used: "Utilisée",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
  };

  const getStatusIcon = (status: string, user?: any) => {
    if (user) return <CheckCircle className="h-4 w-4 text-green-600" />;
    
    const icons = {
      pending: <Clock className="h-4 w-4 text-orange-500" />,
      expired: <XCircle className="h-4 w-4 text-red-500" />,
      used: <CheckCircle className="h-4 w-4 text-gray-500" />,
    };
    return icons[status as keyof typeof icons];
  };

  // Mise à jour des statistiques dans le composant parent
  useEffect(() => {
    const updateParentStats = () => {
      // Mettre à jour les cartes statistiques dans le parent
      const statsCards = document.querySelectorAll('[data-stat-card]');
      statsCards.forEach((card, index) => {
        const valueElement = card.querySelector('.text-2xl');
        if (valueElement) {
          const values = [stats.pending, stats.used, stats.expired, stats.total];
          if (values[index] !== undefined) {
            valueElement.textContent = values[index].toString();
          }
        }
      });
    };

    if (!loading) {
      updateParentStats();
    }
  }, [stats, loading]);

  return (
    <div className="space-y-4 p-6">

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="expired">Expirées</SelectItem>
            <SelectItem value="used">Utilisées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créée le</TableHead>
              <TableHead>Expire le</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell><div className="h-6 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-8 w-8 bg-gray-200 rounded animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Aucune invitation trouvée
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="text-sm text-gray-500">
                          {invitation.attempts} tentative(s)
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invitation.status, invitation.user)}
                      {getStatusBadge(invitation.status, invitation.user)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(invitation.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 text-sm ${
                      new Date(invitation.expiresAt) < new Date() ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <Clock className="h-4 w-4" />
                      {formatDate(invitation.expiresAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {invitation.user ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium text-sm">{invitation.user.name}</div>
                          <div className="text-xs text-gray-500">{invitation.user.role}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Aucun compte</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleCopyInviteLink(invitation)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copier le lien
                        </DropdownMenuItem>
                        {invitation.canResend && (
                          <DropdownMenuItem
                            onClick={() => setResendDialog({ open: true, invitation })}
                            className="text-orange-600"
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Renvoyer
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteDialog({ open: true, invitation })}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.totalCount} invitations)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInvitations({ page: pagination.page - 1 })}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInvitations({ page: pagination.page + 1 })}
              disabled={!pagination.hasNextPage}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de confirmation de renvoi */}
      <AlertDialog open={resendDialog.open} onOpenChange={(open) => setResendDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renvoyer l'invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous renvoyer une invitation à <strong>{resendDialog.invitation?.email}</strong> ?
              <br />
              Cela créera une nouvelle invitation et invalidera la précédente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resendDialog.invitation && handleResendInvitation(resendDialog.invitation)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Renvoyer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'invitation de <strong>{deleteDialog.invitation?.email}</strong> ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.invitation && handleDeleteInvitation(deleteDialog.invitation)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}