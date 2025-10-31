/**
 * Module de stockage abstrait supportant local et Cloudflare R2
 *
 * Providers supportés:
 * - local: Système de fichiers local (volume Docker)
 * - r2: Cloudflare R2 Object Storage
 * - hybrid: Local en cache + R2 en backup asynchrone
 */

import { writeFile, mkdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { UPLOADS_ROOT } from "./path";

// Types
export type StorageProvider = "local" | "r2" | "hybrid";

export interface UploadResult {
  url: string;
  cloudUrl?: string;
  filename: string;
  size: number;
}

export interface StorageConfig {
  provider: StorageProvider;
  r2?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
  };
}

// Configuration du storage depuis les variables d'environnement
function getStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER || "local") as StorageProvider;

  const config: StorageConfig = { provider };

  if (provider === "r2" || provider === "hybrid") {
    const r2AccountId = process.env.R2_ACCOUNT_ID;
    const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
    const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.R2_BUCKET_NAME;
    const r2PublicUrl = process.env.R2_PUBLIC_URL;

    if (!r2AccountId || !r2AccessKey || !r2SecretKey || !r2Bucket) {
      console.warn(
        `⚠️ Storage provider '${provider}' configuré mais R2 credentials manquantes. Fallback vers 'local'.`
      );
      config.provider = "local";
    } else {
      config.r2 = {
        accountId: r2AccountId,
        accessKeyId: r2AccessKey,
        secretAccessKey: r2SecretKey,
        bucketName: r2Bucket,
        publicUrl: r2PublicUrl || `https://${r2Bucket}.${r2AccountId}.r2.dev`,
      };
    }
  }

  return config;
}

const storageConfig = getStorageConfig();

// ============================================================================
// LOCAL STORAGE
// ============================================================================

async function saveToLocal(
  buffer: Buffer,
  relativePath: string
): Promise<string> {
  const fullPath = path.join(UPLOADS_ROOT, relativePath);
  const dir = path.dirname(fullPath);

  // Créer les dossiers si nécessaire
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  // Écrire le fichier
  await writeFile(fullPath, buffer);

  return `/uploads/${relativePath}`;
}

async function deleteFromLocal(relativePath: string): Promise<void> {
  const fullPath = path.join(UPLOADS_ROOT, relativePath);
  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

// ============================================================================
// CLOUDFLARE R2 STORAGE
// ============================================================================

async function saveToR2(
  buffer: Buffer,
  key: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  if (!storageConfig.r2) {
    throw new Error("R2 configuration not available");
  }

  // Import dynamique pour éviter l'erreur si le package n'est pas installé
  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl } =
      storageConfig.r2;

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    return `${publicUrl}/${key}`;
  } catch (error) {
    console.error("❌ Erreur upload R2:", error);
    throw new Error("Failed to upload to R2");
  }
}

async function deleteFromR2(key: string): Promise<void> {
  if (!storageConfig.r2) {
    throw new Error("R2 configuration not available");
  }

  try {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    const { accountId, accessKeyId, secretAccessKey, bucketName } =
      storageConfig.r2;

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
  } catch (error) {
    console.error("❌ Erreur suppression R2:", error);
    // Ne pas throw pour éviter de bloquer si R2 est down
  }
}

// ============================================================================
// API PUBLIQUE
// ============================================================================

/**
 * Sauvegarde un fichier selon le provider configuré
 *
 * @param buffer - Buffer du fichier
 * @param relativePath - Chemin relatif (ex: places/mon-commerce/logo_123.jpg)
 * @param contentType - Type MIME du fichier
 * @returns URLs du fichier (local et/ou cloud)
 */
export async function saveFile(
  buffer: Buffer,
  relativePath: string,
  contentType: string = "image/jpeg"
): Promise<UploadResult> {
  const filename = path.basename(relativePath);

  switch (storageConfig.provider) {
    case "local":
      const localUrl = await saveToLocal(buffer, relativePath);
      return {
        url: localUrl,
        filename,
        size: buffer.length,
      };

    case "r2":
      const cloudUrl = await saveToR2(buffer, relativePath, contentType);
      return {
        url: cloudUrl,
        cloudUrl,
        filename,
        size: buffer.length,
      };

    case "hybrid":
      // Sauvegarder localement d'abord (rapide)
      const hybridLocalUrl = await saveToLocal(buffer, relativePath);

      // Upload vers R2 en arrière-plan (async, ne pas bloquer)
      saveToR2(buffer, relativePath, contentType)
        .then((r2Url) => {
          console.log(`✅ Fichier uploadé vers R2: ${r2Url}`);
        })
        .catch((error) => {
          console.error(
            `⚠️ Échec upload R2 (fichier conservé localement): ${error.message}`
          );
        });

      return {
        url: hybridLocalUrl,
        cloudUrl: storageConfig.r2
          ? `${storageConfig.r2.publicUrl}/${relativePath}`
          : undefined,
        filename,
        size: buffer.length,
      };

    default:
      throw new Error(`Storage provider non supporté: ${storageConfig.provider}`);
  }
}

/**
 * Supprime un fichier selon le provider configuré
 *
 * @param relativePath - Chemin relatif du fichier à supprimer
 */
export async function deleteFile(relativePath: string): Promise<void> {
  switch (storageConfig.provider) {
    case "local":
      await deleteFromLocal(relativePath);
      break;

    case "r2":
      await deleteFromR2(relativePath);
      break;

    case "hybrid":
      // Supprimer des deux sources
      await Promise.allSettled([
        deleteFromLocal(relativePath),
        deleteFromR2(relativePath),
      ]);
      break;
  }
}

/**
 * Obtient l'URL publique d'un fichier
 *
 * @param relativePath - Chemin relatif du fichier
 * @returns URL publique du fichier
 */
export function getFileUrl(relativePath: string): string {
  // Si R2 est configuré et que le provider est r2 ou hybrid
  if (
    storageConfig.r2 &&
    (storageConfig.provider === "r2" || storageConfig.provider === "hybrid")
  ) {
    return `${storageConfig.r2.publicUrl}/${relativePath}`;
  }

  // Sinon, URL locale
  return `/uploads/${relativePath}`;
}

/**
 * Retourne la configuration actuelle du storage
 */
export function getStorageInfo() {
  return {
    provider: storageConfig.provider,
    hasR2: !!storageConfig.r2,
    r2PublicUrl: storageConfig.r2?.publicUrl,
  };
}
