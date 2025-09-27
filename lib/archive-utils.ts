import archiver from "archiver";
import { createWriteStream } from "fs";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import extractZip from "extract-zip";
import { z } from "zod";

// Schéma Zod pour les métadonnées d'archive
const ArchiveMetadataSchema = z.object({
  type: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
  description: z.string().optional(),
  version: z.string().optional(),
  method: z.string().optional()
}).passthrough(); // Permet des propriétés supplémentaires

type ArchiveMetadata = z.infer<typeof ArchiveMetadataSchema>;

// Créer une archive ZIP d'un dossier
export async function createZipArchive(
  sourceFolder: string,
  outputZipPath: string,
  options: {
    compressionLevel?: number;
    exclude?: string[];
  } = {}
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Créer le dossier de destination s'il n'existe pas
      const outputDir = dirname(outputZipPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Créer l'archive
      const output = createWriteStream(outputZipPath);
      const archive = archiver("zip", {
        zlib: { level: options.compressionLevel || 6 }
      });

      output.on("close", () => {
        console.log(`✅ Archive créée: ${outputZipPath} (${archive.pointer()} bytes)`);
        resolve();
      });

      output.on("error", reject);
      archive.on("error", reject);

      archive.pipe(output);

      // Vérifier si le dossier source existe
      try {
        const stats = await fs.stat(sourceFolder);
        if (!stats.isDirectory()) {
          throw new Error(`${sourceFolder} n'est pas un dossier`);
        }
      } catch {
        console.warn(`⚠️ Dossier source non trouvé: ${sourceFolder}`);
        // Créer une archive vide avec un fichier info
        archive.append(JSON.stringify({
          message: "Dossier source vide ou inexistant",
          sourceFolder,
          createdAt: new Date().toISOString()
        }, null, 2), { name: "info.json" });
        archive.finalize();
        return;
      }

      // Ajouter tous les fichiers du dossier
      archive.directory(sourceFolder, false, (entry: { name: string }) => {
        // Exclure certains fichiers si spécifié
        if (options.exclude && options.exclude.some(pattern => {
          // Si c'est un pattern glob comme *.tmp, convertir en test simple
          if (pattern.includes('*')) {
            const extension = pattern.replace('*', '');
            return entry.name.endsWith(extension);
          }
          // Sinon, simple inclusion
          return entry.name.includes(pattern);
        })) {
          return false;
        }
        return entry;
      });

      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

// Extraire une archive ZIP
export async function extractZipArchive(
  zipPath: string,
  extractToFolder: string
): Promise<void> {
  try {
    // Créer le dossier de destination
    await fs.mkdir(extractToFolder, { recursive: true });

    // Extraire l'archive
    await extractZip(zipPath, { dir: extractToFolder });

    console.log(`✅ Archive extraite vers: ${extractToFolder}`);
  } catch (error) {
    console.error("Erreur lors de l'extraction:", error);
    throw error;
  }
}

// Obtenir des informations sur une archive
export async function getArchiveInfo(zipPath: string): Promise<{
  exists: boolean;
  size: number;
  created: Date;
}> {
  try {
    const stats = await fs.stat(zipPath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime
    };
  } catch {
    return {
      exists: false,
      size: 0,
      created: new Date()
    };
  }
}

// Créer une archive des uploads avec métadonnées
export async function createUploadsArchive(
  uploadsPath: string,
  outputZipPath: string
): Promise<{
  zipPath: string;
  metadata: {
    totalFiles: number;
    totalSize: number;
    createdAt: string;
    folders: string[];
  };
}> {
  const metadata = {
    totalFiles: 0,
    totalSize: 0,
    createdAt: new Date().toISOString(),
    folders: [] as string[]
  };

  // Scanner le dossier uploads pour obtenir les métadonnées
  try {
    const uploadStats = await scanDirectory(uploadsPath);
    metadata.totalFiles = uploadStats.fileCount;
    metadata.totalSize = uploadStats.totalSize;
    metadata.folders = uploadStats.folders;
  } catch (error) {
    console.warn("Impossible de scanner le dossier uploads:", error);
  }

  // Créer l'archive
  await createZipArchive(uploadsPath, outputZipPath, {
    compressionLevel: 6,
    exclude: [".DS_Store", "Thumbs.db", "*.tmp"]
  });

  // Ajouter les métadonnées à l'archive - validation Zod
  const validatedMetadata = ArchiveMetadataSchema.parse(metadata);
  await addMetadataToZip(outputZipPath, validatedMetadata);

  return {
    zipPath: outputZipPath,
    metadata
  };
}

// Scanner un dossier récursivement
async function scanDirectory(dirPath: string): Promise<{
  fileCount: number;
  totalSize: number;
  folders: string[];
}> {
  let fileCount = 0;
  let totalSize = 0;
  const folders: string[] = [];

  async function scan(path: string, relativePath = ""): Promise<void> {
    try {
      const items = await fs.readdir(path, { withFileTypes: true });

      for (const item of items) {
        const fullPath = join(path, item.name);
        const relPath = join(relativePath, item.name);

        if (item.isDirectory()) {
          folders.push(relPath);
          await scan(fullPath, relPath);
        } else if (item.isFile()) {
          const stats = await fs.stat(fullPath);
          fileCount++;
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.warn(`Impossible de scanner ${path}:`, error);
    }
  }

  await scan(dirPath);

  return { fileCount, totalSize, folders };
}

// Ajouter des métadonnées à une archive existante
async function addMetadataToZip(zipPath: string, metadata: ArchiveMetadata): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath + ".tmp");
    const archive = archiver("zip", { zlib: { level: 6 } });

    output.on("close", async () => {
      try {
        // Remplacer l'ancien fichier par le nouveau
        await fs.rename(zipPath + ".tmp", zipPath);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);

    // Ajouter l'archive existante
    archive.file(zipPath, { name: "backup-content.zip" });

    // Ajouter les métadonnées
    archive.append(JSON.stringify(metadata, null, 2), { name: "metadata.json" });

    archive.finalize();
  });
}