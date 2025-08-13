import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Building2 } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Toutes les catégories - Explorez par type d'établissement",
  description: "Découvrez tous les types d'établissements disponibles : restaurants, commerces, services et bien plus encore.",
  openGraph: {
    title: "Toutes les catégories",
    description: "Explorez les établissements par catégorie",
    type: "website",
  },
};

export default async function CategoriesPage() {
  // Charger toutes les catégories avec le nombre de places
  const categories = await prisma.placeCategory.findMany({
    where: {
      isActive: true,
      parentId: null // Seulement les catégories principales
    },
    include: {
      children: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true, icon: true, color: true },
        orderBy: { sortOrder: "asc" }
      },
      _count: {
        select: {
          places: true
        }
      }
    },
    orderBy: { sortOrder: "asc" }
  });

  // Calculer le total de places pour chaque catégorie principale (incluant ses enfants)
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const childrenIds = category.children.map(child => child.id);
      const allCategoryIds = [category.id, ...childrenIds];
      
      const totalPlaces = await prisma.place.count({
        where: {
          isActive: true,
          status: "ACTIVE",
          categories: {
            some: {
              categoryId: {
                in: allCategoryIds
              }
            }
          }
        }
      });

      return {
        ...category,
        totalPlaces
      };
    })
  );

  // Rendu de l'icône de catégorie
  const renderCategoryIcon = (icon: string | null, color: string | null, size: string = "w-8 h-8") => {
    if (!icon) return <Building2 className={size} />;
    
    // Emoji
    if (icon.length <= 4 && /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon)) {
      return <span className="text-2xl">{icon}</span>;
    }
    
    // Icône Lucide
    const IconComponent = (LucideIcons as any)[icon];
    if (IconComponent) {
      return <IconComponent className={size} style={{ color: color || undefined }} />;
    }
    
    return <Building2 className={size} />;
  };

  const totalEstablishments = categoriesWithCounts.reduce((sum, cat) => sum + cat.totalPlaces, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          Accueil
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Catégories</span>
      </nav>

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Toutes les catégories
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          Explorez nos établissements par catégorie et trouvez exactement ce que vous cherchez.
        </p>
        <p className="text-sm text-muted-foreground">
          {totalEstablishments} établissement{totalEstablishments > 1 ? 's' : ''} réparti{totalEstablishments > 1 ? 's' : ''} dans {categoriesWithCounts.length} catégorie{categoriesWithCounts.length > 1 ? 's' : ''} principale{categoriesWithCounts.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Grille des catégories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesWithCounts.map((category) => (
          <Link key={category.id} href={`/categories/${category.slug}`}>
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-lg bg-muted group-hover:scale-110 transition-transform duration-300">
                    {renderCategoryIcon(category.icon, category.color, "w-8 h-8")}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category.totalPlaces} place{category.totalPlaces > 1 ? 's' : ''}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {category.name}
                </CardTitle>
                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Sous-catégories */}
                {category.children.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Sous-catégories ({category.children.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {category.children.slice(0, 4).map((child) => (
                        <Badge
                          key={child.id}
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                          style={{
                            borderColor: child.color ? `${child.color}40` : undefined,
                            color: child.color || undefined,
                          }}
                        >
                          {renderCategoryIcon(child.icon, child.color, "w-3 h-3")}
                          {child.name}
                        </Badge>
                      ))}
                      {category.children.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.children.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Indication de navigation */}
                <div className="flex items-center justify-end mt-4 text-xs text-primary group-hover:text-primary/80">
                  <span className="mr-1">Explorer</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Message si aucune catégorie */}
      {categoriesWithCounts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-medium text-muted-foreground mb-2">
            Aucune catégorie disponible
          </h3>
          <p className="text-muted-foreground">
            Les catégories seront bientôt disponibles.
          </p>
        </div>
      )}

      {/* Section d'aide */}
      <div className="mt-12 bg-muted/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">Comment ça marche ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <span className="text-lg">🔍</span>
            </div>
            <div>
              <h3 className="font-medium mb-1">Explorez</h3>
              <p className="text-muted-foreground">
                Parcourez les catégories pour trouver le type d'établissement qui vous intéresse.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <span className="text-lg">🏪</span>
            </div>
            <div>
              <h3 className="font-medium mb-1">Découvrez</h3>
              <p className="text-muted-foreground">
                Consultez tous les établissements d'une catégorie avec leurs informations détaillées.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <h3 className="font-medium mb-1">Choisissez</h3>
              <p className="text-muted-foreground">
                Lisez les avis et trouvez l'établissement parfait pour vos besoins.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}