"use client";

import { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconDownload,
  IconDatabase,
  IconUsers,
  IconBuilding,
  IconCalendarEvent,
  IconArticle,
  IconUpload,
  IconArchive,
  IconLoader2,
  IconShield,
  IconFiles,
  IconCloud,
  IconRestore,
  IconX
} from "@tabler/icons-react";
import { toast } from "sonner";

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  estimatedSize?: string;
}

const exportOptions: ExportOption[] = [
  {
    id: "users",
    name: "Utilisateurs",
    description: "Données des comptes utilisateurs, profils et préférences",
    icon: IconUsers,
    color: "text-blue-500",
    estimatedSize: "~2-5 MB"
  },
  {
    id: "places",
    name: "Lieux & Commerces",
    description: "Établissements, coordonnées, horaires et informations",
    icon: IconBuilding,
    color: "text-green-500",
    estimatedSize: "~10-20 MB"
  },
  {
    id: "events",
    name: "Événements",
    description: "Événements créés, dates et détails",
    icon: IconCalendarEvent,
    color: "text-purple-500",
    estimatedSize: "~1-3 MB"
  },
  {
    id: "posts",
    name: "Articles & Posts",
    description: "Articles de blog, annonces et contenus",
    icon: IconArticle,
    color: "text-orange-500",
    estimatedSize: "~5-10 MB"
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Abonnés, campagnes et statistiques d'envoi",
    icon: Mail,
    color: "text-indigo-500",
    estimatedSize: "~1-2 MB"
  }
];

