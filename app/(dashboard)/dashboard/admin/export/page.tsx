"use client";

import { useState } from "react";
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
  IconLoader2} from "@tabler/icons-react";
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