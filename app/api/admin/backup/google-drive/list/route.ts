import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createGoogleDriveOAuth } from "@/lib/google-drive-oauth";
import { z } from "zod";

// Schéma Zod pour les fichiers Google Drive bruts de l'API
const RawGoogleDriveFileSchema = z.object({
  id: z.string(),
  name: z.string(), 
  size: z.string().optional(),
  createdTime: z.string(),
  mimeType: z.string().optional()
});

// Schéma pour les fichiers traités
const ProcessedFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.string(),
  createdTime: z.string(),
  mimeType: z.string()
});

type ProcessedFile = z.infer<typeof ProcessedFileSchema>;

export async function GET() {
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

    // Récupérer la liste des fichiers de sauvegarde dans le dossier ABC-Bedarieux-Backups
    const folderName = 'ABC-Bedarieux-Backups';
    
    // Chercher le dossier de backup
    const folderResponse = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    });
    
    let files: Array<{
      id: string;
      name: string;
      size: string;
      createdTime: string;
      mimeType: string;
    }> = [];
    
    if (folderResponse.data.files && folderResponse.data.files.length > 0) {
      const folderId = folderResponse.data.files[0].id;
      
      // Lister les fichiers dans le dossier de backup
      const filesResponse = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id,name,size,createdTime,mimeType)',
        orderBy: 'createdTime desc'
      });
      
      // Validation et transformation des fichiers avec Zod
      const rawFiles = filesResponse.data.files || [];
      files = rawFiles.map((file: unknown): ProcessedFile | null => {
        try {
          // D'abord valider le fichier brut
          const validatedRawFile = RawGoogleDriveFileSchema.parse(file);
          
          // Ensuite créer le fichier traité
          const processedFile: ProcessedFile = {
            id: validatedRawFile.id,
            name: validatedRawFile.name,
            size: validatedRawFile.size || "0",
            createdTime: validatedRawFile.createdTime,
            mimeType: validatedRawFile.mimeType || "unknown"
          };
          
          // Valider le fichier traité
          const finalFile = ProcessedFileSchema.parse(processedFile);
          console.log(`📄 Fichier: ${finalFile.name}, Taille: ${finalFile.size} bytes`);
          return finalFile;
        } catch (error) {
          console.warn("Fichier Google Drive invalide ignoré:", error);
          return null;
        }
      }).filter((file): file is ProcessedFile => file !== null);
    }

    // Organiser les fichiers par type et date
    const organizedFiles = {
      database: [] as Array<{
        id: string;
        name: string;
        size: string;
        createdTime: string;
        type: 'sql' | 'metadata';
        pairedFile?: string;
      }>,
      uploads: [] as Array<{
        id: string;
        name: string;
        size: string;
        createdTime: string;
        type: 'archive';
      }>,
      other: [] as Array<{
        id: string;
        name: string;
        size: string;
        createdTime: string;
        mimeType: string;
      }>
    };

    // Classer les fichiers
    for (const file of files) {
      if (file.name.includes('database-backup') && file.name.endsWith('.sql')) {
        organizedFiles.database.push({
          ...file,
          type: 'sql' as const
        });
      } else if (file.name.includes('database-metadata') && file.name.endsWith('.json')) {
        organizedFiles.database.push({
          ...file,
          type: 'metadata' as const
        });
      } else if (file.name.includes('uploads-backup')) {
        organizedFiles.uploads.push({
          ...file,
          type: 'archive' as const
        });
      } else {
        organizedFiles.other.push({
          ...file,
          mimeType: file.mimeType
        });
      }
    }

    // Associer les fichiers SQL avec leurs métadonnées
    for (const sqlFile of organizedFiles.database.filter(f => f.type === 'sql')) {
      const baseName = sqlFile.name.replace('.sql', '').replace('database-backup-', '');
      const metadataFile = organizedFiles.database.find(f => 
        f.type === 'metadata' && f.name.includes(baseName)
      );
      if (metadataFile) {
        sqlFile.pairedFile = metadataFile.id;
        metadataFile.pairedFile = sqlFile.id;
      }
    }

    // Calculer les statistiques
    const stats = {
      totalFiles: files.length,
      databaseBackups: organizedFiles.database.filter(f => f.type === 'sql').length,
      uploadsBackups: organizedFiles.uploads.length,
      totalSize: files.reduce((sum, file) => sum + parseInt(file.size || '0'), 0),
      oldestBackup: files.length > 0 ? files[files.length - 1]?.createdTime : null,
      newestBackup: files.length > 0 ? files[0]?.createdTime : null,
    };

    return NextResponse.json({
      success: true,
      message: "Liste des sauvegardes Google Drive récupérée avec succès",
      data: {
        files: organizedFiles,
        stats,
        retrievedBy: session.user.email,
        retrievedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("❌ Erreur récupération liste Google Drive:", error);
    
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
      if (error.message.includes("invalid_grant")) {
        return NextResponse.json(
          { error: "Authentification Google Drive expirée. Vérifiez les credentials." },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erreur interne lors de la récupération de la liste Google Drive" },
      { status: 500 }
    );
  }
}