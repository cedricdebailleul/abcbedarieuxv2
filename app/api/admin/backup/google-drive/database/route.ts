import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createGoogleDriveOAuth } from "@/lib/google-drive-oauth";
import { generateAPICompleteSQLDump } from "@/lib/sql-backup-generator";
import { prisma } from "@/lib/prisma";
import { join } from "path";
import { mkdir } from "fs/promises";
import { createReadStream } from "fs";
import { writeFile, unlink } from "fs/promises";

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

    console.log("🚀 Début sauvegarde base de données vers Google Drive...");

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
    const backupsPath = join(process.cwd(), "backups");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sqlFileName = `database-backup-${timestamp}.sql`;
    const sqlPath = join(backupsPath, sqlFileName);
    const metadataFileName = `database-metadata-${timestamp}.json`;
    const metadataPath = join(backupsPath, metadataFileName);

    // Créer le dossier backups s'il n'existe pas
    await mkdir(backupsPath, { recursive: true });

    // Générer le dump SQL
    console.log("🗄️ Génération du dump SQL...");
    const dbStats = await generateAPICompleteSQLDump(sqlPath, prisma);

    // Créer les métadonnées
    const metadata = {
      type: "database_backup",
      createdAt: new Date().toISOString(),
      createdBy: session.user.email,
      databaseStats: dbStats,
      sqlFile: sqlFileName,
      totalRecords: dbStats.totalRecords || 0,
      method: "prisma_sql_generator",
      version: "1.0",
      description: "Sauvegarde complète de la base de données ABC Bédarieux"
    };

    // Sauvegarder les métadonnées localement
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

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

    // Upload du fichier SQL vers Google Drive
    console.log("☁️ Upload fichier SQL vers Google Drive...");
    const sqlUploadResponse = await drive.files.create({
      requestBody: {
        name: sqlFileName,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: 'application/sql',
        body: createReadStream(sqlPath),
      },
    });

    // Upload des métadonnées vers Google Drive
    console.log("☁️ Upload métadonnées vers Google Drive...");
    const metadataUploadResponse = await drive.files.create({
      requestBody: {
        name: metadataFileName,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: 'application/json',
        body: createReadStream(metadataPath),
      },
    });

    const sqlFileId = sqlUploadResponse.data.id;
    const metadataFileId = metadataUploadResponse.data.id;

    // Obtenir les informations des fichiers uploadés
    const [sqlFileInfo, metadataFileInfo] = await Promise.all([
      drive.files.get({ fileId: sqlFileId!, fields: 'id,name,size,createdTime' }),
      drive.files.get({ fileId: metadataFileId!, fields: 'id,name,size,createdTime' })
    ]);

    // Nettoyer les fichiers locaux (optionnel)
    try {
      await Promise.all([
        unlink(sqlPath),
        unlink(metadataPath)
      ]);
      console.log("🧹 Fichiers locaux supprimés après upload");
    } catch (error) {
      console.warn("Impossible de supprimer les fichiers locaux:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Sauvegarde base de données vers Google Drive terminée avec succès",
      details: {
        sqlFile: {
          id: sqlFileId,
          name: sqlFileInfo.data.name,
          size: sqlFileInfo.data.size,
          createdTime: sqlFileInfo.data.createdTime
        },
        metadataFile: {
          id: metadataFileId,
          name: metadataFileInfo.data.name,
          size: metadataFileInfo.data.size,
          createdTime: metadataFileInfo.data.createdTime
        },
        databaseStats: dbStats,
        uploadedBy: session.user.email,
        uploadDate: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("❌ Erreur sauvegarde base de données Google Drive:", error);
    
    // Retourner une erreur plus spécifique
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
      if (error.message.includes("Prisma") || error.message.includes("Database")) {
        return NextResponse.json(
          { error: "Erreur de connexion à la base de données" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erreur interne lors de la sauvegarde Google Drive" },
      { status: 500 }
    );
  }
}