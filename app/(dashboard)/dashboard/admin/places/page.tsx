"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { 
  Search,
  Eye,
  Edit,
  UserMinus,
  UserPlus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  User,
  Calendar,
  Star,
  Heart,
  Flag,
  MapPin
} from "lucide-react";
import { AdminGuard } from "@/components/auth/admin-guard";
import { useSession } from "@/hooks/use-session";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Place {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: "ACTIVE" | "PENDING" | "DRAFT" | "INACTIVE" | string;
  city: string;
  street: string;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    reviews: number;
    favorites: number;
    claims: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  _count?: {
    ownedPlaces: number;
  };
}

interface ApiResponse {
  places: Place[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    pendingCount: number;
  };
}

const getStatusBadge = (status: string, isVerified?: boolean) => {
    if (isVerified) {
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Vérifié
      </Badge>
    );
  }
  
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Actif
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          En attente
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Brouillon
        </Badge>
      );
    case "INACTIVE":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Inactif
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};


export default function AdminPlacesPage() {
  const { data: session, status } = useSession();
  
  // États
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Gestion des propriétaires
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [ownerAction, setOwnerAction] = useState<"assign" | "remove">("assign");
  const [searchUsers, setSearchUsers] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOwnerAction, setLoadingOwnerAction] = useState(false);

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Query string pour l'API
  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "20",
    });
    if (statusFilter && statusFilter !== "all")
      params.append("status", statusFilter);
    if (debouncedQuery) params.append("search", debouncedQuery);
    return params.toString();
  }, [currentPage, statusFilter, debouncedQuery]);

  // Fetch places
  const fetchPlaces = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/places?${queryString}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement");
      }

      const data: ApiResponse = await response.json();
      setPlaces(data.places);
      setTotalPages(data.pagination.pages);
      setPendingCount(data.stats.pendingCount);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des places");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchPlaces();
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [status, session?.user?.role, fetchPlaces]);

  // Search users
  const searchUsersAPI = useCallback(async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setLoadingUsers(true);
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Erreur lors de la recherche");
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Erreur recherche utilisateurs:", error);
      toast.error("Erreur lors de la recherche d'utilisateurs");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Debounced user search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      if (searchUsers && showOwnerDialog) {
        searchUsersAPI(searchUsers);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchUsers, showOwnerDialog, searchUsersAPI]);

  // Actions
  const handleValidation = async (
    placeId: string,
    action: "approve" | "reject",
    placeName: string
  ) => {
    const confirmMessage =
      action === "approve"
        ? `Approuver la place "${placeName}" ?`
        : `Rejeter la place "${placeName}" ?`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/places/${placeId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error("Erreur lors de la validation");

      const result = await res.json();
      toast.success(result.message);
      fetchPlaces();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la validation");
    }
  };

  const handleOwnerAction = async () => {
    if (!selectedPlace) return;

    if (ownerAction === "assign" && !selectedUser) {
      toast.error("Veuillez sélectionner un utilisateur");
      return;
    }

    setLoadingOwnerAction(true);
    try {
      const response = await fetch(`/api/admin/places/${selectedPlace.id}/ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: ownerAction,
          userId: selectedUser?.id,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'action");

      const result = await response.json();
      toast.success(result.message);
      setShowOwnerDialog(false);
      setSelectedPlace(null);
      setSelectedUser(null);
      setSearchUsers("");
      fetchPlaces();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'action sur le propriétaire");
    } finally {
      setLoadingOwnerAction(false);
    }
  };

  const openOwnerDialog = (place: Place, action: "assign" | "remove") => {
    setSelectedPlace(place);
    setOwnerAction(action);
    setSelectedUser(null);
    setSearchUsers("");
    setUsers([]);
    setShowOwnerDialog(true);
  };

  // Loading auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Administration des Places
            </h1>
            <p className="text-muted-foreground">
              Gérez et validez les places du répertoire ({places.length} places)
            </p>
            {pendingCount > 0 && (
              <Badge variant="outline" className="mt-2 bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                {pendingCount} place{pendingCount > 1 ? "s" : ""} en attente
              </Badge>
            )}
          </div>

          <Link
            href="/dashboard/admin/places/new"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Créer une place
          </Link>
        </div>

        {/* Filtres & recherche */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par nom, ville ou propriétaire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="ACTIVE">Actif</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="DRAFT">Brouillon</SelectItem>
              <SelectItem value="INACTIVE">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : places.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">
                Aucune place trouvée
              </h3>
              <p className="text-muted-foreground">
                {debouncedQuery
                  ? "Aucun résultat pour cette recherche."
                  : "Aucune place dans le système."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Place</TableHead>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Statistiques</TableHead>
                  <TableHead>Créée</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {places.map((place) => (
                  <TableRow key={place.id}>
                    {/* Place info */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{place.name}</h3>
                          {place.isFeatured && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              Vedette
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {place.type} • {place.city}
                        </p>
                        <p className="text-xs text-muted-foreground">{place.street}</p>
                      </div>
                    </TableCell>

                    {/* Owner */}
                    <TableCell>
                      {place.owner ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {place.owner.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{place.owner.email}</p>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          <Flag className="w-3 h-3 mr-1" />
                          Peut être revendiquée
                        </Badge>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {getStatusBadge(place.status, place.isVerified)}
                    </TableCell>

                    {/* Stats */}
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {place._count.reviews}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {place._count.favorites}
                        </span>
                        {place._count.claims > 0 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            {place._count.claims} revendication{place._count.claims > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Created */}
                    <TableCell>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(place.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {place.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleValidation(place.id, "approve", place.name)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleValidation(place.id, "reject", place.name)}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejeter
                            </Button>
                          </>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/places/${place.slug}`} target="_blank">
                                <Eye className="w-4 h-4 mr-2" />
                                Voir
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/places/${place.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {place.owner ? (
                              <DropdownMenuItem
                                onClick={() => openOwnerDialog(place, "remove")}
                                className="text-orange-600"
                              >
                                <UserMinus className="w-4 h-4 mr-2" />
                                Retirer le propriétaire
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => openOwnerDialog(place, "assign")}
                                className="text-green-600"
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Assigner un propriétaire
                              </DropdownMenuItem>
                            )}
                            {place._count.claims > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/admin/claims?place=${place.id}`}>
                                    <Flag className="w-4 h-4 mr-2" />
                                    Voir revendications ({place._count.claims})
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog de gestion des propriétaires */}
      <Dialog open={showOwnerDialog} onOpenChange={setShowOwnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {ownerAction === "assign" ? "Assigner un propriétaire" : "Retirer le propriétaire"}
            </DialogTitle>
            <DialogDescription>
              {ownerAction === "assign" 
                ? `Recherchez et sélectionnez un utilisateur pour devenir propriétaire de "${selectedPlace?.name}".`
                : `Confirmer la suppression du propriétaire de "${selectedPlace?.name}". La place deviendra disponible à la revendication.`
              }
            </DialogDescription>
          </DialogHeader>

          {ownerAction === "assign" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rechercher un utilisateur</label>
                <Input
                  placeholder="Nom ou email de l'utilisateur..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                />
              </div>

              {loadingUsers && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              )}

              {users.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sélectionner un utilisateur</label>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 cursor-pointer hover:bg-muted border-b last:border-b-0 ${
                          selectedUser?.id === user.id ? "bg-primary/10" : ""
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          {user._count?.ownedPlaces && (
                            <Badge variant="outline">
                              {user._count.ownedPlaces} place{user._count.ownedPlaces > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOwnerDialog(false)}
              disabled={loadingOwnerAction}
            >
              Annuler
            </Button>
            <Button
              onClick={handleOwnerAction}
              disabled={loadingOwnerAction || (ownerAction === "assign" && !selectedUser)}
              className={ownerAction === "remove" ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {loadingOwnerAction ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              ) : null}
              {ownerAction === "assign" ? "Assigner" : "Retirer le propriétaire"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
}