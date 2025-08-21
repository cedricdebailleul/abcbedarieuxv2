import { Metadata } from "next";
import { ArrowLeft, Edit, Plus, Eye, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as LucideIcons from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  getPlaceCategoryAction,
  getPlaceCategoriesAction,
} from "@/actions/place-category";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Détails de la catégorie | Administration",
  description: "Voir les détails et statistiques de la catégorie de place",
};

interface PlaceCategoryDetailsPageProps {
  params: {
    categoryId: string;
  };
}

export default async function PlaceCategoryDetailsPage({
  params,
}: PlaceCategoryDetailsPageProps) {
  // Charger la catégorie
  const result = await getPlaceCategoryAction(params.categoryId);

  if (!result.success || !result.data) {
    notFound();
  }

  const category = result.data;

  // Charger les sous-catégories
  const childrenResult = await getPlaceCategoriesAction({
    page: 1,
    limit: 100,
    parentId: params.categoryId,
    sortBy: "sortOrder",
    sortOrder: "asc",
  });

  const children = childrenResult.success
    ? childrenResult.data!.categories
    : [];

  // Rendu de l'icône
  const renderCategoryIcon = () => {
    const icon = category.icon;
    if (!icon) return <Eye className="w-8 h-8 text-muted-foreground" />;

    // Emoji
    if (
      icon.length <= 4 &&
      /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
        icon
      )
    ) {
      return <span className="text-2xl">{icon}</span>;
    }

    // Icône Lucide
    const IconComponent = (
      LucideIcons as unknown as Record<
        string,
        React.ComponentType<React.SVGProps<SVGSVGElement>>
      >
    )[icon];
    if (IconComponent) {
      return (
        <IconComponent
          className="w-8 h-8"
          style={{ color: category.color || undefined }}
        />
      );
    }

    return <Eye className="w-8 h-8 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/admin/place-categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {renderCategoryIcon()}
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {category.name}
                {!category.isActive && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </h1>
              <p className="text-muted-foreground">
                {category.description || "Aucune description"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/dashboard/admin/place-categories/new?parentId=${category.id}`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Sous-catégorie
            </Link>
          </Button>
          <Button asChild>
            <Link
              href={`/dashboard/admin/place-categories/${category.id}/edit`}
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Aperçu de la catégorie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Aperçu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "flex items-center gap-3 p-4 border rounded-lg transition-all",
                  category.bgColor,
                  category.textColor,
                  category.borderColor || "border"
                )}
                style={{
                  backgroundColor: !category.bgColor
                    ? `${category.color}20`
                    : undefined,
                  color:
                    !category.textColor && category.color
                      ? category.color
                      : undefined,
                  borderColor:
                    !category.borderColor && category.color
                      ? category.color
                      : undefined,
                }}
              >
                {renderCategoryIcon()}
                <div className="flex-1">
                  <div className="font-semibold text-lg">{category.name}</div>
                  <div className="text-sm opacity-80">
                    {category.description || "Description de la catégorie"}
                  </div>
                  <div className="text-xs mt-1 opacity-60">
                    Slug: {category.slug}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sous-catégories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Sous-catégories ({children.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Aucune sous-catégorie
                  </p>
                  <Button asChild>
                    <Link
                      href={`/dashboard/admin/place-categories/new?parentId=${category.id}`}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Créer une sous-catégorie
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {children.map(
                    (child: {
                      id: string;
                      icon: string | null;
                      name: string;
                      description: string | null;
                      sortOrder: number;
                      isActive: boolean;
                      color: string | null;
                    }) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {child.icon && child.icon.length <= 4 ? (
                              <span className="text-lg">{child.icon}</span>
                            ) : child.icon ? (
                              (() => {
                                const IconComponent = (
                                  LucideIcons as unknown as Record<
                                    string,
                                    React.ComponentType<
                                      React.SVGProps<SVGSVGElement>
                                    >
                                  >
                                )[child.icon];
                                return IconComponent ? (
                                  <IconComponent
                                    className="w-5 h-5"
                                    style={{ color: child.color || undefined }}
                                  />
                                ) : null;
                              })()
                            ) : null}
                          </div>
                          <div>
                            <div className="font-medium">{child.name}</div>
                            {child.description && (
                              <div className="text-sm text-muted-foreground">
                                {child.description}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Ordre: {child.sortOrder}
                              {!child.isActive && " • Inactive"}
                            </div>
                          </div>
                        </div>
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: child.color || "#6B7280" }}
                        />
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/dashboard/admin/place-categories/${child.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/dashboard/admin/place-categories/${child.id}/edit`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar avec informations détaillées */}
        <div className="space-y-6">
          {/* Informations techniques */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">ID</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {category.id}
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium mb-1">Slug</div>
                <div className="text-sm text-muted-foreground">
                  {category.slug}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">
                  Ordre d&apos;affichage
                </div>
                <div className="text-sm text-muted-foreground">
                  {category.sortOrder}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Statut</div>
                <Badge variant={category.isActive ? "default" : "secondary"}>
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium mb-1">Créée le</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(category.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Modifiée le</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(category.updatedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apparence */}
          <Card>
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Icône</div>
                <div className="text-sm text-muted-foreground">
                  {category.icon || "Aucune icône"}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Couleur</div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: category.color || "#6B7280" }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {category.color || "#6B7280"}
                  </span>
                </div>
              </div>

              {category.bgColor && (
                <div>
                  <div className="text-sm font-medium mb-1">Classe de fond</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {category.bgColor}
                  </div>
                </div>
              )}

              {category.textColor && (
                <div>
                  <div className="text-sm font-medium mb-1">
                    Classe de texte
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {category.textColor}
                  </div>
                </div>
              )}

              {category.borderColor && (
                <div>
                  <div className="text-sm font-medium mb-1">
                    Classe de bordure
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {category.borderColor}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
