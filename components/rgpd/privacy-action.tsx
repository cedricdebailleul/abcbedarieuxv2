"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  exportUserDataAction,
  deleteUserDataAction,
} from "@/actions/gdpr-simple";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function PrivacyActions() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      const result = await exportUserDataAction();

      if (result.errors) {
        toast.error("Impossible d'exporter vos données");
      } else {
        // Créer un fichier de téléchargement
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `mes-donnees-${
          new Date().toISOString().split("T")[0]
        }.json`;
        link.click();

        URL.revokeObjectURL(url);

        toast.success("Données exportées avec succès");
      }
    } catch (error) {
      toast.error("Une erreur s'est produite lors de l'export des données");
    }

    setIsExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible."
      )
    ) {
      return;
    }

    if (
      !confirm(
        "ATTENTION : Toutes vos données seront supprimées définitivement. Confirmez-vous ?"
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteUserDataAction();

      if (result.errors) {
        toast.error("Impossible de supprimer votre compte");
      } else {
        toast.success("Votre compte a été supprimé avec succès");

        // Rediriger vers la page d'accueil après 2 secondes
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la suppression du compte");
    }

    setIsDeleting(false);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exporter mes données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Téléchargez toutes vos données dans un fichier JSON.
          </p>
          <Button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? "Export en cours..." : "Télécharger mes données"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Supprimer mon compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Supprimez définitivement votre compte et toutes vos données
            associées.
          </p>
          <Button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            variant="destructive"
            className="w-full"
          >
            {isDeleting ? "Suppression..." : "Supprimer mon compte"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
