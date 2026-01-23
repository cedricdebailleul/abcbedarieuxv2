/**
 * Script de test pour vérifier la suppression R2
 * Usage: pnpm tsx scripts/test-r2-deletion.ts
 */

import { deleteFile, getStorageInfo } from "../lib/storage.js";

async function testR2Deletion() {
  console.log("🧪 Test de suppression R2\n");

  // Afficher la configuration
  const info = getStorageInfo();
  console.log("📋 Configuration storage:", {
    provider: info.provider,
    hasR2: info.hasR2,
    r2PublicUrl: info.r2PublicUrl,
  });
  console.log();

  // Test 1: Supprimer un fichier qui n'existe probablement pas
  console.log("Test 1: Suppression d'un fichier inexistant");
  try {
    await deleteFile("places/test-fake-file/logo_999.jpg");
    console.log("✅ Test 1 passé\n");
  } catch (err) {
    console.error("❌ Test 1 échoué:", (err as Error).message);
    console.log();
  }

  // Test 2: Vérifier qu'on peut appeler deleteFile sans planter
  console.log("Test 2: Appel de deleteFile avec un chemin valide");
  try {
    // Ce fichier pourrait exister ou non, on teste juste que ça ne plante pas
    await deleteFile("places/black-bear-studio/gallery/gallery_1761920494764_Sans_titre-3.jpg");
    console.log("✅ Test 2 passé\n");
  } catch (err) {
    console.error("❌ Test 2 échoué:", (err as Error).message);
    console.log();
  }

  console.log("✅ Tests terminés");
}

testR2Deletion().catch(console.error);
