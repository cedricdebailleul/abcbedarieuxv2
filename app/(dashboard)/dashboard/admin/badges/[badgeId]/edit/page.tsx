import { Metadata } from "next";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BadgeForm } from "../../_components/badge-form";
import { getBadgeAction } from "@/actions/badge";

interface EditBadgePageProps {
  params: Promise<{
    badgeId: string;
  }>;
}

export async function generateMetadata({
  params,
}: EditBadgePageProps): Promise<Metadata> {
  const { badgeId } = await params;
  const result = await getBadgeAction(badgeId);

  return {
    title: result.success
      ? `Modifier ${result.data.title} | Administration`
      : "Badge introuvable | Administration",
    description: "Modifier les informations du badge",
  };
}

export default async function EditBadgePage({ params }: EditBadgePageProps) {
  const { badgeId } = await params;
  const result = await getBadgeAction(badgeId);

  if (!result.success) {
    notFound();
  }

  const badge = result.data;

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
          <Edit className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Modifier le badge
            </h1>
            <p className="text-muted-foreground">
              Modifiez les informations de "{badge.title}"
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
          <BadgeForm
            mode="edit"
            badgeId={badgeId}
            initialData={{
              id: badge.id,
              title: badge.title,
              description: badge.description,
              category: badge.category,
              rarity: badge.rarity,
              color: badge.color,
              iconUrl: badge.iconUrl,
              isActive: badge.isActive,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
