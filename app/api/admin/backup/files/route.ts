import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export async function POST() {
  try {
    // Vérifier l'authentification et les permissions admin
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Permissions insuffisantes - admin requis" },
        { status: 403 }
      );
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const uploadsPath = join(process.cwd(), "public", "uploads");

    console.log("📁 Début de la sauvegarde des fichiers...");

    // Créer un inventaire des fichiers
    async function scanDirectory(
      dirPath: string,
      basePath: string = ""
    ): Promise<Array<{ path: string; size: number; modified: Date }>> {
      const files: Array<{ path: string; size: number; modified: Date }> = [];

      try {
        const entries = await readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);
          const relativePath = join(basePath, entry.name);

          if (entry.isDirectory()) {
            // Récursion pour les sous-dossiers
            const subFiles = await scanDirectory(fullPath, relativePath);
            files.push(...subFiles);
          } else if (entry.isFile()) {
            const stats = await stat(fullPath);
            files.push({
              path: relativePath.replace(/\\/g, "/"),
              size: stats.size,
              modified: stats.mtime,
            });
          }
        }
      } catch {
        console.log(`Dossier non accessible: ${dirPath}`);
      }

      return files;
    }

    // Scanner tous les fichiers d'uploads
    const fileInventory = await scanDirectory(uploadsPath);

    const totalSize = fileInventory.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

    console.log(
      `📊 Fichiers trouvés: ${fileInventory.length} fichiers (${totalSizeMB} MB)`
    );

    // Créer l'inventaire détaillé
    const backupInventory = {
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
        version: "1.0.0",
        type: "FILES_BACKUP",
        stats: {
          totalFiles: fileInventory.length,
          totalSizeMB: parseFloat(totalSizeMB),
          directories: {
            newsletter: fileInventory.filter((f) =>
              f.path.startsWith("newsletter/")
            ).length,
            places: fileInventory.filter((f) => f.path.startsWith("places/"))
              .length,
            events: fileInventory.filter((f) => f.path.startsWith("events/"))
              .length,
            posts: fileInventory.filter((f) => f.path.startsWith("posts/"))
              .length,
            avatars: fileInventory.filter((f) => f.path.startsWith("avatars/"))
              .length,
            abc: fileInventory.filter((f) => f.path.startsWith("abc/")).length,
          },
        },
      },
      files: fileInventory,
    };

    // Retourner l'inventaire au format JSON
    return new NextResponse(JSON.stringify(backupInventory, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="abc-bedarieux-files-inventory-${timestamp}.json"`,
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde des fichiers:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur lors de la sauvegarde des fichiers" },
      { status: 500 }
    );
  }
}
