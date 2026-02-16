"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "../_components/AuthLayout";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setMessage({
        type: "error",
        text: "Lien de réinitialisation invalide ou expiré.",
      });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }

    if (password.length < 8) {
      setMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères." });
      return;
    }

    if (!token) {
      setMessage({ type: "error", text: "Token manquant." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Votre mot de passe a été réinitialisé avec succès. Redirection...",
        });
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Impossible de réinitialiser le mot de passe.",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Une erreur est survenue. Veuillez réessayer." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader className="space-y-1 px-0 pb-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl text-center">Nouveau mot de passe</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          Choisissez un mot de passe sécurisé
        </p>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "border-green-200 bg-green-50 text-green-700" : ""}>
              <AlertDescription className="text-sm">{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs sm:text-sm">Nouveau mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || !token}
              minLength={8}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">Confirmer</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading || !token}
              minLength={8}
              className="text-sm"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !token}>
            {isLoading ? "Réinitialisation..." : "Réinitialiser"}
          </Button>
        </form>

        <div className="text-center pt-4">
          <Link href="/login" className="text-xs sm:text-sm text-muted-foreground hover:text-primary underline underline-offset-4">
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader className="space-y-1 px-0 pb-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl text-center">Nouveau mot de passe</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground text-center">Chargement...</p>
      </CardHeader>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Créez un nouveau mot de passe"
      description="Choisissez un mot de passe sécurisé pour protéger votre compte."
      image="https://images.unsplash.com/photo-1633265486064-086b219458ec?q=80&w=1920&auto=format&fit=crop"
    >
      <Suspense fallback={<LoadingCard />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