export default function ExportPage() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [importFile, setImportFile] = useState<File | null>(null);
  
  // États Google Drive
  const [isGDriveLoading, setIsGDriveLoading] = useState(false);
  const [gDriveFiles, setGDriveFiles] = useState<{
    files: {
      database: Array<{ id: string; name: string; size: string; createdTime: string; type: string; pairedFile?: string }>;
      uploads: Array<{ id: string; name: string; size: string; createdTime: string; type: string }>;
    };
    stats: {
      totalFiles: number;
      databaseBackups: number;
      uploadsBackups: number;
      totalSize: number;
      newestBackup: string | null;
    };
  } | null>(null);
  
  // États connexion Google Drive OAuth
  const [gDriveStatus, setGDriveStatus] = useState<{
    connected: boolean;
    googleEmail?: string;
    googleName?: string;
    lastUsedAt?: string;
  } | null>(null);

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions(prev => [...prev, optionId]);
    } else {
      setSelectedOptions(prev => prev.filter(id => id !== optionId));
    }
  };

  const handleSelectAll = () => {
    if (selectedOptions.length === exportOptions.length) {
      setSelectedOptions([]);
    } else {
      setSelectedOptions(exportOptions.map(option => option.id));
    }
  };

  const handleExport = async () => {
    if (selectedOptions.length === 0) {
      toast.error("Veuillez sélectionner au moins une catégorie de données");
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch("/api/admin/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categories: selectedOptions,
          format: exportFormat,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'export des données");
      }

      // Créer un lien de téléchargement
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `abc-bedarieux-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export terminé avec succès!");
    } catch (error) {
      console.error("Erreur d'export:", error);
      toast.error("Une erreur est survenue lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFullBackup = async () => {
    setIsExporting(true);

    try {
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde complète");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `abc-bedarieux-backup-complet-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Sauvegarde complète terminée avec succès!");
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
      toast.error("Une erreur est survenue lors de la sauvegarde complète");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Veuillez sélectionner un fichier à importer");
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const response = await fetch("/api/admin/restore", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'import");
      }

      toast.success(`Import terminé! ${result.imported} éléments importés, ${result.skipped || 0} doublons ignorés.`);
      setImportFile(null);
      
      // Reset le input file
      const fileInput = document.getElementById("import-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error) {
      console.error("Erreur d'import:", error);
      toast.error("Une erreur est survenue lors de l'import");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/json") {
      setImportFile(file);
    } else {
      toast.error("Veuillez sélectionner un fichier JSON valide");
    }
  };

  // Nouvelle fonction: Sauvegarde inventaire des fichiers
  const handleFilesInventory = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/admin/backup/files", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'inventaire des fichiers");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `files-inventory-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Inventaire des fichiers téléchargé!");
    } catch (error) {
      console.error("Erreur inventaire fichiers:", error);
      toast.error("Erreur lors de la création de l'inventaire");
    } finally {
      setIsExporting(false);
    }
  };

  // Nouvelle fonction: Dump PostgreSQL
  const handleDatabaseDump = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/admin/backup/database", {
        method: "POST"
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors du dump base de données");
      }

      toast.success("Dump PostgreSQL créé avec succès!");
      toast.info("Le fichier est sauvegardé sur le serveur dans le dossier backups/");
    } catch (error) {
      console.error("Erreur dump base:", error);
      toast.error("Erreur lors du dump de la base de données");
    } finally {
      setIsExporting(false);
    }
  };

  // Fonctions Google Drive OAuth
  const checkGDriveConnection = async () => {
    try {
      const response = await fetch("/api/admin/google-drive/status");
      const result = await response.json();

      if (response.ok) {
        setGDriveStatus(result.status);
      } else {
        setGDriveStatus({ connected: false });
      }
    } catch (error) {
      console.error("Erreur vérification Google Drive:", error);
      setGDriveStatus({ connected: false });
    }
  };

  const connectToGoogleDrive = async () => {
    setIsGDriveLoading(true);
    try {
      const response = await fetch("/api/admin/google-drive/auth", {
        method: "POST"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la génération de l'URL d'auth");
      }

      // Ouvrir l'URL d'autorisation dans une nouvelle fenêtre
      window.open(result.authUrl, "google_drive_auth", "width=500,height=600");
      
      toast.info("Autorisez l'accès à Google Drive dans la nouvelle fenêtre");
    } catch (error) {
      console.error("Erreur connexion Google Drive:", error);
      toast.error("Impossible de se connecter à Google Drive");
    } finally {
      setIsGDriveLoading(false);
    }
  };

  const disconnectFromGoogleDrive = async () => {
    if (!confirm("Êtes-vous sûr de vouloir déconnecter Google Drive? Cela révoquera l'accès aux sauvegardes.")) {
      return;
    }

    setIsGDriveLoading(true);
    try {
      const response = await fetch("/api/admin/google-drive/status", {
        method: "DELETE"
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erreur lors de la déconnexion");
      }

      setGDriveStatus({ connected: false });
      setGDriveFiles(null);
      toast.success("Google Drive déconnecté avec succès");
    } catch (error) {
      console.error("Erreur déconnexion Google Drive:", error);
      toast.error("Erreur lors de la déconnexion Google Drive");
    } finally {
      setIsGDriveLoading(false);
    }
  };

  // Écouter les messages de la fenêtre d'auth (callback)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_DRIVE_AUTH_SUCCESS') {
        toast.success("Google Drive connecté avec succès!");
        checkGDriveConnection();
      } else if (event.data.type === 'GOOGLE_DRIVE_AUTH_ERROR') {
        toast.error("Erreur lors de la connexion Google Drive");
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Vérifier la connexion au chargement de la page
  useEffect(() => {
    checkGDriveConnection();
  }, []);

  // Fonctions Google Drive (existantes)
  const fetchGDriveFiles = async () => {
    setIsGDriveLoading(true);
    try {
      const response = await fetch("/api/admin/backup/google-drive/list");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la récupération des fichiers");
      }

      setGDriveFiles(result.data);
      toast.success("Liste des sauvegardes Google Drive chargée!");
    } catch (error) {
      console.error("Erreur Google Drive:", error);
      toast.error("Impossible de récupérer les sauvegardes Google Drive");
    } finally {
      setIsGDriveLoading(false);
    }
  };

  const handleGDriveBackupDatabase = async () => {
    setIsGDriveLoading(true);
    try {
      const response = await fetch("/api/admin/backup/google-drive/database", {
        method: "POST"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la sauvegarde Google Drive");
      }

      toast.success("Base de données sauvegardée sur Google Drive!");
      toast.info(`Fichier: ${result.details.sqlFile.name}`);
      
      // Recharger la liste des fichiers
      await fetchGDriveFiles();
    } catch (error) {
      console.error("Erreur sauvegarde Google Drive:", error);
      toast.error("Erreur lors de la sauvegarde Google Drive");
    } finally {
      setIsGDriveLoading(false);
    }
  };

  const handleGDriveBackupUploads = async () => {
    setIsGDriveLoading(true);
    try {
      const response = await fetch("/api/admin/backup/google-drive/uploads", {
        method: "POST"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la sauvegarde uploads");
      }

      toast.success("Dossier uploads sauvegardé sur Google Drive!");
      toast.info(`Fichier: ${result.details.fileName}`);
      
      // Recharger la liste des fichiers
      await fetchGDriveFiles();
    } catch (error) {
      console.error("Erreur sauvegarde uploads:", error);
      toast.error("Erreur lors de la sauvegarde des uploads");
    } finally {
      setIsGDriveLoading(false);
    }
  };

  const handleGDriveRestoreDatabase = async (sqlFileId: string, metadataFileId?: string) => {
    if (!confirm("⚠️ ATTENTION: Cette opération va écraser votre base de données actuelle. Êtes-vous sûr de vouloir continuer?")) {
      return;
    }

    setIsGDriveLoading(true);
    try {
      const response = await fetch("/api/admin/restore/google-drive/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sqlFileId,
          metadataFileId,
          confirmReplace: true
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la restauration");
      }

      toast.success("Base de données restaurée depuis Google Drive!");
      toast.info("Une sauvegarde de sécurité a été créée avant la restauration");
    } catch (error) {
      console.error("Erreur restauration:", error);
      toast.error("Erreur lors de la restauration Google Drive");
    } finally {
      setIsGDriveLoading(false);
    }
  };

  const handleGDriveRestoreUploads = async (fileId: string) => {
    const replaceExisting = confirm("Voulez-vous remplacer les fichiers uploads existants? (Annuler = fusionner)");

    setIsGDriveLoading(true);
    try {
      const response = await fetch("/api/admin/restore/google-drive/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          replaceExisting
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la restauration");
      }

      toast.success("Uploads restaurés depuis Google Drive!");
      if (replaceExisting) {
        toast.info("Les anciens uploads ont été sauvegardés avant remplacement");
      }
    } catch (error) {
      console.error("Erreur restauration uploads:", error);
      toast.error("Erreur lors de la restauration des uploads");
    } finally {
      setIsGDriveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export des données</h1>
        <p className="text-muted-foreground">
          Exportez les données de la plateforme pour sauvegarde ou analyse.
        </p>
      </div>

      {/* Format d'export */}
      <Card>
        <CardHeader>
          <CardTitle>Format d&apos;export</CardTitle>
          <CardDescription>
            Choisissez le format de fichier pour votre export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="json"
                name="format"
                value="json"
                checked={exportFormat === "json"}
                onChange={(e) => setExportFormat(e.target.value as "json" | "csv")}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
              />
              <label htmlFor="json" className="text-sm font-medium">
                JSON
              </label>
              <Badge variant="secondary" className="text-xs">
                Structure complète
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="csv"
                name="format"
                value="csv"
                checked={exportFormat === "csv"}
                onChange={(e) => setExportFormat(e.target.value as "json" | "csv")}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
              />
              <label htmlFor="csv" className="text-sm font-medium">
                CSV
              </label>
              <Badge variant="secondary" className="text-xs">
                Compatible tableur
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sélection des données */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Données à exporter</CardTitle>
              <CardDescription>
                Sélectionnez les catégories de données que vous souhaitez inclure
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedOptions.length === exportOptions.length ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedOptions.includes(option.id);
              
              return (
                <div
                  key={option.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                  onClick={() => handleOptionChange(option.id, !isSelected)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => {}} // Géré par le onClick du conteneur
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-5 w-5 ${option.color}`} />
                      <span className="font-medium">{option.name}</span>
                      {option.estimatedSize && (
                        <Badge variant="outline" className="text-xs">
                          {option.estimatedSize}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions d'export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconDatabase className="h-5 w-5" />
            Lancer l&apos;export
          </CardTitle>
          <CardDescription>
            {selectedOptions.length > 0 
              ? `${selectedOptions.length} catégorie${selectedOptions.length > 1 ? 's' : ''} sélectionnée${selectedOptions.length > 1 ? 's' : ''}`
              : "Aucune catégorie sélectionnée"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleExport}
              disabled={selectedOptions.length === 0 || isExporting}
              size="lg"
              className="flex-1 sm:flex-initial"
            >
              {isExporting ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <IconDownload className="h-4 w-4 mr-2" />
                  Export sélection
                </>
              )}
            </Button>
            
            <Button
              onClick={handleFullBackup}
              disabled={isExporting}
              size="lg"
              variant="secondary"
              className="flex-1 sm:flex-initial"
            >
              {isExporting ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <IconArchive className="h-4 w-4 mr-2" />
                  Tout sauvegarder
                </>
              )}
            </Button>
          </div>
          
          {selectedOptions.length > 0 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Données sélectionnées:</strong>
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map(optionId => {
                  const option = exportOptions.find(o => o.id === optionId);
                  return option ? (
                    <Badge key={optionId} variant="secondary" className="text-xs">
                      {option.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section d'import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUpload className="h-5 w-5" />
            Importer des données
          </CardTitle>
          <CardDescription>
            Restaurer des données depuis un fichier de sauvegarde JSON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="import-file" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Fichier de sauvegarde
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {importFile && (
                <p className="text-xs text-muted-foreground">
                  Fichier sélectionné: {importFile.name} ({Math.round(importFile.size / 1024)} KB)
                </p>
              )}
            </div>
            
            <Button
              onClick={handleImport}
              disabled={!importFile || isImporting}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isImporting ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <IconUpload className="h-4 w-4 mr-2" />
                  Importer les données
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-1">🔍 Détection automatique des doublons</h4>
            <p className="text-xs text-blue-700">
              L&apos;import vérifie automatiquement les doublons basés sur les clés uniques (email, slug, etc.) pour éviter d&apos;écraser les données existantes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sauvegardes avancées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconShield className="h-5 w-5 text-green-600" />
            Sauvegardes Avancées
          </CardTitle>
          <CardDescription>
            Outils de sauvegarde complète pour la récupération d&apos;urgence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Inventaire des fichiers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconFiles className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Inventaire Fichiers</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Liste complète des fichiers uploads avec tailles et dates
              </p>
              <Button
                onClick={handleFilesInventory}
                disabled={isExporting}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {isExporting ? (
                  <IconLoader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <IconFiles className="h-3 w-3 mr-2" />
                )}
                Télécharger
              </Button>
            </div>

            {/* Dump PostgreSQL */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconDatabase className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium">Dump PostgreSQL</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Sauvegarde SQL complète de la base de données
              </p>
              <Button
                onClick={handleDatabaseDump}
                disabled={isExporting}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {isExporting ? (
                  <IconLoader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <IconDatabase className="h-3 w-3 mr-2" />
                )}
                Créer Dump
              </Button>
            </div>

            {/* Documentation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconArchive className="h-4 w-4 text-orange-600" />
                <h4 className="font-medium">Guide de Restauration</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Instructions complètes pour la récupération d&apos;urgence
              </p>
              <Button
                onClick={() => window.open('/BACKUP_GUIDE.md', '_blank')}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <IconArchive className="h-3 w-3 mr-2" />
                Voir Guide
              </Button>
            </div>
          </div>

          {/* Section de statut de sauvegarde */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <IconShield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-2">🛡️ Statut de Protection des Données</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-medium text-green-800">✅ Maintenant Protégé:</p>
                    <ul className="text-green-700 mt-1 space-y-1">
                      <li>• Toutes les données utilisateurs</li>
                      <li>• Données ABC association</li>
                      <li>• Newsletter complète</li>
                      <li>• Places et événements</li>
                      <li>• Conversations WhatsApp</li>
                      <li>• Système de restauration</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-orange-800">⚠️ Sauvegarde Manuelle:</p>
                    <ul className="text-orange-700 mt-1 space-y-1">
                      <li>• Fichiers uploads (images)</li>
                      <li>• Variables d&apos;environnement</li>
                      <li>• Sessions utilisateur</li>
                      <li>• Configuration serveur</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Drive Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCloud className="h-5 w-5 text-blue-600" />
            Google Drive - Sauvegarde Cloud
          </CardTitle>
          <CardDescription>
            Sauvegardez et restaurez vos données directement vers/depuis Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            {/* Statut de connexion Google Drive */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${gDriveStatus?.connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <h4 className="font-medium">
                      {gDriveStatus?.connected ? 'Connecté à Google Drive' : 'Non connecté'}
                    </h4>
                    {gDriveStatus?.connected && gDriveStatus.googleEmail && (
                      <p className="text-sm text-muted-foreground">
                        {gDriveStatus.googleName} ({gDriveStatus.googleEmail})
                      </p>
                    )}
                    {gDriveStatus?.connected && gDriveStatus.lastUsedAt && (
                      <p className="text-xs text-muted-foreground">
                        Dernière utilisation: {new Date(gDriveStatus.lastUsedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Boutons de connexion/déconnexion */}
                <div className="flex gap-2">
                  {gDriveStatus?.connected ? (
                    <Button
                      onClick={disconnectFromGoogleDrive}
                      disabled={isGDriveLoading}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      {isGDriveLoading ? (
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <IconX className="h-4 w-4 mr-2" />
                      )}
                      Déconnecter
                    </Button>
                  ) : (
                    <Button
                      onClick={connectToGoogleDrive}
                      disabled={isGDriveLoading}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isGDriveLoading ? (
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <IconCloud className="h-4 w-4 mr-2" />
                      )}
                      Se connecter
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions de sauvegarde */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <IconUpload className="h-4 w-4" />
                  Sauvegarder vers Google Drive
                </h4>
                <div className="space-y-2">
                  <Button
                    onClick={handleGDriveBackupDatabase}
                    disabled={isGDriveLoading || !gDriveStatus?.connected}
                    size="sm"
                    className="w-full justify-start"
                  >
                    {isGDriveLoading ? (
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <IconDatabase className="h-4 w-4 mr-2" />
                    )}
                    Base de données
                  </Button>
                  <Button
                    onClick={handleGDriveBackupUploads}
                    disabled={isGDriveLoading || !gDriveStatus?.connected}
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {isGDriveLoading ? (
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <IconFiles className="h-4 w-4 mr-2" />
                    )}
                    Dossier uploads
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <IconDownload className="h-4 w-4" />
                  Gérer les sauvegardes
                </h4>
                <div className="space-y-2">
                  <Button
                    onClick={fetchGDriveFiles}
                    disabled={isGDriveLoading || !gDriveStatus?.connected}
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {isGDriveLoading ? (
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <IconCloud className="h-4 w-4 mr-2" />
                    )}
                    Charger la liste
                  </Button>
                </div>
              </div>
            </div>

            {/* Liste des sauvegardes Google Drive */}
            {gDriveFiles && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Sauvegardes Google Drive</h4>
                  <Badge variant="outline">
                    {gDriveFiles.stats.totalFiles} fichier{gDriveFiles.stats.totalFiles > 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <div className="font-medium text-blue-600">{gDriveFiles.stats.databaseBackups}</div>
                    <div className="text-muted-foreground">BDD</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">{gDriveFiles.stats.uploadsBackups}</div>
                    <div className="text-muted-foreground">Uploads</div>
                  </div>
                  <div>
                    <div className="font-medium text-orange-600">
                      {Math.round(gDriveFiles.stats.totalSize / (1024 * 1024))} MB
                    </div>
                    <div className="text-muted-foreground">Taille</div>
                  </div>
                  <div>
                    <div className="font-medium text-purple-600">
                      {gDriveFiles.stats.newestBackup ? new Date(gDriveFiles.stats.newestBackup).toLocaleDateString() : '-'}
                    </div>
                    <div className="text-muted-foreground">Dernier</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Base de données */}
                  {gDriveFiles.files.database.filter(f => f.type === 'sql').length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm text-blue-600 mb-2">📊 Base de données</h5>
                      <div className="space-y-2">
                        {gDriveFiles.files.database.filter(f => f.type === 'sql').map(file => (
                          <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1">
                              <div className="font-mono text-xs">{file.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {parseInt(file.size) > 0 
                                  ? `${Math.round(parseInt(file.size) / 1024)} KB` 
                                  : 'Taille en cours...'} - {new Date(file.createdTime).toLocaleString()}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleGDriveRestoreDatabase(file.id, file.pairedFile)}
                              size="sm"
                              variant="outline"
                              disabled={isGDriveLoading}
                              className="text-xs"
                            >
                              <IconRestore className="h-3 w-3 mr-1" />
                              Restaurer
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uploads */}
                  {gDriveFiles.files.uploads.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm text-green-600 mb-2">📁 Uploads</h5>
                      <div className="space-y-2">
                        {gDriveFiles.files.uploads.map(file => (
                          <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1">
                              <div className="font-mono text-xs">{file.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {parseInt(file.size) > 0 
                                  ? `${Math.round(parseInt(file.size) / (1024 * 1024))} MB` 
                                  : 'Taille en cours...'} - {new Date(file.createdTime).toLocaleString()}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleGDriveRestoreUploads(file.id)}
                              size="sm"
                              variant="outline"
                              disabled={isGDriveLoading}
                              className="text-xs"
                            >
                              <IconRestore className="h-3 w-3 mr-1" />
                              Restaurer
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gDriveFiles.stats.totalFiles === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Aucune sauvegarde trouvée sur Google Drive
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Information de configuration OAuth */}
            {!gDriveStatus?.connected && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-1">🔧 Configuration OAuth Google Drive</h4>
                <p className="text-xs text-blue-700">
                  Pour utiliser Google Drive, configurez les variables d&apos;environnement OAuth:
                  <code className="block mt-1 p-1 bg-blue-100 rounded text-xs">
                    GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI
                  </code>
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  ℹ️ Cliquez sur &quot;Se connecter&quot; pour autoriser l&apos;accès à votre Google Drive (admin uniquement)
                </p>
              </div>
            )}
            
            {gDriveStatus?.connected && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 mb-1">✅ Google Drive Configuré</h4>
                <p className="text-xs text-green-700">
                  Vous pouvez maintenant sauvegarder et restaurer vos données via Google Drive.
                  Les sauvegardes sont stockées dans le dossier &quot;ABC-Bedarieux-Backups&quot;.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations importantes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-600">⚠️ Informations importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Les exports contiennent des données personnelles sensibles (RGPD)
          </p>
          <p className="text-sm text-muted-foreground">
            • Assurez-vous de sécuriser les fichiers téléchargés
          </p>
          <p className="text-sm text-muted-foreground">
            • Les exports volumineux peuvent prendre plusieurs minutes
          </p>
          <p className="text-sm text-muted-foreground">
            • Les mots de passe et tokens d&apos;authentification ne sont jamais exportés
          </p>
        </CardContent>
      </Card>
    </div>
  );
}