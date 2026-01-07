import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeUserCast } from "@/lib/auth-helpers";
import { headers } from "next/headers";
import slugify from "slugify";

// Schema de validation pour l'import JSON
// Schéma de validation pour l'import JSON (récursif)
type CategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  bgColor?: string;
  textColor?: string;
  parentId?: string;
  children?: CategoryInput[];
};

const baseCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  parentId: z.string().optional(),
});

// Zod handles recursive types this way
const categorySchema: z.ZodType<CategoryInput> = baseCategorySchema.extend({
  children: z.lazy(() => z.array(categorySchema).optional()),
});

const importSchema = z.array(categorySchema);

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    // Vérification permissions Admin
    if (!session || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Lire et parser le JSON
    const text = await file.text();
    let jsonData;
    try {
      jsonData = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: "Fichier JSON invalide" }, { status: 400 });
    }

    // Valider le format
    const result = importSchema.safeParse(jsonData);
    if (!result.success) {
      return NextResponse.json(
        { error: "Format de données invalide", details: result.error.issues },
        { status: 400 }
      );
    }

    const startCategories = result.data;
    const stats = {
      total: 0,
      created: 0,
      updated: 0,
      errors: 0,
    };

    // Fonction récursive pour traiter une catégorie et ses enfants
    async function processCategory(cat: CategoryInput, parentId: string | null = null) {
        stats.total++;
        try {
            const slug = cat.slug || slugify(cat.name, { lower: true, strict: true });
            
            // On essaie de trouver par slug ou par nom
            // Note: on pourrait aussi filtrer par parentId pour éviter les conflits si même nom ailleurs,
            // mais slug doit être unique globalement selon le modèle prisma
            const existing = await prisma.placeCategory.findFirst({
                where: {
                    OR: [
                        { slug: slug },
                        { name: { equals: cat.name, mode: 'insensitive' } } 
                    ]
                }
            });

            let currentId = existing?.id;

            if (existing) {
              // UPDATE
              await prisma.placeCategory.update({
                where: { id: existing.id },
                data: {
                  name: cat.name,
                  description: cat.description || existing.description,
                  icon: cat.icon || existing.icon,
                  color: cat.color || existing.color,
                  bgColor: cat.bgColor || existing.bgColor,
                  textColor: cat.textColor || existing.textColor,
                  parentId: parentId || existing.parentId // Met à jour le parent si fourni
                }
              });
              stats.updated++;
            } else {
              // CREATE
              const newCat = await prisma.placeCategory.create({
                data: {
                  name: cat.name,
                  slug: slug,
                  description: cat.description,
                  icon: cat.icon,
                  color: cat.color || "#6B7280",
                  bgColor: cat.bgColor || "bg-gray-100",
                  textColor: cat.textColor || "text-gray-700",
                  parentId: parentId
                }
              });
              currentId = newCat.id;
              stats.created++;
            }

            // Traitement des enfants
            if (cat.children && cat.children.length > 0 && currentId) {
                for (const child of cat.children) {
                    await processCategory(child, currentId);
                }
            }

        } catch (err) {
            console.error(`Erreur import categorie ${cat.name}:`, err);
            stats.errors++;
        }
    }

    // Traitement séquentiel racine
    for (const cat of startCategories) {
      await processCategory(cat, cat.parentId || null);
    }

    return NextResponse.json({
      success: true,
      stats,
      message: `Import terminé: ${stats.created} créées, ${stats.updated} mises à jour, ${stats.errors} erreurs.`
    });

  } catch (error) {
    console.error("Erreur import categories:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'import" },
      { status: 500 }
    );
  }
}
