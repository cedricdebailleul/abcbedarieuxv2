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
  IconMail,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconSend,
  IconEye,
  IconCopy,
} from "@tabler/icons-react";
import { CreateBulletinDialog } from "@/components/admin/abc/create-bulletin-dialog";
import { EditBulletinDialog } from "@/components/admin/abc/edit-bulletin-dialog";

interface Bulletin {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  meeting?: {
    id: string;
    title: string;
    scheduledAt: string;
  };
}

interface BulletinsResponse {
  bulletins: Bulletin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const getStatusInfo = (bulletin: Bulletin) => {
  if (bulletin.isPublished) {
    return {
      label: "Publié",
      color: "bg-green-100 text-green-800"
    };
  } else {
    return {
      label: "Brouillon",
      color: "bg-gray-100 text-gray-800"
    };
  }
};

export default function AbcBulletinsPage() {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState<Bulletin | null>(null);
  const [deletingBulletin, setDeletingBulletin] = useState<Bulletin | null>(null);
  const [previewingBulletin, setPreviewingBulletin] = useState<Bulletin | null>(null);

  const fetchBulletins = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/abc/bulletins?${params}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: BulletinsResponse = await response.json();
      setBulletins(data.bulletins);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Erreur lors du chargement des bulletins:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchBulletins();
  }, [page, search, statusFilter, fetchBulletins]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setPage(1);
  };

  const handleBulletinCreated = () => {
    setShowCreateDialog(false);
    fetchBulletins();
  };

  const handleBulletinUpdated = () => {
    setEditingBulletin(null);
    fetchBulletins();
  };

  const handleDeleteBulletin = async (bulletin: Bulletin) => {
    try {
      const response = await fetch(`/api/admin/abc/bulletins/${bulletin.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Erreur lors de la suppression");
        return;
      }

      setDeletingBulletin(null);
      fetchBulletins();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression du bulletin");
    }
  };

  const handleSendBulletin = async (bulletin: Bulletin) => {
    if (!confirm(`Êtes-vous sûr de vouloir envoyer le bulletin "${bulletin.title}" à tous les membres de l'association ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/abc/bulletins/${bulletin.id}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Erreur lors de l'envoi");
        return;
      }

      const result = await response.json();
      
      // Afficher les statistiques d'envoi
      let message = result.message + "\n\n";
      message += `📊 Statistiques:\n`;
      message += `• Total membres: ${result.stats.totalMembers}\n`;
      message += `• Emails envoyés: ${result.stats.sentCount}\n`;
      
      if (result.stats.errorCount > 0) {
        message += `• Erreurs: ${result.stats.errorCount}\n`;
        if (result.stats.errors.length > 0) {
          message += `\nPremières erreurs:\n${result.stats.errors.join('\n')}`;
        }
      }

      alert(message);
      fetchBulletins();
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      alert("Erreur lors de l'envoi du bulletin");
    }
  };

  const handleDuplicateBulletin = async (bulletin: Bulletin) => {
    try {
      const response = await fetch(`/api/admin/abc/bulletins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Copie de ${bulletin.title}`,
          content: bulletin.content,
          isPublished: false,
          publishedAt: null,
          meetingId: bulletin.meeting?.id || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Erreur lors de la duplication");
        return;
      }

      alert("Bulletin dupliqué avec succès !");
      fetchBulletins();
    } catch (error) {
      console.error("Erreur lors de la duplication:", error);
      alert("Erreur lors de la duplication du bulletin");
    }
  };

  if (loading && bulletins.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Bulletins ABC</h1>
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
        <h1 className="text-3xl font-bold">Bulletins ABC</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="h-4 w-4 mr-2" />
              Nouveau bulletin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Nouveau bulletin</DialogTitle>
              <DialogDescription>
                Créer un nouveau bulletin pour les membres de l&apos;association
              </DialogDescription>
            </DialogHeader>
            <CreateBulletinDialog onSuccess={handleBulletinCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre..."
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
                <SelectItem value="PUBLISHED">Publié</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des bulletins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMail className="h-5 w-5" />
            Bulletins ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bulletins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun bulletin trouvé
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Publication</TableHead>
                    <TableHead>Créé par</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulletins.map((bulletin) => (
                    <TableRow key={bulletin.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{bulletin.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {bulletin.content.substring(0, 100)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const statusInfo = getStatusInfo(bulletin);
                          return (
                            <Badge
                              variant="secondary"
                              className={statusInfo.color}
                            >
                              {statusInfo.label}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {bulletin.meeting ? (
                            <Badge variant="outline">
                              Lié à: {bulletin.meeting.title}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Général
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {bulletin.publishedAt ? (
                            <div>
                              <div>Publié le:</div>
                              <div className="text-muted-foreground">
                                {new Date(bulletin.publishedAt).toLocaleDateString("fr-FR")}
                              </div>
                            </div>
                          ) : (
                            "Non publié"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{bulletin.createdBy.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(bulletin.createdAt).toLocaleDateString("fr-FR")}
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
                              onClick={() => setPreviewingBulletin(bulletin)}
                            >
                              <IconEye className="h-4 w-4 mr-2" />
                              Aperçu
                            </DropdownMenuItem>
                            {!bulletin.isPublished && (
                              <DropdownMenuItem
                                onClick={() => handleSendBulletin(bulletin)}
                              >
                                <IconSend className="h-4 w-4 mr-2" />
                                Envoyer aux membres
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setEditingBulletin(bulletin)}
                            >
                              <IconEdit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicateBulletin(bulletin)}
                            >
                              <IconCopy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingBulletin(bulletin)}
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
      {editingBulletin && (
        <Dialog
          open={!!editingBulletin}
          onOpenChange={() => setEditingBulletin(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Modifier le bulletin</DialogTitle>
              <DialogDescription>
                Modifier le contenu et les paramètres du bulletin
              </DialogDescription>
            </DialogHeader>
            <EditBulletinDialog
              bulletin={editingBulletin}
              onSuccess={handleBulletinUpdated}
              onCancel={() => setEditingBulletin(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialogue d'aperçu */}
      <Dialog
        open={!!previewingBulletin}
        onOpenChange={() => setPreviewingBulletin(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu du bulletin</DialogTitle>
            <DialogDescription>
              Visualisation du contenu qui sera envoyé aux membres
            </DialogDescription>
          </DialogHeader>
          {previewingBulletin && (
            <div className="space-y-6">
              {/* Informations du bulletin */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Informations du bulletin</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Titre:</span> {previewingBulletin.title}
                  </div>
                  <div>
                    <span className="font-medium">Statut:</span> {
                      previewingBulletin.isPublished ? "Publié" : "Brouillon"
                    }
                  </div>
                  <div>
                    <span className="font-medium">Créé par:</span> {previewingBulletin.createdBy.name}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {
                      new Date(previewingBulletin.createdAt).toLocaleDateString("fr-FR")
                    }
                  </div>
                </div>
                {previewingBulletin.meeting && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Réunion associée:</span> {previewingBulletin.meeting.title}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {new Date(previewingBulletin.meeting.scheduledAt).toLocaleDateString("fr-FR", {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Aperçu email */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-blue-600 text-white p-4 text-center">
                  <h1 className="text-xl font-bold">ABC Bédarieux</h1>
                  <h2 className="text-lg">{previewingBulletin.title}</h2>
                </div>
                
                <div className="p-6 bg-gray-50">
                  <p className="mb-4">Bonjour [Nom du membre],</p>
                  
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: previewingBulletin.content.replace(/\n/g, '<br>')
                      }}
                    />
                  </div>
                  
                  {previewingBulletin.meeting && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h3 className="font-semibold mb-2">📅 Réunion associée</h3>
                      <p><strong>{previewingBulletin.meeting.title}</strong></p>
                      <p>Date : {new Date(previewingBulletin.meeting.scheduledAt).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  )}
                  
                  <p>Cordialement,<br />L&apos;équipe ABC Bédarieux</p>
                </div>
                
                <div className="bg-gray-100 p-4 text-center text-xs text-gray-600">
                  <p>Vous recevez cet email car vous êtes membre de l&apos;association ABC Bédarieux.</p>
                  <p>Association ABC Bédarieux - Bédarieux, France</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog
        open={!!deletingBulletin}
        onOpenChange={() => setDeletingBulletin(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le bulletin</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le bulletin &quot;{deletingBulletin?.title}&quot; ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingBulletin && handleDeleteBulletin(deletingBulletin)
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