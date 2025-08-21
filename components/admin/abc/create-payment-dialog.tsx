"use client";

import { useState, useEffect } from "react";
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
import z from "zod";

interface Member {
  id: string;
  type: string;
  memberNumber: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CreatePaymentDialogProps {
  onSuccess: () => void;
}

const modeLabels = {
  CHEQUE: "Chèque",
  ESPECE: "Espèces",
  VIREMENT: "Virement",
};

const statusLabels = {
  PENDING: "En attente",
  PAID: "Payé",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

export function CreatePaymentDialog({ onSuccess }: CreatePaymentDialogProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quarter, setQuarter] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await fetch(
        "/api/admin/abc/members?limit=100&status=ACTIVE"
      );
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberId || !amount || !mode || !year) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (mode === "CHEQUE" && !checkNumber) {
      setError("Le numéro de chèque est obligatoire pour ce mode de paiement");
      return;
    }

    if (mode === "VIREMENT" && !reference) {
      setError(
        "La référence de virement est obligatoire pour ce mode de paiement"
      );
      return;
    }

    if (status === "PAID" && !paidAt) {
      setError(
        "La date de paiement est obligatoire pour un paiement marqué comme payé"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      interface PaymentData {
        memberId: string;
        amount: number;
        mode: string;
        status: string;
        year: number;
        notes: string | null;
        paidAt: string | null;
        quarter?: number;
        checkNumber?: string;
        reference?: string;
      }

      const paymentData: PaymentData = {
        memberId,
        amount: parseFloat(amount),
        mode,
        status,
        year: parseInt(year),
        notes: notes || null,
        paidAt: paidAt ? new Date(paidAt).toISOString() : null,
      };

      if (quarter && quarter !== "annual") {
        paymentData.quarter = parseInt(quarter);
      }

      if (mode === "CHEQUE" && checkNumber) {
        paymentData.checkNumber = checkNumber;
      }

      if (mode === "VIREMENT" && reference) {
        paymentData.reference = reference;
      }

      console.log("Sending payment data:", paymentData);

      const response = await fetch("/api/admin/abc/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);

        // Si c'est une erreur de validation Zod, afficher les détails
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details
            .map(
              (detail: z.core.$ZodIssue) =>
                `${detail.path.join(".")}: ${detail.message}`
            )
            .join(", ");
          throw new Error(`Erreur de validation: ${validationErrors}`);
        }

        throw new Error(errorData.error || "Erreur lors de la création");
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

      {/* Sélection du membre */}
      <div className="space-y-2">
        <Label>Membre *</Label>
        {loadingMembers ? (
          <div className="text-sm text-muted-foreground">
            Chargement des membres...
          </div>
        ) : (
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un membre" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.user.name} - {member.type}
                  {member.memberNumber && ` (${member.memberNumber})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Montant */}
      <div className="space-y-2">
        <Label htmlFor="amount">Montant (€) *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="ex: 50.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {/* Mode de paiement */}
      <div className="space-y-2">
        <Label>Mode de paiement *</Label>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un mode" />
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

      {/* Référence de virement (si mode = VIREMENT) */}
      {mode === "VIREMENT" && (
        <div className="space-y-2">
          <Label htmlFor="reference">Référence de virement *</Label>
          <Input
            id="reference"
            placeholder="ex: VIR123456"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
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
            <SelectItem value="annual">Annuel</SelectItem>
            <SelectItem value="1">T1 (Jan-Mar)</SelectItem>
            <SelectItem value="2">T2 (Avr-Jun)</SelectItem>
            <SelectItem value="3">T3 (Jul-Sep)</SelectItem>
            <SelectItem value="4">T4 (Oct-Déc)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date de paiement */}
      {status === "PAID" && (
        <div className="space-y-2">
          <Label htmlFor="paid-at">Date de paiement *</Label>
          <Input
            id="paid-at"
            type="datetime-local"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />
        </div>
      )}

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
        <Button type="submit" disabled={loading}>
          {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer le paiement
        </Button>
      </div>
    </form>
  );
}
