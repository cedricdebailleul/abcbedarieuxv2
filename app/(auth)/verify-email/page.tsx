"use client";

export const dynamic = "force-dynamic";

import { Loader2, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, Suspense } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { AuthLayout } from "../_components/AuthLayout";

function VerifyEmailContent() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [otpPending, startTransitionOtp] = useTransition();
  const params = useSearchParams();
  const email = params.get("email") as string | null;
  const isOtpCompleted = otp.length === 6;

  function verifyOtp() {
    startTransitionOtp(async () => {
      await authClient.signIn.emailOtp({
        email: email as string,
        otp: otp as string,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Email vérifié avec succès ! Redirection...");
            router.push("/dashboard");
          },
          onError: () => {
            toast.error("Code invalide. Veuillez réessayer.");
          },
        },
      });
    });
  }

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader className="text-center px-0 pb-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">Vérifiez votre email</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Un code de vérification a été envoyé à votre adresse email.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6 px-0 sm:px-6">
        <div className="flex flex-col items-center space-y-3">
          <InputOTP
            className="gap-2"
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Entrez le code à 6 chiffres
          </p>
        </div>
        <Button
          onClick={verifyOtp}
          disabled={otpPending || !isOtpCompleted}
          className="w-full"
        >
          {otpPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="ml-2">Vérification...</span>
            </>
          ) : (
            <>
              <Send className="size-4" />
              <span className="ml-2">Vérifier mon compte</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader className="text-center px-0 pb-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">Vérifiez votre email</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">Chargement...</p>
      </CardHeader>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Vérification de votre email"
      description="Entrez le code reçu par email pour activer votre compte."
      image="https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=1920&auto=format&fit=crop"
    >
      <Suspense fallback={<LoadingCard />}>
        <VerifyEmailContent />
      </Suspense>
    </AuthLayout>
  );
}
