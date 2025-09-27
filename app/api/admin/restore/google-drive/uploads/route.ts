import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createGoogleDriveOAuth } from "@/lib/google-drive-oauth";
import { extractZipArchive } from "@/lib/archive-utils";
import { join } from "path";
import { mkdir, rmdir, access, readFile, cp } from "fs/promises";
import { createWriteStream } from "fs";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions admin
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Permissions insuffisantes - admin requis" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileId, replaceExisting = false } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: "ID du fichier Google Drive requis" },
        { status: 400 }
      );
    }

    console.log("🚀 Début restauration uploads depuis Google Drive...");

    // Initialiser Google Drive OAuth
    const oauth = createGoogleDriveOAuth();
    
    // Créer le client Drive authentifié
    const drive = await oauth.createAuthenticatedDriveClient(session.user.id);
    
    if (!drive) {
      return NextResponse.json(
        { error: "Google Drive non connecté. Veuillez vous connecter d'abord." },
        { status: 400 }
      );
    }

    // Chemins
    const tempPath = join(process.cwd(), "temp");
    const uploadsPath = join(process.cwd(), "uploads");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const tempZipPath = join(tempPath, `temp-uploads-${timestamp}.zip`);
    const tempExtractPath = join(tempPath, `temp-extract-${timestamp}`);

    // Créer le dossier temporaire
    await mkdir(tempPath, { recursive: true });

    try {
      // Télécharger le fichier depuis Google Drive
      console.log("☁️ Téléchargement depuis Google Drive...");
      
      // Télécharger le fichier
      const response = await drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, { responseType: 'stream' });
      
      const dest = createWriteStream(tempZipPath);
      response.data.pipe(dest);
      
      // Attendre que le téléchargement soit terminé
      await new Promise<void>((resolve, reject) => {
        dest.on('finish', () => resolve());
        dest.on('error', reject);
      });

      // Obtenir les informations du fichier
      const fileInfoResponse = await drive.files.get({
        fileId: fileId,
        fields: 'id,name,size,createdTime'
      });
      const fileInfo = {
        name: fileInfoResponse.data.name!,
        size: fileInfoResponse.data.size!,
        createdTime: fileInfoResponse.data.createdTime!
      };

      // Extraire l'archive
      console.log("📦 Extraction de l'archive...");
      await extractZipArchive(tempZipPath, tempExtractPath);

      // Lire les métadonnées si disponibles
      let metadata = null;
      try {
        const metadataPath = join(tempExtractPath, "metadata.json");
        const metadataContent = await readFile(metadataPath, "utf-8");
        metadata = JSON.parse(metadataContent);
        console.log("📋 Métadonnées trouvées:", metadata);
      } catch {
        console.log("ℹ️ Aucune métadonnée trouvée");
      }

      // Sauvegarder les uploads existants si demandé
      if (replaceExisting) {
        console.log("💾 Sauvegarde des uploads existants...");
        const backupPath = join(process.cwd(), "backups", `uploads-backup-before-restore-${timestamp}`);
        try {
          await cp(uploadsPath, backupPath, { recursive: true });
          console.log("✅ Uploads existants sauvegardés");
        } catch (error) {
          console.warn("⚠️ Impossible de sauvegarder les uploads existants:", error);
        }
      }

      // Restaurer les fichiers
      console.log("📁 Restauration des fichiers uploads...");
      
      // Si l'archive contient un dossier backup-content.zip, l'extraire
      const backupContentPath = join(tempExtractPath, "backup-content.zip");
      try {
        const backupContentExists = await access(backupContentPath).then(() => true).catch(() => false);
        if (backupContentExists) {
          // Extraire le contenu réel
          const realContentPath = join(tempExtractPath, "real-content");
          await extractZipArchive(backupContentPath, realContentPath);
          
          // Copier depuis le contenu réel
          if (replaceExisting) {
            // Supprimer le dossier uploads existant
            try {
              await rmdir(uploadsPath, { recursive: true });
            } catch {
              // Ignorer si le dossier n'existe pas
            }
          }
          
          await cp(realContentPath, uploadsPath, { 
            recursive: true,
            force: replaceExisting 
          });
        } else {
          // Copier directement depuis l'extraction
          if (replaceExisting) {
            try {
              await rmdir(uploadsPath, { recursive: true });
            } catch {
              // Ignorer si le dossier n'existe pas
            }
          }
          
          await cp(tempExtractPath, uploadsPath, { 
            recursive: true,
            force: replaceExisting 
          });
        }
      } catch (error) {
        console.error("Erreur lors de la restauration:", error);
        throw error;
      }

      // Nettoyer les fichiers temporaires
      console.log("🧹 Nettoyage des fichiers temporaires...");
      try {
        await rmdir(tempPath, { recursive: true });
      } catch (error) {
        console.warn("Impossible de supprimer les fichiers temporaires:", error);
      }

      return NextResponse.json({
        success: true,
        message: "Restauration uploads depuis Google Drive terminée avec succès",
        details: {
          fileId,
          fileName: fileInfo.name,
          fileSize: fileInfo.size,
          fileCreatedTime: fileInfo.createdTime,
          metadata,
          replaceExisting,
          restoredBy: session.user.email,
          restoreDate: new Date().toISOString(),
        },
      });

    } finally {
      // S'assurer que les fichiers temporaires sont nettoyés
      try {
        await rmdir(tempPath, { recursive: true });
      } catch {
        // Ignorer les erreurs de nettoyage
      }
    }

  } catch (error) {
    console.error("❌ Erreur restauration uploads Google Drive:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Configuration OAuth Google Drive")) {
        return NextResponse.json(
          { error: "Configuration OAuth Google Drive manquante. Vérifiez les variables d'environnement." },
          { status: 500 }
        );
      }
      if (error.message.includes("No refresh token")) {
        return NextResponse.json(
          { error: "Session Google Drive expirée. Reconnectez-vous." },
          { status: 401 }
        );
      }
      if (error.message.includes("File not found")) {
        return NextResponse.json(
          { error: "Fichier non trouvé sur Google Drive" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erreur interne lors de la restauration Google Drive" },
      { status: 500 }
    );
  }
}