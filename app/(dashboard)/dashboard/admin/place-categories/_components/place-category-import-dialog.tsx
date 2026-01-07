"use client";

import { useState } from "react";
import { Upload, FileJson, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PlaceCategoryImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<{ created: number; updated: number; errors: number } | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStats(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    setStats(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/place-categories/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setStats(data.stats);
      toast.success("Import effectué avec succès");
      router.refresh();
    } catch (error) {
      console.error("Erreur import:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'import");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStats(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importer JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importer des catégories</DialogTitle>
          <DialogDescription>
            Importez un fichier JSON contenant les catégories. Cela mettra à jour les catégories existantes (couleurs, icônes) ou en créera de nouvelles.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file">Fichier JSON</Label>
            <Input
              id="file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </div>

          {stats && (
            <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Import terminé</AlertTitle>
              <AlertDescription>
                {stats.created} créées, {stats.updated} mises à jour, {stats.errors} erreurs.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleReset}>
            Fermer
          </Button>
          <Button 
            type="button" 
            onClick={handleImport} 
            disabled={!file || isLoading}
          >
            {isLoading ? "Import en cours..." : "Lancer l'import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
