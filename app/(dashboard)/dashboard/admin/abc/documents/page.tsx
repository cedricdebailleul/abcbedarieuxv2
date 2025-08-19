"use client";

import { useState, useEffect } from "react";
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
  IconFileText,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconDownload,
  IconEye,
  IconFile,
} from "@tabler/icons-react";
import { CreateDocumentDialog } from "@/components/admin/abc/create-document-dialog";
import { EditDocumentDialog } from "@/components/admin/abc/edit-document-dialog";

interface Document {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string;
  createdAt: string;
  uploadedBy: {
    name: string;
    email: string;
  };
  meeting?: {
    id: string;
    title: string;
    scheduledAt: string;
  };
}

interface DocumentsResponse {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const typeLabels: Record<string, string> = {
  MINUTES: "Procès-verbaux",
  AGENDA: "Ordre du jour",
  FINANCIAL: "Documents financiers",
  LEGAL: "Documents légaux",
  COMMUNICATION: "Communications",
  OTHER: "Autres",
};

const getFileIcon = (mimeType: string | undefined) => {
  if (!mimeType) return "📁";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  if (mimeType.includes("image")) return "🖼️";
  return "📁";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function AbcDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [accessFilter, setAccessFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
      });

      const response = await fetch(`/api/admin/abc/documents?${params}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: DocumentsResponse = await response.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, search, typeFilter, accessFilter]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value === "all" ? "" : value);
    setPage(1);
  };

  const handleAccessFilter = (value: string) => {
    setAccessFilter(value === "all" ? "" : value);
    setPage(1);
  };

  const handleDocumentCreated = () => {
    setShowCreateDialog(false);
    fetchDocuments();
  };

  const handleDocumentUpdated = () => {
    setEditingDocument(null);
    fetchDocuments();
  };

  const handleDeleteDocument = async (document: Document) => {
    try {
      const response = await fetch(`/api/admin/abc/documents/${document.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Erreur lors de la suppression");
        return;
      }

      setDeletingDocument(null);
      fetchDocuments();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression du document");
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/admin/abc/documents/${document.id}/download`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de téléchargement");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      alert(error instanceof Error ? error.message : "Erreur lors du téléchargement");
    }
  };

  const handlePreview = (document: Document) => {
    const previewUrl = `/api/admin/abc/documents/${document.id}/preview`;
    window.open(previewUrl, '_blank');
  };

  if (loading && documents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Documents ABC</h1>
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
        <h1 className="text-3xl font-bold">Documents ABC</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="h-4 w-4 mr-2" />
              Nouveau document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouveau document</DialogTitle>
              <DialogDescription>
                Ajouter un nouveau document à la bibliothèque
              </DialogDescription>
            </DialogHeader>
            <CreateDocumentDialog onSuccess={handleDocumentCreated} />
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
              value={typeFilter || "all"}
              onValueChange={handleTypeFilter}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type de document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Documents ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun document trouvé
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Ajouté par</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {getFileIcon(document.mimeType)}
                          </span>
                          <div>
                            <div className="font-medium">{document.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {document.fileName}
                            </div>
                            {document.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {document.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeLabels[document.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatFileSize(document.fileSize)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {document.meeting ? (
                            <Badge variant="outline">
                              Lié à: {document.meeting.title}
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
                          <div>{document.uploadedBy.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(document.createdAt).toLocaleDateString("fr-FR")}
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
                              onClick={() => handleDownload(document)}
                            >
                              <IconDownload className="h-4 w-4 mr-2" />
                              Télécharger
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePreview(document)}
                            >
                              <IconEye className="h-4 w-4 mr-2" />
                              Aperçu
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditingDocument(document)}
                            >
                              <IconEdit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingDocument(document)}
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
      {editingDocument && (
        <Dialog
          open={!!editingDocument}
          onOpenChange={() => setEditingDocument(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le document</DialogTitle>
              <DialogDescription>
                Modifier les informations du document
              </DialogDescription>
            </DialogHeader>
            <EditDocumentDialog
              document={editingDocument}
              onSuccess={handleDocumentUpdated}
              onCancel={() => setEditingDocument(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de suppression */}
      <AlertDialog
        open={!!deletingDocument}
        onOpenChange={() => setDeletingDocument(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le document "{deletingDocument?.title}" ? 
              Cette action est irréversible et supprimera également le fichier du serveur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingDocument && handleDeleteDocument(deletingDocument)
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