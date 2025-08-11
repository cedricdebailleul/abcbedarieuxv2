"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { z } from "zod";

const acceptInvitationSchema = z.object({
  firstname: z.string().min(1, "Le prénom est obligatoire"),
  lastname: z.string().min(1, "Le nom est obligatoire"),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const role = searchParams.get("role") as "user" | "admin" | "moderator" | "dpo" | "editor";

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    password: "",
    confirmPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!token || !email || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>
                Lien d'invitation invalide. Veuillez vérifier votre email ou contactez un administrateur.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrors({});

    try {
      // Validation côté client
      const validatedData = acceptInvitationSchema.parse(formData);

      const response = await fetch("/api/admin/users/accept-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          role,
          ...validatedData,
        }),
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
      
      // Rediriger vers la page de validation avec feu d'artifice
      setTimeout(() => {
        const params = new URLSearchParams({
          name: validatedData.name,
          email: email,
        });
        router.push(`/account-created?${params.toString()}`);
      }, 1000);

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Compte créé avec succès !
            </h2>
            <p className="text-gray-600 mb-4">
              Votre compte a été créé. Vous allez être redirigé vers la page de connexion.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Finaliser votre inscription</CardTitle>
          <CardDescription>
            Vous avez été invité(e) à rejoindre ABC Bédarieux en tant que{" "}
            <strong>{getRoleLabel(role)}</strong>
            <br />
            <span className="text-sm text-gray-500">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">Prénom *</Label>
                <Input
                  id="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                  placeholder="John"
                  className={errors.firstname ? "border-red-500" : ""}
                  disabled={loading}
                  required
                />
                {errors.firstname && (
                  <p className="text-sm text-red-500">{errors.firstname}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Nom *</Label>
                <Input
                  id="lastname"
                  type="text"
                  value={formData.lastname}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                  placeholder="Doe"
                  className={errors.lastname ? "border-red-500" : ""}
                  disabled={loading}
                  required
                />
                {errors.lastname && (
                  <p className="text-sm text-red-500">{errors.lastname}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Création du compte..." : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-4 text-xs text-gray-500">
            <p>
              * Champs obligatoires
            </p>
            <p className="mt-1">
              Le mot de passe doit contenir au moins 8 caractères avec une minuscule,
              une majuscule et un chiffre.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}