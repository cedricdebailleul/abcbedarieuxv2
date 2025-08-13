"use client";
import { Loader2, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
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
            // Redirect to the home page or dashboard after successful verification
            toast.success("Email verified successfully! Redirecting to your dashboard.");
            router.push("/dashboard");
          },
          onError: () => {
            toast.error("Failed to verify OTP. Please try again.");
          },
        },
      });
    });
  }
  return (
    <Card className="w-full mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Please check your email</CardTitle>
        <CardDescription className="">
          A verification code has been sent to your email. Please enter the code below to verify
          your email address.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <InputOTP className="gap-2" maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
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
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to your email.
          </p>
        </div>
        <Button onClick={verifyOtp} disabled={otpPending || !isOtpCompleted} className="w-full">
          {otpPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="ml-2">Verifying...</span>
            </>
          ) : (
            <>
              <Send className="size-4" />
              <span>Verify Account</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
