"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Loader2, Send, Mail, Link as LinkIcon, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TabLoginForm() {
  const router = useRouter();
  const [otpEmail, setOtpEmail] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [otpPending, startOtpTransition] = useTransition();
  const [magicPending, startMagicTransition] = useTransition();
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Email OTP Sign In
  function signInWithEmailOTP() {
    if (!otpEmail) {
      toast.error("Veuillez saisir votre email");
      return;
    }

    startOtpTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: otpEmail,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success(
              "Code de vérification envoyé ! Vérifiez votre boîte email."
            );
            router.push("/verify-email?email=" + encodeURIComponent(otpEmail));
          },
          onError: (context) => {
            toast.error(`Erreur lors de l'envoi du code : ${context.error.message}`);
          },
        },
      });
    });
  }

  // Magic Link Sign In
  function signInWithMagicLink() {
    if (!magicEmail) {
      toast.error("Veuillez saisir votre email");
      return;
    }

    startMagicTransition(async () => {
      await authClient.signIn.magicLink({
        email: magicEmail,
        callbackURL: "/dashboard",
        fetchOptions: {
          onSuccess: () => {
            toast.success(
              "Lien de connexion envoyé ! Vérifiez votre boîte email."
            );
            setMagicLinkSent(true);
          },
          onError: (context: any) => {
            toast.error(`Erreur lors de l'envoi du lien : ${context.error.message}`);
          },
        },
      });
    });
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Connexion par email</CardTitle>
        <CardDescription>
          Choisissez votre méthode de connexion préférée
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="otp" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="otp" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Code OTP
            </TabsTrigger>
            <TabsTrigger value="magic" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Lien magique
            </TabsTrigger>
          </TabsList>

          {/* Onglet Code OTP */}
          <TabsContent value="otp" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="otp-email">Email</Label>
              <Input
                id="otp-email"
                type="email"
                placeholder="votre@email.com"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    signInWithEmailOTP();
                  }
                }}
              />
            </div>
            <Button
              onClick={signInWithEmailOTP}
              disabled={otpPending || !otpEmail}
              className="w-full"
            >
              {otpPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Envoi du code...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="ml-2">Recevoir le code par email</span>
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Un code à 6 chiffres sera envoyé à votre email
            </p>
          </TabsContent>

          {/* Onglet Magic Link */}
          <TabsContent value="magic" className="space-y-4 mt-4">
            {magicLinkSent ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  <strong>Email envoyé !</strong> Vérifiez votre boîte email et cliquez sur le lien pour vous connecter automatiquement.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={magicEmail}
                    onChange={(e) => setMagicEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        signInWithMagicLink();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={signInWithMagicLink}
                  disabled={magicPending || !magicEmail}
                  className="w-full"
                  variant="outline"
                >
                  {magicPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Envoi du lien...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      <span className="ml-2">Recevoir un lien de connexion</span>
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Un lien de connexion automatique sera envoyé à votre email
                </p>
              </>
            )}
            
            {magicLinkSent && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setMagicEmail("");
                  }}
                  className="text-sm"
                >
                  Renvoyer un lien
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}