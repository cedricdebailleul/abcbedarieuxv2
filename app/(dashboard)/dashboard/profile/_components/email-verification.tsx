"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Check, Loader2, Shield } from "lucide-react";

interface EmailVerificationProps {
  isEmailVerified: boolean;
  email: string;
  onEmailVerified?: () => void;
}

export default function EmailVerification({ 
  isEmailVerified, 
  email,
  onEmailVerified 
}: EmailVerificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"send" | "verify">("send");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    try {
      setLoading(true);
      
      const response = await fetch("/api/auth/verify-email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'envoi");
      }

      toast.success("Code envoyé par email");
      setStep("verify");
      startCountdown();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      toast.error("Le code doit contenir 6 chiffres");
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch("/api/auth/verify-email/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: otpCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la vérification");
      }

      toast.success("Email vérifié avec succès !");
      setIsOpen(false);
      setStep("send");
      setOtpCode("");
      onEmailVerified?.();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Code invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetDialog = () => {
    setStep("send");
    setOtpCode("");
    setCountdown(0);
  };

  // Si l'email est déjà vérifié, afficher un message de confirmation
  if (isEmailVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-green-700">
            <Check className="h-4 w-4" />
            Email vérifié
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600">
            Votre adresse email <strong>{email}</strong> a été vérifiée avec succès.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
          <Shield className="h-4 w-4" />
          Email non vérifié
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-orange-600">
          Votre adresse email <strong>{email}</strong> n'est pas encore vérifiée.
        </p>
        
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetDialog();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
              <Mail className="mr-2 h-4 w-4" />
              Vérifier mon email
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            {step === "send" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Vérifier votre email</DialogTitle>
                  <DialogDescription>
                    Nous allons vous envoyer un code de vérification à votre adresse email.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{email}</p>
                      <p className="text-xs text-muted-foreground">
                        Le code sera envoyé à cette adresse
                      </p>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    onClick={handleSendCode} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? "Envoi..." : "Envoyer le code"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <form onSubmit={handleVerifyCode}>
                <DialogHeader>
                  <DialogTitle>Saisir le code de vérification</DialogTitle>
                  <DialogDescription>
                    Entrez le code à 6 chiffres que nous avons envoyé à {email}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otpCode">Code de vérification</Label>
                    <Input
                      id="otpCode"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="text-center text-lg tracking-widest font-mono"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Renvoyer le code dans {countdown}s
                      </p>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSendCode}
                        disabled={loading}
                      >
                        Renvoyer le code
                      </Button>
                    )}
                  </div>
                </div>
                
                <DialogFooter className="gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep("send")}
                    disabled={loading}
                  >
                    Retour
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || otpCode.length !== 6}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? "Vérification..." : "Vérifier"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}