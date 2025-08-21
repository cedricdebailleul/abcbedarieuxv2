"use client";

import { useState, useEffect } from "react";
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  IconUsers,
  IconEye,
  IconCheck,
  IconX,
  IconDownload,
  IconDots,
  IconSearch,
  IconFilter,
  IconFileText,
  IconMail,
  IconPlus,
  IconEdit,
} from "@tabler/icons-react";
import { ManualRegistrationForm } from "@/components/admin/abc/manual-registration-form";
import { EditRegistrationForm } from "@/components/admin/abc/edit-registration-form";

interface AbcRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  profession?: string;
  company?: string;
  siret?: string;
  membershipType: string;
  motivation?: string;
  interests?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  processedAt?: string;
  processedBy?: string;
  processorUser?: {
    name: string;
  };
  adminNotes?: string;
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
}

interface MemberStatus {
  hasMember: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  member: {
    id: string;
    memberNumber: string;
    type: string;
    status: string;
    membershipDate: string;
    joinedAt: string;
  } | null;
}

const statusLabels = {
  PENDING: { label: "En attente", variant: "secondary" as const },
  APPROVED: { label: "Approuvé", variant: "default" as const },
  REJECTED: { label: "Rejeté", variant: "destructive" as const },
  PROCESSED: { label: "Traité", variant: "outline" as const },
};

const membershipTypeLabels = {
  ACTIF: "Membre Actif",
  ARTISAN: "Artisan",
  AUTO_ENTREPRENEUR: "Auto-Entrepreneur",
  PARTENAIRE: "Partenaire",
  BIENFAITEUR: "Bienfaiteur",
};

