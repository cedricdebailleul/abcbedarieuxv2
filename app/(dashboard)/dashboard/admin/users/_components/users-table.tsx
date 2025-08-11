"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Edit, 
  Trash2, 
  Ban, 
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Shield,
  Mail,
  Calendar
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import EditUserDialog from "./edit-user-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: "user" | "admin" | "moderator" | "dpo" | "editor";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED" | "PENDING_VERIFICATION" | "DELETED";
  slug?: string;
  createdAt: string;
  lastLoginAt?: string;
  banned?: boolean;
  banReason?: string;
  profile?: {
    firstname?: string;
    lastname?: string;
    isPublic: boolean;
  };
  badgeCount: number;
  sessionCount: number;
  postCount: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function UsersTable() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
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
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // État pour la suppression
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user?: User;
  }>({ open: false });

  // Charger les utilisateurs
  const fetchUsers = async (params: {
    page?: number;
    search?: string;
    role?: string;
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
      if ((params.role || roleFilter) && (params.role || roleFilter) !== "all") {
        queryParams.append("role", params.role || roleFilter);
      }
      if ((params.status || statusFilter) && (params.status || statusFilter) !== "all") {
        queryParams.append("status", params.status || statusFilter);
      }

      const response = await fetch(`/api/admin/users?${queryParams}`);
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des utilisateurs");
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  // Effet pour le chargement initial
  useEffect(() => {
    fetchUsers();
  }, []);

  // Effet pour les filtres avec debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers({ page: 1 });
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, roleFilter, statusFilter]);

  // Supprimer un utilisateur
  const handleDeleteUser = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      toast.success("Utilisateur supprimé avec succès");
      fetchUsers(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  // Bannir/débannir un utilisateur
  const handleToggleBan = async (user: User) => {
    try {
      console.log("Debug - user.status:", user.status, "user.banned:", user.banned);
      const isBanned = user.status === "BANNED";
      const newBannedState = !isBanned;
      
      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          banned: newBannedState,
          banReason: newBannedState ? "Banni par l'administrateur" : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la modification");
      }

      const result = await response.json();
      toast.success(result.message);
      fetchUsers(); // Recharger la liste
    } catch (error) {
      console.error("Erreur lors du bannissement/débannissement:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification");
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "destructive",
      moderator: "secondary",
      dpo: "outline",
      editor: "default",
      user: "secondary",
    } as const;

    const labels = {
      admin: "Admin",
      moderator: "Modérateur",
      dpo: "DPO",
      editor: "Éditeur",
      user: "Utilisateur",
    };

    return (
      <Badge variant={variants[role as keyof typeof variants]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      SUSPENDED: "outline",
      BANNED: "destructive",
      PENDING_VERIFICATION: "secondary",
    } as const;

    const labels = {
      ACTIVE: "Actif",
      INACTIVE: "Inactif",
      SUSPENDED: "Suspendu",
      BANNED: "Banni",
      PENDING_VERIFICATION: "En attente",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4 p-6">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="user">Utilisateur</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Modérateur</SelectItem>
            <SelectItem value="dpo">DPO</SelectItem>
            <SelectItem value="editor">Éditeur</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="ACTIVE">Actif</SelectItem>
            <SelectItem value="INACTIVE">Inactif</SelectItem>
            <SelectItem value="SUSPENDED">Suspendu</SelectItem>
            <SelectItem value="BANNED">Banni</SelectItem>
            <SelectItem value="PENDING_VERIFICATION">En attente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead>Activité</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><div className="h-6 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-6 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-8 w-8 bg-gray-200 rounded animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/api/avatar/${user.id}`} />
                        <AvatarFallback>
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {user.profile?.firstname && user.profile?.lastname 
                            ? `${user.profile.firstname} ${user.profile.lastname}`
                            : user.name
                          }
                          {!user.emailVerified && (
                            <Mail className="h-4 w-4 text-orange-500" />
                          )}
                          {user.badgeCount > 0 && (
                            <Shield className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {formatDate(user.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Sessions: {user.sessionCount}</div>
                      <div>Posts: {user.postCount}</div>
                    </div>
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
                        <EditUserDialog user={user} onSuccess={fetchUsers}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                        </EditUserDialog>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleBan(user)}
                          className={user.status === "BANNED" ? "text-green-600" : "text-orange-600"}
                        >
                          {user.status === "BANNED" ? (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Débannir
                            </>
                          ) : (
                            <>
                              <Ban className="mr-2 h-4 w-4" />
                              Bannir
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteDialog({ open: true, user })}
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
            Page {pagination.page} sur {pagination.totalPages} ({pagination.totalCount} utilisateurs)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers({ page: pagination.page - 1 })}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers({ page: pagination.page + 1 })}
              disabled={!pagination.hasNextPage}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
              <strong>{deleteDialog.user?.name}</strong> ?
              <br />
              Cette action est irréversible et supprimera toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.user && handleDeleteUser(deleteDialog.user)}
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