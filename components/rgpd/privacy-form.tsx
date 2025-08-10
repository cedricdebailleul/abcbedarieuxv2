"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  exportUserDataAction,
  deleteUserDataAction,
} from "@/actions/gdpr-simple";
import { Download, Trash2 } from "lucide-react";

export function PrivacyForms() {
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
          <form
            action={async () => {
              await exportUserDataAction();
            }}
          >
            <Button type="submit" className="w-full">
              Télécharger mes données
            </Button>
          </form>
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
          <form
            action={async () => {
              await deleteUserDataAction();
            }}
          >
            <Button type="submit" variant="destructive" className="w-full">
              Supprimer mon compte
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
