import { S3Client, ListBucketsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { resolve } from "path";

// Charger les variables d'environnement manuellement
try {
  const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
} catch (error) {
  console.error("Erreur lors du chargement du .env:", error);
}

async function testR2Connection() {
  console.log("🧪 Test de connexion Cloudflare R2...\n");

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error("❌ Variables d'environnement R2 manquantes");
    console.log("Variables trouvées:");
    console.log("- R2_ACCOUNT_ID:", accountId ? "✓" : "✗");
    console.log("- R2_ACCESS_KEY_ID:", accessKeyId ? "✓" : "✗");
    console.log("- R2_SECRET_ACCESS_KEY:", secretAccessKey ? "✓" : "✗");
    console.log("- R2_BUCKET_NAME:", bucketName ? "✓" : "✗");
    process.exit(1);
  }

  console.log("✓ Variables d'environnement chargées");
  console.log(`- Account ID: ${accountId}`);
  console.log(`- Bucket: ${bucketName}`);
  console.log(`- Access Key: ${accessKeyId.substring(0, 8)}...`);

  try {
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log("\n📡 Tentative de connexion au bucket R2...");

    // Test 1: Upload d'un fichier de test
    const testContent = `Test R2 - ${new Date().toISOString()}`;
    const testKey = "test/connection-test.txt";

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: "text/plain",
      })
    );

    console.log(`✅ Fichier de test uploadé avec succès: ${testKey}`);

    // Afficher l'URL publique
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (publicUrl) {
      console.log(`\n🌐 URL publique du fichier:`);
      console.log(`${publicUrl}/${testKey}`);
      console.log(`\nVous pouvez tester cette URL dans votre navigateur.`);
    }

    console.log("\n🎉 Connexion R2 fonctionnelle !");
    console.log("\n📝 Prochaines étapes:");
    console.log("1. ✓ Configuration R2 complète");
    console.log("2. Testez l'upload d'une image via l'interface");
    console.log("3. Vérifiez que l'image est stockée à la fois localement et sur R2");
    console.log("4. En production, configurez STORAGE_PROVIDER=hybrid dans .env");

  } catch (error) {
    console.error("\n❌ Erreur lors du test R2:");
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error(error);
    }
    console.log("\n💡 Vérifications:");
    console.log("1. Les credentials R2 sont-ils corrects ?");
    console.log("2. Le bucket existe-t-il dans votre compte Cloudflare ?");
    console.log("3. Les permissions de la clé API sont-elles suffisantes ?");
    process.exit(1);
  }
}

testR2Connection();
