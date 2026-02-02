"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "../_components/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception.",
        });
        setEmail("");
      } else {
        setMessage({
          type: "error",
          text: data.error || "Une erreur est survenue. Veuillez réessayer.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Impossible de traiter votre demande. Veuillez réessayer plus tard.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Mot de passe oublié ?"
      description="Pas de panique ! Entrez votre email et nous vous enverrons un lien de réinitialisation."
      image="https://images.unsplash.com/photo-1633265486064-086b219458ec?q=80&w=1920&auto=format&fit=crop"
    >
      <Card className="border-0 shadow-none sm:border sm:shadow-lg">
        <CardHeader className="space-y-1 px-0 pb-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl text-center">Réinitialiser le mot de passe</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            Entrez votre email pour recevoir un lien
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
              <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="text-sm"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
            </Button>
          </form>

          <div className="text-center pt-4">
            <Link
              href="/login"
              className="text-xs sm:text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
            >
              Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
