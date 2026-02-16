import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AuthLayout } from "../_components/AuthLayout";
import { ButtonSocial } from "./_components/buttonSocial";
import { TabLoginForm } from "./_components/TabLoginForm";

export const metadata: Metadata = {
  title: "Connexion | ABC Bédarieux",
  description: "Connectez-vous à votre compte ABC Bédarieux",
};

function AccountCreatedMessage() {
  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-700">
        Votre compte a été créé avec succès ! Vous pouvez maintenant vous
        connecter.
      </AlertDescription>
    </Alert>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  return (
    <AuthLayout
      title="Bienvenue sur votre annuaire local"
      description="Découvrez les commerces, artisans et services de Bédarieux et ses environs."
    >
      {resolvedSearchParams.message === "account-created" && (
        <AccountCreatedMessage />
      )}

      <Card className="border-0 shadow-none sm:border sm:shadow-lg">
        <CardHeader className="space-y-1 px-0 pb-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl text-center">Connexion</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            Connectez-vous à votre compte
          </p>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-0 sm:px-6">
          <ButtonSocial />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background sm:bg-card px-2 text-muted-foreground">
                Ou continuez avec
              </span>
            </div>
          </div>

          <TabLoginForm />

          <div className="text-center pt-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
