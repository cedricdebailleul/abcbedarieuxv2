"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportReport {
  created: number;
  updated: number;
  skipped: number;
  errors: { line: number; email: string; message: string }[];
}

interface ImportMembersDialogProps {
  onSuccess: () => void;
}

export function ImportMembersDialog({ onSuccess }: ImportMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setReport(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/abc/members/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'import");
        return;
      }

      setReport(data.report);
      if (data.report.created > 0 || data.report.updated > 0) {
        onSuccess();
      }
    } catch {
      setLoading(false);
      setError("Erreur réseau, veuillez réessayer.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des membres</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Formats acceptés : CSV ou Excel (.xlsx). Le fichier doit contenir les colonnes{" "}
            <code className="rounded bg-muted px-1">action</code> et{" "}
            <code className="rounded bg-muted px-1">email</code>. Actions disponibles :{" "}
            <code className="rounded bg-muted px-1">create</code>,{" "}
            <code className="rounded bg-muted px-1">update</code>,{" "}
            <code className="rounded bg-muted px-1">skip</code>.
          </p>

          {!report && (
            <Button
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => fileRef.current?.click()}
            >
              {loading ? "Import en cours..." : "Choisir un fichier"}
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleUpload}
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {report && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Créés", value: report.created, color: "text-green-600" },
                  { label: "Mis à jour", value: report.updated, color: "text-blue-600" },
                  { label: "Ignorés", value: report.skipped, color: "text-muted-foreground" },
                  { label: "Erreurs", value: report.errors.length, color: "text-red-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded border p-2">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {report.errors.length > 0 && (
                <div className="max-h-40 overflow-auto rounded border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-1 text-left">Ligne</th>
                        <th className="px-2 py-1 text-left">Email</th>
                        <th className="px-2 py-1 text-left">Erreur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.errors.map((e, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1">{e.line}</td>
                          <td className="px-2 py-1">{e.email}</td>
                          <td className="px-2 py-1 text-red-600">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReport(null);
                    setError(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  Nouvel import
                </Button>
                <Button size="sm" onClick={() => setOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
