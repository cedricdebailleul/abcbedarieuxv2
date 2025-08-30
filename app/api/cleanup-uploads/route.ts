// app/admin/cleanup-uploads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import path from "node:path";
import { existsSync } from "node:fs";
import { readdir, rm, stat } from "node:fs/promises";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Chemin racine des uploads (volume en prod)
const UPLOADS_ROOT =
  process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

export async function POST(req: NextRequest) {
  try {
    // Auth admin
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || safeUserCast(session.user).role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // dry-run ? (POST ?dryRun=1)
    const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";

    // Dossier à nettoyer : .../uploads/places
    const uploadsDir = path.join(UPLOADS_ROOT, "places");

    // Garde-fous : le dossier doit exister ET être bien sous UPLOADS_ROOT
    if (!existsSync(uploadsDir)) {
      return NextResponse.json({
        message: "Aucun dossier uploads à nettoyer",
        uploadsDir,
      });
    }
    const resolvedRoot = path.resolve(UPLOADS_ROOT);
    const resolvedUploads = path.resolve(uploadsDir);
    if (!resolvedUploads.startsWith(resolvedRoot)) {
      return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
    }

    // Liste des places actives
    const activePlaces = await prisma.place.findMany({
      select: { slug: true, id: true },
      where: { isActive: true }, // adapte si besoin
    });

    const activeIdentifiers = new Set<string>([
      ...(activePlaces.map((p) => p.slug).filter(Boolean) as string[]),
      ...activePlaces.map((p) => p.id),
    ]);

    // Dossiers présents dans uploads/places
    const entries = await readdir(uploadsDir, { withFileTypes: true });
    const folderNames = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    const orphaned: string[] = [];
    const protectedOnes: string[] = [];
    const removedPaths: string[] = [];
    const failed: Array<{ folder: string; error: string }> = [];

    for (const folder of folderNames) {
      // Si le dossier ne correspond à aucun slug ou id actif => orphelin
      if (!activeIdentifiers.has(folder)) {
        orphaned.push(folder);
        const folderPath = path.join(uploadsDir, folder);

        // évite toute suppression hors périmètre (double garde)
        const resolvedPath = path.resolve(folderPath);
        if (!resolvedPath.startsWith(resolvedUploads)) {
          failed.push({ folder, error: "Chemin hors périmètre, ignoré" });
          continue;
        }

        try {
          // Par sécurité: vérifie que c'est bien un dossier
          const st = await stat(folderPath);
          if (!st.isDirectory()) {
            failed.push({ folder, error: "Ce n'est pas un dossier" });
            continue;
          }

          if (dryRun) continue; // pas de suppression si dry-run

          await rm(folderPath, { recursive: true, force: true });
          removedPaths.push(folderPath);
          console.log(
            `[cleanup-uploads] Dossier orphelin supprimé: ${folderPath}`
          );
        } catch (error) {
          console.error(
            `[cleanup-uploads] Erreur suppression ${folderPath}:`,
            error
          );
          failed.push({
            folder,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      } else {
        protectedOnes.push(folder);
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      uploadsDir,
      stats: {
        totalFolders: folderNames.length,
        activePlaces: activePlaces.length,
        orphanedFolders: orphaned.length,
        removed: removedPaths.length,
        protected: protectedOnes.length,
        failed: failed.length,
      },
      removedPaths,
      orphaned,
      protected: protectedOnes,
      failed,
    });
  } catch (error) {
    console.error("[cleanup-uploads] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
