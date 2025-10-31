/**
 * Script pour nettoyer les fichiers orphelins sur R2
 * Usage: pnpm tsx scripts/cleanup-orphan-r2-files.ts
 */

import { config } from "dotenv";
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Charger les variables d'environnement
config();

async function cleanupOrphanFiles() {
  console.log("🧹 Nettoyage des fichiers orphelins sur R2\n");

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error("❌ Variables d'environnement R2 manquantes");
    process.exit(1);
  }

  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    // Lister tous les fichiers
    console.log("📋 Listing des fichiers sur R2...\n");
    const listResult = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
      })
    );

    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log("✅ Aucun fichier trouvé sur R2");
      return;
    }

    console.log(`📊 ${listResult.Contents.length} fichier(s) trouvé(s)\n`);

    // Afficher tous les fichiers
    for (const obj of listResult.Contents) {
      const size = ((obj.Size || 0) / 1024).toFixed(2);
      console.log(`  - ${obj.Key} (${size} KB)`);
    }

    console.log("\n🔍 Fichiers avec slug temporaire 'temp-':");
    const tempFiles = listResult.Contents.filter((obj) =>
      obj.Key?.includes("/temp-")
    );

    if (tempFiles.length === 0) {
      console.log("  Aucun fichier temporaire trouvé");
      return;
    }

    for (const obj of tempFiles) {
      const size = ((obj.Size || 0) / 1024).toFixed(2);
      console.log(`  ⚠️  ${obj.Key} (${size} KB)`);
    }

    // Supprimer automatiquement les fichiers temporaires
    console.log("\n🗑️  Suppression des fichiers temporaires...\n");

    let successCount = 0;
    let failCount = 0;

    for (const obj of tempFiles) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: obj.Key,
          })
        );
        console.log(`  ✅ Supprimé: ${obj.Key}`);
        successCount++;
      } catch (err) {
        console.error(`  ❌ Échec: ${obj.Key}:`, (err as Error).message);
        failCount++;
      }
    }

    console.log(`\n🎯 Résultat: ${successCount} supprimé(s), ${failCount} échec(s)`);
    console.log("✅ Nettoyage terminé");
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

cleanupOrphanFiles().catch(console.error);
