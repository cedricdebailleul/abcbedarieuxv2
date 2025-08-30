import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { PartnerForm } from "../../_components/partner-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps) {
  const partner = await prisma.partner.findUnique({
    where: { id: params.id },
  });

  if (!partner) {
    return {
      title: "Partenaire non trouvé",
    };
  }

  return {
    title: `Modifier ${partner.name} - Admin`,
    description: `Modifier les informations du partenaire ${partner.name}`,
  };
}

export default async function EditPartnerPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || safeUserCast(session.user).role !== "admin") {
    redirect("/dashboard");
  }

  const partner = await prisma.partner.findUnique({
    where: { id: params.id },
  });

  if (!partner) {
    notFound();
  }

  // Convertir les dates et normaliser les champs nullable pour le formulaire
  const partnerForForm = partner;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/admin/partners/${partner.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Modifier {partner.name}
          </h1>
          <p className="text-muted-foreground">
            Modifier les informations du partenaire
          </p>
        </div>
      </div>

      <PartnerForm partner={partnerForForm} />
    </div>
  );
}
