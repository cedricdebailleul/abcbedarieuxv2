"use client";

import { GithubIcon, Loader, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [githubPending, startGithubTransition] = useTransition();
  const [emailPending, startEmailTransition] = useTransition();
  const [email, setEmail] = useState("");
  async function signInWithGithub() {
    startGithubTransition(async () => {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Successfully signed in with GitHub!, you will be redirected shortly.");
          },
          onError: (error) => {
            toast.error(`Failed to sign in with GitHub: ${error.error.message}`);
          },
        },
      });
    });
  }

  function signInWithEmail() {
    startEmailTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Verification code sent to your email! Please check your inbox.");
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          },
          onError: () => {
            toast.error(`Failed to send verification code`);
          },
        },
      });
    });
  }

  return (
    <Card title="Login">
      <CardHeader>
        <CardTitle className="text-xl">Welcome back!</CardTitle>
        <CardDescription>Login with github or continue with your email.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button disabled={githubPending} onClick={signInWithGithub} className="w-full">
          {githubPending ? (
            <>
              <Loader className=" size-4 animate-spin" />
              <span className="ml-2">Signing in with GitHub...</span>
            </>
          ) : (
            <>
              <GithubIcon className="size-4" />
              <span className="ml-2">Sign in with GitHub</span>
            </>
          )}
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border ">
          <span className="relative z-10 bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              value={email}
              placeholder="johndoe@example.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <Button onClick={signInWithEmail} disabled={emailPending} variant="outline">
          {emailPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="ml-2">Sending verification code...</span>
            </>
          ) : (
            <>
              <Send className="size-4" />
              <span>Send verification code</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
