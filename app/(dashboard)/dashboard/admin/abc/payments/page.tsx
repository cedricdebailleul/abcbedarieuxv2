"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconPlus,
  IconSearch,
  IconCreditCard,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconDownload,
} from "@tabler/icons-react";
import { CreatePaymentDialog } from "@/components/admin/abc/create-payment-dialog";
import { EditPaymentDialog } from "@/components/admin/abc/edit-payment-dialog";

interface Payment {
  id: string;
  amount: number;
  mode: string;
  status: string;
  year: number;
  quarter: number | null;
  checkNumber: string | null;
  reference: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  transferReference: string | null;
  dueDate: string | null;
  member: {
    id: string;
    type: string;
    memberNumber: string | null;
    user: {
      name: string;
      email: string;
    };
  };
}

interface PaymentsResponse {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const modeLabels: Record<string, string> = {
  CHEQUE: "Chèque",
  ESPECE: "Espèces",
  VIREMENT: "Virement",
};

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payé",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  REFUNDED: "bg-blue-100 text-blue-800",
};

export default function AbcPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(modeFilter && { mode: modeFilter }),
        ...(yearFilter && { year: yearFilter }),
      });

      const response = await fetch(`/api/admin/abc/payments?${params}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: PaymentsResponse = await response.json();
      setPayments(data.payments);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Erreur lors du chargement des paiements:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, modeFilter, yearFilter]);

  useEffect(() => {
    fetchPayments();
  }, [page, search, statusFilter, modeFilter, yearFilter, fetchPayments]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setPage(1);
  };

  const handleModeFilter = (value: string) => {
    setModeFilter(value === "all" ? "" : value);
    setPage(1);
  };

  const handleYearFilter = (value: string) => {
    setYearFilter(value === "all" ? "" : value);
    setPage(1);
  };

  const handlePaymentCreated = () => {
    setShowCreateDialog(false);
    fetchPayments();
  };

  const handlePaymentUpdated = () => {
    setEditingPayment(null);
    fetchPayments();
  };

  const handleDeletePayment = async (payment: Payment) => {
    try {
      const response = await fetch(`/api/admin/abc/payments/${payment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Erreur lors de la suppression");
        return;
      }

      setDeletingPayment(null);
      fetchPayments();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression du paiement");
    }
  };

  const exportPayments = async () => {
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(modeFilter && { mode: modeFilter }),
        ...(yearFilter && { year: yearFilter }),
        export: "true",
      });

      const response = await fetch(`/api/admin/abc/payments?${params}`);
      if (!response.ok) throw new Error("Erreur d'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paiements-abc-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export");
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading && payments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Paiements ABC</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Chargement...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Paiements ABC</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPayments}>
            <IconDownload className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                Nouveau paiement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouveau paiement</DialogTitle>
                <DialogDescription>
                  Enregistrer un nouveau paiement pour un membre
                </DialogDescription>
              </DialogHeader>
              <CreatePaymentDialog onSuccess={handlePaymentCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={statusFilter || "all"}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={modeFilter || "all"}
              onValueChange={handleModeFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modes</SelectItem>
                {Object.entries(modeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={yearFilter || "all"}
              onValueChange={handleYearFilter}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCreditCard className="h-5 w-5" />
            Paiements ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun paiement trouvé
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.member.user.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.member.memberNumber || "N/A"} •{" "}
                            {payment.member.type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{payment.amount}€</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {modeLabels[payment.mode]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[payment.status]}
                        >
                          {statusLabels[payment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.year}
                          {payment.quarter && ` - T${payment.quarter}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.checkNumber || payment.reference || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString(
                                "fr-FR"
                              )
                            : new Date(payment.createdAt).toLocaleDateString(
                                "fr-FR"
                              )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditingPayment(payment)}
                            >
                              <IconEdit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingPayment(payment)}
                              className="text-red-600"
                            >
                              <IconTrash className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} sur {pagination.pages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === pagination.pages}
                      onClick={() => setPage(page + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      {editingPayment && (
        <Dialog
          open={!!editingPayment}
          onOpenChange={() => setEditingPayment(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le paiement</DialogTitle>
              <DialogDescription>
                Modifier les informations du paiement
              </DialogDescription>
            </DialogHeader>
            <EditPaymentDialog
              payment={editingPayment}
              onSuccess={handlePaymentUpdated}
              onCancel={() => setEditingPayment(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de suppression */}
      <AlertDialog
        open={!!deletingPayment}
        onOpenChange={() => setDeletingPayment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le paiement</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce paiement de{" "}
              {deletingPayment?.amount}€ ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingPayment && handleDeletePayment(deletingPayment)
              }
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
