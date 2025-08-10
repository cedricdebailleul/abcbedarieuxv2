"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["user", "admin", "moderator", "dpo", "editor"]),
  message: z.string().optional(),
});

interface InviteUserDialogProps {
  children: React.ReactNode;
}

export default function InviteUserDialog({ children }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "" as "user" | "admin" | "moderator" | "dpo" | "editor" | "",
    message: "",
  });
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrors({});

    try {
      // Validation côté client
      const validatedData = inviteSchema.parse(formData);

      const response = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          // Erreurs de validation Zod
          const newErrors: Record<string, string> = {};
          data.details.forEach((error: any) => {
            newErrors[error.path[0]] = error.message;
          });
          setErrors(newErrors);
        } else {
          setError(data.error || "Une erreur est survenue");
        }
        return;
      }

      setSuccess(true);
      toast.success("Invitation envoyée avec succès");
      
      // Fermer le dialog après 2 secondes
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 2000);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
      } else {
        setError("Une erreur est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      role: "",
      message: "",
    });
    setError("");
    setErrors({});
    setSuccess(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      user: "Utilisateur",
      admin: "Administrateur",
      moderator: "Modérateur",
      dpo: "Délégué à la protection des données",
      editor: "Éditeur"
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleDescription = (role: string) => {
    const descriptions = {
      user: "Accès basique à la plateforme",
      admin: "Accès complet à l'administration",
      moderator: "Modération des contenus et utilisateurs",
      dpo: "Gestion des données personnelles et RGPD",
      editor: "Création et édition de contenu"
    };
    return descriptions[role as keyof typeof descriptions] || "";
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <DialogTitle className="text-xl mb-2">
              Invitation envoyée !
            </DialogTitle>
            <DialogDescription>
              L'invitation a été envoyée à <strong>{formData.email}</strong>.
              <br />
              L'utilisateur recevra un email avec un lien pour créer son compte.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un utilisateur</DialogTitle>
          <DialogDescription>
            Envoyez une invitation par email pour qu'un nouvel utilisateur
            puisse rejoindre la plateforme.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="utilisateur@exemple.com"
                className={errors.email ? "border-red-500 pl-10" : "pl-10"}
                disabled={loading}
                required
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData({ ...formData, role: value as any })}
            >
              <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionnez un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div>
                    <div className="font-medium">Utilisateur</div>
                    <div className="text-xs text-gray-500">Accès basique à la plateforme</div>
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div>
                    <div className="font-medium">Éditeur</div>
                    <div className="text-xs text-gray-500">Création et édition de contenu</div>
                  </div>
                </SelectItem>
                <SelectItem value="moderator">
                  <div>
                    <div className="font-medium">Modérateur</div>
                    <div className="text-xs text-gray-500">Modération des contenus et utilisateurs</div>
                  </div>
                </SelectItem>
                <SelectItem value="dpo">
                  <div>
                    <div className="font-medium">DPO</div>
                    <div className="text-xs text-gray-500">Gestion des données personnelles et RGPD</div>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div>
                    <div className="font-medium">Administrateur</div>
                    <div className="text-xs text-gray-500">Accès complet à l'administration</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role}</p>
            )}
            {formData.role && (
              <p className="text-xs text-gray-600">
                {getRoleDescription(formData.role)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message personnalisé (optionnel)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Ajoutez un message personnalisé à l'invitation..."
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Ce message sera inclus dans l'email d'invitation.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer l'invitation"}
            </Button>
          </DialogFooter>
        </form>

        <div className="text-xs text-gray-500 border-t pt-4">
          <p>
            <strong>Note :</strong> L'invitation expirera dans 7 jours.
            L'utilisateur devra créer son compte avant cette date.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}