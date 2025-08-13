import { Metadata } from "next";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BadgeForm } from "../_components/badge-form";

export const metadata: Metadata = {
  title: "Nouveau badge | Administration",
  description: "Créer un nouveau badge de récompense",
};

export default function NewBadgePage() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/admin/badges">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Plus className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nouveau badge</h1>
            <p className="text-muted-foreground">
              Créez un nouveau badge de récompense pour les utilisateurs
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du badge</CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}