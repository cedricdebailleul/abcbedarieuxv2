import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PartnersContent } from "./partners-content";

export const metadata = {
  title: "Gestion des partenaires - Admin",
  description: "Interface d'administration pour la gestion des partenaires",
};

export default async function AdminPartnersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "moderator")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des partenaires</h1>
        <p className="text-muted-foreground">
          Gérez les partenaires et leur affichage sur le site
        </p>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <PartnersContent />
      </Suspense>
    </div>
  );
}