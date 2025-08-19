"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconLoader2 } from "@tabler/icons-react";

interface Payment {
  id: string;
  amount: number;
  mode: string;
  status: string;
  year: number;
  quarter: number | null;
  checkNumber: string | null;
  transferReference: string | null;
  notes: string | null;
  dueDate: string | null;
  paidAt: string | null;
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

interface EditPaymentDialogProps {
  payment: Payment;
  onSuccess: () => void;
  onCancel: () => void;
}

const modeLabels = {
  CHEQUE: "Chèque",
  CASH: "Espèces",
  TRANSFER: "Virement",
  CARD: "Carte bancaire",
};

const statusLabels = {
  PENDING: "En attente",
  PAID: "Payé",
  OVERDUE: "En retard",
  CANCELLED: "Annulé",
};

export function EditPaymentDialog({ payment, onSuccess, onCancel }: EditPaymentDialogProps) {
  const [amount, setAmount] = useState(payment.amount.toString());
  const [mode, setMode] = useState(payment.mode);
  const [status, setStatus] = useState(payment.status);
  const [year, setYear] = useState(payment.year.toString());
  const [quarter, setQuarter] = useState(payment.quarter?.toString() || "");
  const [checkNumber, setCheckNumber] = useState(payment.checkNumber || "");
  const [transferReference, setTransferReference] = useState(payment.transferReference || "");
  const [notes, setNotes] = useState(payment.notes || "");
  const [dueDate, setDueDate] = useState(() => {
    if (payment.dueDate) {
      return new Date(payment.dueDate).toISOString().split("T")[0];
    }
    return "";
  });
  const [paidAt, setPaidAt] = useState(() => {
    if (payment.paidAt) {
      return new Date(payment.paidAt).toISOString().split("T")[0];
    }
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !mode || !year) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (mode === "CHEQUE" && !checkNumber) {
      setError("Le numéro de chèque est obligatoire pour ce mode de paiement");
      return;
    }

    if (mode === "TRANSFER" && !transferReference) {
      setError("La référence de virement est obligatoire pour ce mode de paiement");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const updateData: any = {
        amount: parseFloat(amount),
        mode,
        status,
        year: parseInt(year),
        notes: notes || null,
        dueDate: dueDate || null,
        paidAt: paidAt || null,
      };

      if (quarter) {
        updateData.quarter = parseInt(quarter);
      } else {
        updateData.quarter = null;
      }

      if (mode === "CHEQUE") {
        updateData.checkNumber = checkNumber || null;
        updateData.transferReference = null;
      } else if (mode === "TRANSFER") {
        updateData.transferReference = transferReference || null;
        updateData.checkNumber = null;
      } else {
        updateData.checkNumber = null;
        updateData.transferReference = null;
      }

      const response = await fetch(`/api/admin/abc/payments/${payment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la modification");
      }

      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i + 1);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Informations membre (lecture seule) */}
      <div className="space-y-2">
        <Label>Membre</Label>
        <div className="p-2 bg-muted rounded-md">
          <div className="font-medium">{payment.member.user.name}</div>
          <div className="text-sm text-muted-foreground">
            {payment.member.type}
            {payment.member.memberNumber && ` • ${payment.member.memberNumber}`}
          </div>
        </div>
      </div>

      {/* Montant */}
      <div className="space-y-2">
        <Label htmlFor="amount">Montant (€) *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {/* Mode de paiement */}
      <div className="space-y-2">
        <Label>Mode de paiement *</Label>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(modeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Numéro de chèque (si mode = CHEQUE) */}
      {mode === "CHEQUE" && (
        <div className="space-y-2">
          <Label htmlFor="check-number">Numéro de chèque *</Label>
          <Input
            id="check-number"
            placeholder="ex: 1234567"
            value={checkNumber}
            onChange={(e) => setCheckNumber(e.target.value)}
          />
        </div>
      )}

      {/* Référence de virement (si mode = TRANSFER) */}
      {mode === "TRANSFER" && (
        <div className="space-y-2">
          <Label htmlFor="transfer-ref">Référence de virement *</Label>
          <Input
            id="transfer-ref"
            placeholder="ex: VIR123456"
            value={transferReference}
            onChange={(e) => setTransferReference(e.target.value)}
          />
        </div>
      )}

      {/* Statut */}
      <div className="space-y-2">
        <Label>Statut *</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Année */}
      <div className="space-y-2">
        <Label>Année *</Label>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trimestre */}
      <div className="space-y-2">
        <Label>Trimestre (optionnel)</Label>
        <Select value={quarter} onValueChange={setQuarter}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un trimestre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Annuel</SelectItem>
            <SelectItem value="1">T1 (Jan-Mar)</SelectItem>
            <SelectItem value="2">T2 (Avr-Jun)</SelectItem>
            <SelectItem value="3">T3 (Jul-Sep)</SelectItem>
            <SelectItem value="4">T4 (Oct-Déc)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date d'échéance */}
      <div className="space-y-2">
        <Label htmlFor="due-date">Date d'échéance (optionnel)</Label>
        <Input
          id="due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      {/* Date de paiement */}
      <div className="space-y-2">
        <Label htmlFor="paid-at">Date de paiement (optionnel)</Label>
        <Input
          id="paid-at"
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Notes additionnelles..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          Modifier le paiement
        </Button>
      </div>
    </form>
  );
}