export default function AbcRegistrationsPage() {
  const [registrations, setRegistrations] = useState<AbcRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<AbcRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<AbcRegistration | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [membershipFilter, setMembershipFilter] = useState<string>("all");
  const [processing, setProcessing] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null);
  const [loadingMemberStatus, setLoadingMemberStatus] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<AbcRegistration | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    let filtered = registrations;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (reg) =>
          reg.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((reg) => reg.status === statusFilter);
    }

    // Filtrer par type d'adhésion
    if (membershipFilter !== "all") {
      filtered = filtered.filter((reg) => reg.membershipType === membershipFilter);
    }

    setFilteredRegistrations(filtered);
  }, [registrations, searchTerm, statusFilter, membershipFilter]);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/admin/abc/registrations");
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des inscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (registrationId: string, newStatus: "APPROVED" | "REJECTED") => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/abc/registrations/${registrationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes,
        }),
      });

      if (response.ok) {
        await fetchRegistrations();
        setActionDialogOpen(false);
        setSelectedRegistration(null);
        setAdminNotes("");
        setActionType(null);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (registration: AbcRegistration, action: "approve" | "reject") => {
    setSelectedRegistration(registration);
    setActionType(action);
    setAdminNotes("");
    setActionDialogOpen(true);
  };

  const exportToPDF = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/admin/abc/registrations/${registrationId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inscription-abc-${registrationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
    }
  };

  const sendEmail = async (registration: AbcRegistration) => {
    try {
      const response = await fetch(`/api/admin/abc/registrations/${registration.id}/email`, {
        method: "POST",
      });
      if (response.ok) {
        alert("Email envoyé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
    }
  };

  const fetchMemberStatus = async (registrationId: string) => {
    setLoadingMemberStatus(true);
    try {
      const response = await fetch(`/api/admin/abc/registrations/${registrationId}/member-status`);
      if (response.ok) {
        const data = await response.json();
        setMemberStatus(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du statut membre:", error);
    } finally {
      setLoadingMemberStatus(false);
    }
  };

  const handleRegistrationSelect = (registration: AbcRegistration) => {
    setSelectedRegistration(registration);
    setMemberStatus(null);
    
    // Si l'inscription est approuvée, charger le statut du membre
    if (registration.status === "APPROVED") {
      fetchMemberStatus(registration.id);
    }
  };

  const handleEditRegistration = (registration: AbcRegistration) => {
    setEditingRegistration(registration);
    setShowEditForm(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inscriptions ABC</h1>
          <p className="text-muted-foreground mt-2">
            Gestion des demandes d&apos;adhésion à l&apos;association
          </p>
        </div>
        <Button
          onClick={() => setShowManualForm(true)}
          className="flex items-center space-x-2"
        >
          <IconPlus className="h-4 w-4" />
          <span>Nouvelle inscription</span>
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <IconUsers className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{registrations.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <IconCheck className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {registrations.filter((r) => r.status === "PENDING").length}
                </p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <IconCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {registrations.filter((r) => r.status === "APPROVED").length}
                </p>
                <p className="text-sm text-muted-foreground">Approuvés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <IconX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {registrations.filter((r) => r.status === "REJECTED").length}
                </p>
                <p className="text-sm text-muted-foreground">Rejetés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom, prénom, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="APPROVED">Approuvé</SelectItem>
                  <SelectItem value="REJECTED">Rejeté</SelectItem>
                  <SelectItem value="PROCESSED">Traité</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="membership-filter">Type d&apos;adhésion</Label>
              <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="ACTIF">Membre Actif</SelectItem>
                  <SelectItem value="ARTISAN">Artisan</SelectItem>
                  <SelectItem value="AUTO_ENTREPRENEUR">Auto-Entrepreneur</SelectItem>
                  <SelectItem value="PARTENAIRE">Partenaire</SelectItem>
                  <SelectItem value="BIENFAITEUR">Bienfaiteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setMembershipFilter("all");
                }}
              >
                <IconFilter className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des inscriptions */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidat</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {registration.firstName} {registration.lastName}
                      </p>
                      {registration.phone && (
                        <p className="text-sm text-muted-foreground">{registration.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{registration.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {membershipTypeLabels[registration.membershipType as keyof typeof membershipTypeLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[registration.status].variant}>
                      {statusLabels[registration.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(registration.createdAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRegistrationSelect(registration)}>
                          <IconEye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditRegistration(registration)}>
                          <IconEdit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        {registration.status === "PENDING" && (
                          <>
                            <DropdownMenuItem onClick={() => openActionDialog(registration, "approve")}>
                              <IconCheck className="h-4 w-4 mr-2" />
                              Approuver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openActionDialog(registration, "reject")}>
                              <IconX className="h-4 w-4 mr-2" />
                              Rejeter
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => exportToPDF(registration.id)}>
                          <IconDownload className="h-4 w-4 mr-2" />
                          Télécharger PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => sendEmail(registration)}>
                          <IconMail className="h-4 w-4 mr-2" />
                          Renvoyer email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de détails */}
      <Dialog
        open={!!selectedRegistration && !actionDialogOpen}
        onOpenChange={() => setSelectedRegistration(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Détails de l&apos;inscription - {selectedRegistration?.firstName}{" "}
              {selectedRegistration?.lastName}
            </DialogTitle>
            <DialogDescription>
              Demande reçue le{" "}
              {selectedRegistration &&
                new Date(selectedRegistration.createdAt).toLocaleDateString("fr-FR")}
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations personnelles</h3>
                  <div className="space-y-2">
                    <div>
                      <Label>Nom complet</Label>
                      <p className="text-sm">
                        {selectedRegistration.firstName} {selectedRegistration.lastName}
                      </p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm">{selectedRegistration.email}</p>
                    </div>
                    {selectedRegistration.phone && (
                      <div>
                        <Label>Téléphone</Label>
                        <p className="text-sm">{selectedRegistration.phone}</p>
                      </div>
                    )}
                    {selectedRegistration.birthDate && (
                      <div>
                        <Label>Date de naissance</Label>
                        <p className="text-sm">
                          {new Date(selectedRegistration.birthDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Adresse */}
                {(selectedRegistration.address ||
                  selectedRegistration.city ||
                  selectedRegistration.postalCode) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Adresse</h3>
                    <div className="space-y-2">
                      {selectedRegistration.address && (
                        <div>
                          <Label>Adresse</Label>
                          <p className="text-sm">{selectedRegistration.address}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {selectedRegistration.postalCode && (
                          <div>
                            <Label>Code postal</Label>
                            <p className="text-sm">{selectedRegistration.postalCode}</p>
                          </div>
                        )}
                        {selectedRegistration.city && (
                          <div>
                            <Label>Ville</Label>
                            <p className="text-sm">{selectedRegistration.city}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Informations professionnelles */}
              {(selectedRegistration.profession ||
                selectedRegistration.company ||
                selectedRegistration.siret) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations professionnelles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedRegistration.profession && (
                      <div>
                        <Label>Profession</Label>
                        <p className="text-sm">{selectedRegistration.profession}</p>
                      </div>
                    )}
                    {selectedRegistration.company && (
                      <div>
                        <Label>Entreprise</Label>
                        <p className="text-sm">{selectedRegistration.company}</p>
                      </div>
                    )}
                    {selectedRegistration.siret && (
                      <div>
                        <Label>SIRET</Label>
                        <p className="text-sm">{selectedRegistration.siret}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Type d'adhésion et centres d'intérêt */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Type d&apos;adhésion</Label>
                  <p className="text-sm">
                    {membershipTypeLabels[selectedRegistration.membershipType as keyof typeof membershipTypeLabels]}
                  </p>
                </div>
                {selectedRegistration.interests && (
                  <div>
                    <Label>Centres d&apos;intérêt</Label>
                    <p className="text-sm">{selectedRegistration.interests}</p>
                  </div>
                )}
              </div>

              {/* Motivation */}
              {selectedRegistration.motivation && (
                <div>
                  <Label>Motivation</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedRegistration.motivation}</p>
                </div>
              )}

              {/* Statut et notes admin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Statut</Label>
                  <div className="mt-1">
                    <Badge variant={statusLabels[selectedRegistration.status].variant}>
                      {statusLabels[selectedRegistration.status].label}
                    </Badge>
                  </div>
                </div>
                {selectedRegistration.adminNotes && (
                  <div>
                    <Label>Notes administratives</Label>
                    <p className="text-sm whitespace-pre-wrap">{selectedRegistration.adminNotes}</p>
                  </div>
                )}
              </div>

              {/* Statut du membre ABC (si approuvé) */}
              {selectedRegistration.status === "APPROVED" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Statut du membre ABC</h3>
                  {loadingMemberStatus ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-muted-foreground">Vérification du statut membre...</span>
                    </div>
                  ) : memberStatus ? (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      {memberStatus.hasMember ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <IconCheck className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-800">Membre ABC créé avec succès</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-green-700">Numéro de membre</Label>
                              <p className="font-mono font-medium">{memberStatus.member?.memberNumber}</p>
                            </div>
                            <div>
                              <Label className="text-green-700">Type d&apos;adhésion</Label>
                              <p>{membershipTypeLabels[memberStatus.member?.type as keyof typeof membershipTypeLabels]}</p>
                            </div>
                            <div>
                              <Label className="text-green-700">Date d&apos;adhésion</Label>
                              <p>{memberStatus.member?.membershipDate && new Date(memberStatus.member.membershipDate).toLocaleDateString("fr-FR")}</p>
                            </div>
                            <div>
                              <Label className="text-green-700">Statut</Label>
                              <Badge variant="default" className="text-xs">
                                {memberStatus.member?.status === "ACTIVE" ? "Actif" : memberStatus.member?.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <IconX className="h-5 w-5 text-orange-600" />
                          <span className="text-orange-800">Aucun membre ABC trouvé pour cette inscription</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Actions rapides */}
              <div className="flex space-x-2 pt-4 border-t">
                <Button onClick={() => handleEditRegistration(selectedRegistration)} variant="outline">
                  <IconEdit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button onClick={() => exportToPDF(selectedRegistration.id)} variant="outline">
                  <IconFileText className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
                <Button onClick={() => sendEmail(selectedRegistration)} variant="outline">
                  <IconMail className="h-4 w-4 mr-2" />
                  Renvoyer email
                </Button>
                {selectedRegistration.status === "PENDING" && (
                  <>
                    <Button
                      onClick={() => openActionDialog(selectedRegistration, "approve")}
                      variant="default"
                    >
                      <IconCheck className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      onClick={() => openActionDialog(selectedRegistration, "reject")}
                      variant="destructive"
                    >
                      <IconX className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'action (approuver/rejeter) */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approuver" : "Rejeter"} l&apos;inscription
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Cette action approuvera la demande d'adhésion. Un email de confirmation sera envoyé au candidat."
                : "Cette action rejettera la demande d'adhésion. Un email de notification sera envoyé au candidat."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-notes">Notes administratives (optionnel)</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ajoutez des notes sur cette décision..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() =>
                selectedRegistration &&
                actionType &&
                handleStatusChange(
                  selectedRegistration.id,
                  actionType === "approve" ? "APPROVED" : "REJECTED"
                )
              }
              disabled={processing}
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              {processing ? "Traitement..." : actionType === "approve" ? "Approuver" : "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Formulaire d'inscription manuelle */}
      <ManualRegistrationForm
        open={showManualForm}
        onOpenChange={setShowManualForm}
        onSuccess={() => {
          fetchRegistrations();
          setShowManualForm(false);
        }}
      />

      {/* Formulaire de modification d'inscription */}
      <EditRegistrationForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        registration={editingRegistration}
        onSuccess={() => {
          fetchRegistrations();
          setShowEditForm(false);
          setEditingRegistration(null);
        }}
      />
    </div>
  );
}