import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { deleteAllImages } from "@/lib/cleanup-images";
import { PLACES_ROOT } from "@/lib/path";
import { rm } from "node:fs/promises";
import { Prisma } from "@/lib/generated/prisma";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    // 1. Vérification Admin
    if (!session || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Aucun ID fourni" },
        { status: 400 }
      );
    }

    console.log(`🗑️ Bulk delete request for ${ids.length} places...`);

    // 2. Récupérer les données complètes pour le nettoyage (images, events, posts)
    const placesToDelete = await prisma.place.findMany({
      where: { id: { in: ids } },
      include: {
        events: true, // Pour suppression en cascade
        posts: true,  // Pour suppression en cascade
      }
    });

    let deletedCount = 0;
    let errorsCount = 0;

    // 3. Boucle de suppression (séquentielle pour éviter la surcharge)
    for (const place of placesToDelete) {
      try {
        console.log(`Processing place deletion: ${place.name} (${place.id})`);

        // A. Supprimer les événements liés et leurs images
        for (const event of place.events) {
            await deleteAllImages(event);
            await prisma.event.delete({ where: { id: event.id } });
            console.log(`  - Deleted event: ${event.title}`);
        }

        // B. Supprimer les posts liés et leurs images
        for (const post of place.posts) {
            // Adapter le post pour correspondre à ImageFields (cast partiel accepté par JS)
            // Post n'a pas 'images' mais deleteAllImages gère les champs manquants
            await deleteAllImages(post as any);
            await prisma.post.delete({ where: { id: post.id } });
            console.log(`  - Deleted post: ${post.title}`);
        }

        // C. Supprimer les images de la Place
        await deleteAllImages(place);

        // D. Supprimer le dossier uploads local (si existant)
        try {
          const uploadDir = PLACES_ROOT(place.slug || place.id);
          await rm(uploadDir, { recursive: true, force: true }).catch(() => {});
        } catch (err) {
            // Ignore fs errors
        }

        // E. Supprimer la Place en DB
        await prisma.place.delete({ where: { id: place.id } });
        deletedCount++;

      } catch (error) {
        console.error(`❌ Error deleting place ${place.id}:`, error);
        errorsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      count: deletedCount,
      errors: errorsCount,
      message: `${deletedCount} place(s) supprimée(s)${errorsCount > 0 ? ` (${errorsCount} échecs)` : ""}`
    });

  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
