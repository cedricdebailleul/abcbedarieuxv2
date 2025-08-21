import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Vérifier l'authentification admin
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { readdir, rm } = await import("node:fs/promises");
    const { existsSync } = await import("node:fs");
    const path = await import("node:path");

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "places");

    if (!existsSync(uploadsDir)) {
      return NextResponse.json({ message: "Aucun dossier uploads à nettoyer" });
    }

    // Récupérer tous les slugs des places actives en BDD
    const activePlaces = await prisma.place.findMany({
      select: { slug: true, id: true },
    });

    const activeIdentifiers = new Set([
      ...activePlaces.map((p) => p.slug).filter(Boolean),
      ...activePlaces.map((p) => p.id),
    ]);

    // Lister tous les dossiers dans uploads/places
    const uploadFolders = await readdir(uploadsDir);

    const orphanedFolders: string[] = [];
    const cleanedFolders: string[] = [];

    for (const folder of uploadFolders) {
      // Si le dossier ne correspond à aucun slug ou ID actif
      if (!activeIdentifiers.has(folder)) {
        const folderPath = path.join(uploadsDir, folder);

        try {
          await rm(folderPath, { recursive: true, force: true });
          orphanedFolders.push(folder);
          cleanedFolders.push(folderPath);
          console.log(`Dossier orphelin supprimé: ${folderPath}`);
        } catch (error) {
          console.error(`Erreur suppression dossier ${folderPath}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Nettoyage terminé`,
      stats: {
        totalFolders: uploadFolders.length,
        activePlaces: activePlaces.length,
        orphanedFolders: orphanedFolders.length,
        cleanedPaths: cleanedFolders,
      },
    });
  } catch (error) {
    console.error("Erreur lors du nettoyage:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
