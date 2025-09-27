import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createGoogleDriveOAuth } from "@/lib/google-drive-oauth";
import { createUploadsArchive } from "@/lib/archive-utils";
import { join } from "path";
import { mkdir } from "fs/promises";
import { createReadStream } from "fs";
import { unlink } from "fs/promises";

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

    // Vérifier les permissions admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Permissions insuffisantes - admin requis" },
        { status: 403 }
      );
    }

    console.log("🚀 Début sauvegarde uploads vers Google Drive...");

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
    const uploadsPath = join(process.cwd(), "uploads");
    const backupsPath = join(process.cwd(), "backups");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const zipFileName = `uploads-backup-${timestamp}.zip`;
    const zipPath = join(backupsPath, zipFileName);

    // Créer le dossier backups s'il n'existe pas
    await mkdir(backupsPath, { recursive: true });

    // Créer l'archive des uploads
    console.log("📦 Création de l'archive des uploads...");
    const archiveResult = await createUploadsArchive(uploadsPath, zipPath);
    
    // Vérifier la taille du fichier local avant upload
    const fs = await import('fs');
    const stats = fs.statSync(zipPath);
    console.log(`📊 Taille de l'archive locale: ${stats.size} bytes (${Math.round(stats.size / 1024)} KB)`);

    // Upload vers Google Drive
    console.log("☁️ Upload vers Google Drive...");
    
    // Créer ou récupérer le dossier de backup
    const folderName = 'ABC-Bedarieux-Backups';
    let folderId;
    
    // Chercher le dossier existant
    const folderResponse = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    });
    
    if (folderResponse.data.files && folderResponse.data.files.length > 0) {
      folderId = folderResponse.data.files[0].id;
    } else {
      // Créer le dossier s'il n'existe pas
      const folderCreate = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
      });
      folderId = folderCreate.data.id;
    }

    // Upload le fichier
    const uploadResponse = await drive.files.create({
      requestBody: {
        name: zipFileName,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: 'application/zip',
        body: createReadStream(zipPath),
      },
    });

    const fileId = uploadResponse.data.id;
    
    // Obtenir les informations du fichier uploadé
    const fileInfo = await drive.files.get({
      fileId: fileId!,
      fields: 'id,name,size,createdTime',
    });

    // Nettoyer le fichier local (optionnel)
    try {
      await unlink(zipPath);
      console.log("🧹 Fichier local supprimé après upload");
    } catch (error) {
      console.warn("Impossible de supprimer le fichier local:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Sauvegarde uploads vers Google Drive terminée avec succès",
      details: {
        fileId,
        fileName: fileInfo.data.name,
        size: fileInfo.data.size,
        createdTime: fileInfo.data.createdTime,
        metadata: archiveResult.metadata,
        uploadedBy: session.user.email,
        uploadDate: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("❌ Erreur sauvegarde uploads Google Drive:", error);
    
    // Retourner une erreur plus spécifique selon le type d'erreur
    if (error instanceof Error) {
      if (error.message.includes("Configuration OAuth Google Drive")) {
        return NextResponse.json(
          { error: "Configuration OAuth Google Drive manquante. Vérifiez les variables d'environnement." },
          { status: 500 }
        );
      }
      if (error.message.includes("ENOENT")) {
        return NextResponse.json(
          { error: "Dossier uploads non trouvé" },
          { status: 404 }
        );
      }
      if (error.message.includes("No refresh token")) {
        return NextResponse.json(
          { error: "Session Google Drive expirée. Reconnectez-vous." },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erreur interne lors de la sauvegarde Google Drive" },
      { status: 500 }
    );
  }
}