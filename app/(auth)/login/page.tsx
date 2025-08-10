import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/auth-forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { signIn } from "@/lib/auth-client";
import { Github } from "lucide-react";
import { AnimatedContainer } from "@/components/animations/animated-container";
import { ButtonSocial } from "./_components/buttonSocial";

export const metadata: Metadata = {
  title: "Connexion | MonApp",
  description: "Connectez-vous à votre compte MonApp",
};

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <AnimatedContainer className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Connexion</CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Connectez-vous à votre compte
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ButtonSocial />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continuez avec
                </span>
              </div>
            </div>

            <LoginForm />

            <div className="text-center space-y-2">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
              >
                Mot de passe oublié ?
              </Link>

              <p className="text-sm text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link
                  href="/register"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  S'inscrire
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>
    </div>
  );
}
