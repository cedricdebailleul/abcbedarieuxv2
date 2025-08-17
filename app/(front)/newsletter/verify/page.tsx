"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Mail, Loader, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  // Vérifier le token au chargement de la page
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    if (!token) return;
    
    setVerifying(true);
    try {
      const response = await fetch(`/api/newsletter/verify?token=${token}`);
      const data = await response.json();

      if (data.success) {
        setIsVerified(true);
        toast.success(data.message);
      } else {
        setVerificationFailed(true);
        toast.error(data.error || "Erreur lors de la vérification");
      }
    } catch (error) {
      setVerificationFailed(true);
      toast.error("Erreur lors de la vérification");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      toast.error("Veuillez entrer votre adresse email");
      return;
    }

    setResendLoading(true);
    try {
      const response = await fetch("/api/newsletter/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Erreur lors du renvoi");
      }
    } catch (error) {
      toast.error("Erreur lors du renvoi de l'email");
    } finally {
      setResendLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-center">Vérification de votre email en cours...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Email vérifié !</CardTitle>
              <CardDescription>
                Votre abonnement à la newsletter est maintenant actif
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Merci d'avoir confirmé votre adresse email. Vous recevrez bientôt
                  nos newsletters avec les dernières actualités de l'association.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/">
                    Retour à l'accueil
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/profile">
                    Gérer mes préférences
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (verificationFailed || !token) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">
                {!token ? "Lien manquant" : "Vérification échouée"}
              </CardTitle>
              <CardDescription>
                {!token 
                  ? "Aucun token de vérification fourni" 
                  : "Le lien de vérification est invalide ou a expiré"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Vous pouvez demander un nouveau lien de vérification en entrant votre adresse email.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleResendVerification}
                  disabled={resendLoading || !email.trim()}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${resendLoading ? 'animate-spin' : ''}`} />
                  {resendLoading ? "Envoi..." : "Renvoyer l'email de vérification"}
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    Retour à l'accueil
                  </Link>
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Si vous continuez à avoir des problèmes, 
                <Link href="/contact" className="underline hover:text-blue-700 ml-1">
                  contactez-nous
                </Link>.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Vérification Email</CardTitle>
            <CardDescription>
              Vérifiez votre adresse email pour activer votre abonnement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Chargement en cours...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}