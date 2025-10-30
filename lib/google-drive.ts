import { google } from "googleapis";
import { promises as fs } from "fs";
import type { drive_v3 } from "googleapis";

// Configuration Google Drive
export interface GoogleDriveConfig {
  credentials: {
    client_email: string;
    private_key: string;
    project_id: string;
  };
  folderId?: string; // ID du dossier de sauvegarde sur Google Drive
}

export class GoogleDriveManager {
  private drive!: drive_v3.Drive;
  private config: GoogleDriveConfig;

  constructor(config: GoogleDriveConfig) {
    this.config = config;
    this.initializeAuth();
  }

  private initializeDrive() {
    const auth = new google.auth.GoogleAuth({
      credentials: this.config.credentials,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
    this.drive = google.drive({ version: 'v3', auth });
  }

  private initializeAuth() {
    // Authentification avec service account
    const auth = new google.auth.GoogleAuth({
      credentials: this.config.credentials,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    this.drive = google.drive({ version: "v3", auth });
    this.initializeDrive();
  }

  // Créer ou obtenir le dossier de sauvegarde
  async ensureBackupFolder(folderName = "ABC-Bedarieux-Backups"): Promise<string> {
    try {
      // Chercher le dossier existant
      const searchResponse = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        spaces: "drive",
      });

      const files = searchResponse.data.files || [];
      if (files.length > 0 && files[0].id) {
        return files[0].id;
      }

      // Créer le dossier s'il n'existe pas
      const folderResponse = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        },
      });

      if (!folderResponse.data.id) {
        throw new Error("Failed to create folder - no ID returned");
      }
      return folderResponse.data.id;
    } catch (error) {
      console.error("Erreur lors de la création/récupération du dossier:", error);
      throw error;
    }
  }

  // Upload un fichier vers Google Drive
  async uploadFile(
    filePath: string,
    fileName?: string,
    folderId?: string
  ): Promise<string> {
    try {
      const actualFolderId = folderId || this.config.folderId || (await this.ensureBackupFolder());
      const actualFileName = fileName || filePath.split("/").pop() || "backup";

      const fileMetadata = {
        name: `${actualFileName}-${new Date().toISOString().split("T")[0]}`,
        parents: [actualFolderId],
      };

      const media = {
        mimeType: "application/octet-stream",
        body: await fs.readFile(filePath),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
      });

      console.log(`✅ Fichier uploadé vers Google Drive: ${response.data.id}`);
      return response.data.id as string;
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      throw error;
    }
  }

  // Upload un buffer vers Google Drive
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType = "application/octet-stream",
    folderId?: string
  ): Promise<string> {
    try {
      const actualFolderId = folderId || this.config.folderId || (await this.ensureBackupFolder());

      const fileMetadata = {
        name: `${fileName}-${new Date().toISOString().split("T")[0]}`,
        parents: [actualFolderId],
      };

      const media = {
        mimeType,
        body: buffer,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
      });

      console.log(`✅ Buffer uploadé vers Google Drive: ${response.data.id}`);
      return response.data.id as string;
    } catch (error) {
      console.error("Erreur lors de l'upload buffer:", error);
      throw error;
    }
  }

  // Lister les fichiers de sauvegarde
  async listBackupFiles(folderId?: string): Promise<Array<{
    id: string;
    name: string;
    size: string;
    createdTime: string;
    mimeType: string;
  }>> {
    try {
      const actualFolderId = folderId || this.config.folderId || (await this.ensureBackupFolder());

      const response = await this.drive.files.list({
        q: `'${actualFolderId}' in parents and trashed=false`,
        fields: "files(id,name,size,createdTime,mimeType)",
        orderBy: "createdTime desc",
      });

      const files = response.data.files || [];
      return files.map(file => ({
        id: file.id || "",
        name: file.name || "",
        size: file.size || "0",
        createdTime: file.createdTime || "",
        mimeType: file.mimeType || ""
      }));
    } catch (error) {
      console.error("Erreur lors de la liste des fichiers:", error);
      throw error;
    }
  }

  // Télécharger un fichier depuis Google Drive
  async downloadFile(fileId: string, localPath: string): Promise<void> {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: "media",
      }, {
        responseType: 'stream'
      });

      const dest = await fs.open(localPath, 'w');
      const writer = dest.createWriteStream();

      return new Promise((resolve, reject) => {
        response.data
          .on('error', reject)
          .pipe(writer)
          .on('error', reject)
          .on('close', () => {
            dest.close();
            console.log(`✅ Fichier téléchargé: ${localPath}`);
            resolve();
          });
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      throw error;
    }
  }

  // Télécharger un fichier comme buffer
  async downloadFileAsBuffer(fileId: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: "media",
      }, {
        responseType: 'arraybuffer'
      });

      if (typeof response.data === 'string') {
        return Buffer.from(response.data);
      } else if (response.data instanceof ArrayBuffer) {
        return Buffer.from(response.data);
      } else {
        throw new Error("Unexpected response data type");
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement buffer:", error);
      throw error;
    }
  }

  // Supprimer un fichier
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId,
      });
      console.log(`✅ Fichier supprimé de Google Drive: ${fileId}`);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      throw error;
    }
  }

  // Obtenir des informations sur un fichier
  async getFileInfo(fileId: string): Promise<drive_v3.Schema$File> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: "id,name,size,createdTime,mimeType,parents",
      });

      return response.data || {};
    } catch (error) {
      console.error("Erreur lors de la récupération des infos:", error);
      throw error;
    }
  }
}

// Factory pour créer une instance configurée
export function createGoogleDriveManager(): GoogleDriveManager {
  const config: GoogleDriveConfig = {
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL || "",
      private_key: (process.env.GOOGLE_DRIVE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      project_id: process.env.GOOGLE_DRIVE_PROJECT_ID || "",
    },
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || undefined,
  };

  // Validation de la configuration
  if (!config.credentials.client_email || !config.credentials.private_key || !config.credentials.project_id) {
    throw new Error("Configuration Google Drive incomplète. Vérifiez les variables d'environnement.");
  }

  return new GoogleDriveManager(config);
}