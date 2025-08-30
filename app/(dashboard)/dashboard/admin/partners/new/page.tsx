import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PartnerForm } from "../_components/partner-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Nouveau partenaire - Admin",
  description: "Créer un nouveau partenaire",
};

export default async function NewPartnerPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || safeUserCast(session.user).role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/admin/partners">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau partenaire</h1>
          <p className="text-muted-foreground">
            Ajouter un nouveau partenaire au site
          </p>
        </div>
      </div>

      <PartnerForm />
    </div>
  );
}