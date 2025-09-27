import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import type { OAuth2Client } from "google-auth-library";
import type { drive_v3 } from "googleapis";


// Configuration OAuth Google
export interface GoogleDriveOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GoogleDriveOAuth {
  private oauth2Client: OAuth2Client;
  private config: GoogleDriveOAuthConfig;

  constructor(config: GoogleDriveOAuthConfig) {
    this.config = config;
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  // Générer l'URL d'autorisation
  generateAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force le consentement pour obtenir refresh token
      state: userId, // Passer l'ID utilisateur dans le state
    });
  }

  // Échanger le code d'autorisation contre des tokens
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    userInfo: {
      googleUserId: string;
      googleEmail: string;
      googleName: string;
    };
  }> {
    try {
      // Échanger le code contre les tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new Error('Aucun access token reçu');
      }

      // Configurer le client avec les tokens
      this.oauth2Client.setCredentials(tokens);

      // Récupérer les informations du profil utilisateur
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfoResponse = await oauth2.userinfo.get();
      const userInfo = userInfoResponse.data;

      if (!userInfo.id || !userInfo.email || !userInfo.name) {
        throw new Error('Informations utilisateur Google incomplètes');
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        userInfo: {
          googleUserId: userInfo.id,
          googleEmail: userInfo.email,
          googleName: userInfo.name,
        }
      };

    } catch (error) {
      console.error('Erreur lors de l\'échange des tokens:', error);
      throw error;
    }
  }

  // Sauvegarder les tokens en base de données
  async saveTokens(
    userId: string, 
    tokenData: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: Date;
      userInfo: {
        googleUserId: string;
        googleEmail: string;
        googleName: string;
      };
    }
  ): Promise<void> {
    try {
      await prisma.googleDriveToken.upsert({
        where: { userId },
        update: {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.expiresAt,
          googleUserId: tokenData.userInfo.googleUserId,
          googleEmail: tokenData.userInfo.googleEmail,
          googleName: tokenData.userInfo.googleName,
          isActive: true,
          lastUsedAt: new Date(),
          scope: 'https://www.googleapis.com/auth/drive.file',
        },
        create: {
          userId,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.expiresAt,
          googleUserId: tokenData.userInfo.googleUserId,
          googleEmail: tokenData.userInfo.googleEmail,
          googleName: tokenData.userInfo.googleName,
          scope: 'https://www.googleapis.com/auth/drive.file',
          isActive: true,
        }
      });

      console.log(`✅ Tokens Google Drive sauvegardés pour l'utilisateur ${userId}`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tokens:', error);
      throw error;
    }
  }

  // Récupérer les tokens depuis la base de données
  async getStoredTokens(userId: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    isActive: boolean;
    userInfo: {
      googleUserId?: string;
      googleEmail?: string;
      googleName?: string;
    };
  } | null> {
    try {
      const tokenRecord = await prisma.googleDriveToken.findUnique({
        where: { userId }
      });

      if (!tokenRecord) {
        return null;
      }

      return {
        accessToken: tokenRecord.accessToken,
        refreshToken: tokenRecord.refreshToken || undefined,
        expiresAt: tokenRecord.expiresAt || undefined,
        isActive: tokenRecord.isActive,
        userInfo: {
          googleUserId: tokenRecord.googleUserId || undefined,
          googleEmail: tokenRecord.googleEmail || undefined,
          googleName: tokenRecord.googleName || undefined,
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des tokens:', error);
      return null;
    }
  }

  // Rafraîchir les tokens expirés
  async refreshTokens(userId: string): Promise<boolean> {
    try {
      const storedTokens = await this.getStoredTokens(userId);
      
      if (!storedTokens || !storedTokens.refreshToken) {
        console.warn('Aucun refresh token disponible pour l\'utilisateur', userId);
        return false;
      }

      // Configurer le client OAuth avec le refresh token
      this.oauth2Client.setCredentials({
        refresh_token: storedTokens.refreshToken
      });

      // Rafraîchir les tokens
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Impossible de rafraîchir le token');
      }

      // Mettre à jour en base
      await prisma.googleDriveToken.update({
        where: { userId },
        data: {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || storedTokens.refreshToken,
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
          lastUsedAt: new Date(),
        }
      });

      console.log(`✅ Tokens rafraîchis pour l'utilisateur ${userId}`);
      return true;

    } catch (error) {
      console.error('Erreur lors du rafraîchissement des tokens:', error);
      // Désactiver les tokens en cas d'erreur
      await prisma.googleDriveToken.update({
        where: { userId },
        data: { isActive: false }
      }).catch(() => {});
      
      return false;
    }
  }

  // Créer un client Google Drive configuré avec les tokens utilisateur
  async createAuthenticatedDriveClient(userId: string): Promise<drive_v3.Drive | null> {
    try {
      let tokens = await this.getStoredTokens(userId);

      if (!tokens || !tokens.isActive) {
        return null;
      }

      // Vérifier si les tokens sont expirés
      if (tokens.expiresAt && tokens.expiresAt < new Date()) {
        console.log('Tokens expirés, tentative de rafraîchissement...');
        const refreshed = await this.refreshTokens(userId);
        
        if (!refreshed) {
          return null;
        }

        // Recharger les tokens rafraîchis
        tokens = await this.getStoredTokens(userId);
        if (!tokens) {
          return null;
        }
      }

      // Configurer le client OAuth
      const oauthClient = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri
      );

      oauthClient.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      // Créer le client Google Drive
      const drive = google.drive({ version: 'v3', auth: oauthClient });

      // Mettre à jour la date de dernière utilisation
      await prisma.googleDriveToken.update({
        where: { userId },
        data: { lastUsedAt: new Date() }
      });

      return drive;

    } catch (error) {
      console.error('Erreur lors de la création du client Drive:', error);
      return null;
    }
  }

  // Révoquer l'accès Google Drive
  async revokeAccess(userId: string): Promise<boolean> {
    try {
      const tokens = await this.getStoredTokens(userId);
      
      if (!tokens) {
        return true; // Déjà révoqué
      }

      // Révoquer le token côté Google
      try {
        this.oauth2Client.setCredentials({
          access_token: tokens.accessToken
        });
        await this.oauth2Client.revokeCredentials();
      } catch (revokeError) {
        console.warn('Impossible de révoquer côté Google:', revokeError);
      }

      // Supprimer de la base de données
      await prisma.googleDriveToken.delete({
        where: { userId }
      });

      console.log(`✅ Accès Google Drive révoqué pour l'utilisateur ${userId}`);
      return true;

    } catch (error) {
      console.error('Erreur lors de la révocation:', error);
      return false;
    }
  }

  // Vérifier le statut de la connexion
  async getConnectionStatus(userId: string): Promise<{
    connected: boolean;
    googleEmail?: string;
    googleName?: string;
    lastUsedAt?: Date;
    expiresAt?: Date;
    backupFolderName?: string;
  }> {
    try {
      const tokens = await this.getStoredTokens(userId);

      if (!tokens || !tokens.isActive) {
        return { connected: false };
      }

      const tokenRecord = await prisma.googleDriveToken.findUnique({
        where: { userId }
      });

      return {
        connected: true,
        googleEmail: tokens.userInfo.googleEmail,
        googleName: tokens.userInfo.googleName,
        lastUsedAt: tokenRecord?.lastUsedAt,
        expiresAt: tokens.expiresAt,
        backupFolderName: tokenRecord?.backupFolderName || 'ABC-Bedarieux-Backups',
      };

    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      return { connected: false };
    }
  }
}

// Factory pour créer une instance configurée
export function createGoogleDriveOAuth(): GoogleDriveOAuth {
  const config: GoogleDriveOAuthConfig = {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/admin/google-drive/callback`,
  };

  // Validation de la configuration
  if (!config.clientId || !config.clientSecret) {
    throw new Error("Configuration OAuth Google Drive incomplète. Vérifiez GOOGLE_OAUTH_CLIENT_ID et GOOGLE_OAUTH_CLIENT_SECRET.");
  }

  return new GoogleDriveOAuth(config);
}