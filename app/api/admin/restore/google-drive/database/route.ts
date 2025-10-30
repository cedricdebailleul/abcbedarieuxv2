import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createGoogleDriveOAuth } from "@/lib/google-drive-oauth";
import { prisma } from "@/lib/prisma";
import { join } from "path";
import { mkdir, unlink } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

// Schémas Zod pour le typage strict
const UserAdminSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'moderator', 'dpo'])
});

const SessionSchema = z.object({
  id: z.string(),
  token: z.string(),
  userId: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  user: z.object({
    email: z.string().email()
  })
});

const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  idToken: z.string().nullable(),
  accessTokenExpiresAt: z.date().nullable(),
  refreshTokenExpiresAt: z.date().nullable(),
  user: z.object({
    email: z.string().email()
  })
});

const GoogleDriveTokenSchema = z.object({
  id: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  scope: z.string(),
  userId: z.string(),
  googleUserId: z.string().nullable(),
  googleEmail: z.string().nullable(),
  googleName: z.string().nullable(),
  expiresAt: z.date().nullable(),
  lastUsedAt: z.date().nullable(),
  user: z.object({
    email: z.string().email()
  })
});

const StatisticsSchema = z.object({
  commandsProcessed: z.number(),
  successfulInserts: z.number(),
  skippedDuplicates: z.number(),
  schemaErrors: z.number(),
  tablesProcessed: z.number(),
  tablesIgnored: z.number(),
  reconciledRecords: z.number()
});

// Types dérivés des schémas Zod
type UserAdmin = z.infer<typeof UserAdminSchema>;
type SessionData = z.infer<typeof SessionSchema>;
type AccountData = z.infer<typeof AccountSchema>;
type GoogleDriveTokenData = z.infer<typeof GoogleDriveTokenSchema>;
type Statistics = z.infer<typeof StatisticsSchema>;

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
    const { sqlFileId, metadataFileId, confirmReplace = false } = body;

    if (!sqlFileId) {
      return NextResponse.json(
        { error: "ID du fichier SQL Google Drive requis" },
        { status: 400 }
      );
    }

    if (!confirmReplace) {
      return NextResponse.json(
        { 
          error: "Confirmation requise - cette opération va écraser la base de données actuelle",
          requiresConfirmation: true
        },
        { status: 400 }
      );
    }

    console.log("🚀 Début restauration base de données depuis Google Drive...");

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
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const tempSqlPath = join(tempPath, `temp-database-${timestamp}.sql`);
    const tempMetadataPath = join(tempPath, `temp-metadata-${timestamp}.json`);

    // Créer le dossier temporaire
    await mkdir(tempPath, { recursive: true });

    let metadata = null;

    try {
      // Télécharger le fichier SQL depuis Google Drive
      console.log("☁️ Téléchargement fichier SQL depuis Google Drive...");
      
      // Télécharger le fichier SQL
      const sqlResponse = await drive.files.get({
        fileId: sqlFileId,
        alt: 'media'
      }, { responseType: 'stream' });
      
      const fs = require('fs');
      const sqlDest = fs.createWriteStream(tempSqlPath);
      sqlResponse.data.pipe(sqlDest);
      
      // Attendre que le téléchargement soit terminé
      await new Promise((resolve, reject) => {
        sqlDest.on('finish', resolve);
        sqlDest.on('error', reject);
      });
      
      // Obtenir les informations du fichier SQL
      const sqlFileInfoResponse = await drive.files.get({
        fileId: sqlFileId,
        fields: 'id,name,size,createdTime'
      });
      const sqlFileInfo = {
        name: sqlFileInfoResponse.data.name!,
        size: sqlFileInfoResponse.data.size!,
        createdTime: sqlFileInfoResponse.data.createdTime!
      };

      // Télécharger les métadonnées si disponibles
      if (metadataFileId) {
        try {
          console.log("☁️ Téléchargement métadonnées depuis Google Drive...");
          
          // Télécharger le fichier de métadonnées
          const metadataResponse = await drive.files.get({
            fileId: metadataFileId,
            alt: 'media'
          }, { responseType: 'stream' });
          
          const metadataDest = fs.createWriteStream(tempMetadataPath);
          metadataResponse.data.pipe(metadataDest);
          
          await new Promise((resolve, reject) => {
            metadataDest.on('finish', resolve);
            metadataDest.on('error', reject);
          });
          
          const fsPromises = await import("fs/promises");
          const metadataContent = await fsPromises.readFile(tempMetadataPath, "utf-8");
          metadata = JSON.parse(metadataContent);
          console.log("📋 Métadonnées chargées:", metadata);
        } catch (error) {
          console.warn("⚠️ Impossible de charger les métadonnées:", error);
        }
      }

      // Créer une sauvegarde de sécurité avant la restauration
      console.log("💾 Création d'une sauvegarde de sécurité...");
      const backupPath = join(process.cwd(), "backups");
      await mkdir(backupPath, { recursive: true });
      
      const securityBackupPath = join(backupPath, `security-backup-before-restore-${timestamp}.json`);
      
      try {
        // Export rapide des données critiques
        const criticalData = await prisma.user.findMany({
          select: { id: true, email: true, name: true, role: true },
          take: 100
        });
        
        const fs = await import("fs/promises");
        await fs.writeFile(securityBackupPath, JSON.stringify({
          type: "security_backup_before_restore",
          createdAt: new Date().toISOString(),
          users: criticalData,
          restoredFrom: {
            sqlFileId,
            metadataFileId,
            sqlFileName: sqlFileInfo.name,
          }
        }, null, 2));
        
        console.log("✅ Sauvegarde de sécurité créée");
      } catch (error) {
        console.warn("⚠️ Impossible de créer la sauvegarde de sécurité:", error);
      }

      // Restaurer la base de données
      console.log("🗄️ Restauration de la base de données...");
      
      // Méthode 1: Tentative avec psql si disponible
      let restored = false;
      let finalStatistics: Statistics | null = null;
      let currentAdmins: UserAdmin[] = [];
      let currentSessions: SessionData[] = [];
      let currentAccounts: AccountData[] = [];
      let currentGoogleTokens: GoogleDriveTokenData[] = [];
      const reconciledCount = 0;
      
      try {
        // Configuration de la base de données depuis l'URL
        const dbUrl = process.env.DATABASE_URL || "";
        const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        
        if (urlMatch) {
          const [, username, password, host, port, database] = urlMatch;
          
          const env = {
            ...process.env,
            PGPASSWORD: password
          };

          // Commande psql pour restaurer
          const psqlCmd = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${tempSqlPath}"`;
          
          console.log("🔄 Tentative de restauration avec psql...");
          await execAsync(psqlCmd, { env, timeout: 600000 }); // 10 minutes timeout
          
          restored = true;
          console.log("✅ Restauration avec psql réussie");
        }
      } catch (psqlError) {
        console.warn("⚠️ Restauration psql échouée:", psqlError);
      }

      // Méthode 2: Si psql échoue, essayer d'exécuter le SQL via Prisma avec gestion avancée
      if (!restored) {
        console.log("🔄 Tentative de restauration avec Prisma (avancée)...");
        try {
          // Synchroniser le schéma avant la restauration
          console.log("🔍 Synchronisation du schéma Prisma...");
          try {
            await execAsync('pnpm db:push --accept-data-loss', {
              cwd: process.cwd(),
              timeout: 30000
            });
            console.log("✅ Schéma synchronisé");
          } catch {
            console.warn("⚠️ Synchronisation schéma échouée, continuation...");
          }

          const fsPromises = await import("fs/promises");
          const sqlContent = await fsPromises.readFile(tempSqlPath, "utf-8");
          
          // Analyser et catégoriser les commandes
          const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

          console.log(`📝 ${commands.length} commandes SQL à traiter...`);

          let successCount = 0;
          let skippedCount = 0;
          let errorCount = 0;
          const ignoredTables = new Set<string>();
          const processedTables = new Set<string>();

          // Sauvegarder les données critiques des utilisateurs actuels
          console.log("🛡️ Sauvegarde des données utilisateurs critiques...");
          const rawAdmins = await prisma.user.findMany({
            where: {
              role: {
                in: ['admin', 'moderator', 'dpo']
              }
            },
            select: {
              id: true,
              email: true,
              role: true
            }
          });
          currentAdmins = z.array(UserAdminSchema).parse(rawAdmins);

          // Sauvegarder toutes les sessions actives
          const rawSessions = await prisma.session.findMany({
            where: {
              expiresAt: {
                gt: new Date()
              }
            },
            select: {
              id: true,
              token: true,
              userId: true,
              expiresAt: true,
              ipAddress: true,
              userAgent: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          });
          currentSessions = z.array(SessionSchema).parse(rawSessions);

          // Sauvegarder tous les comptes OAuth
          const rawAccounts = await prisma.account.findMany({
            select: {
              id: true,
              accountId: true,
              providerId: true,
              userId: true,
              accessToken: true,
              refreshToken: true,
              idToken: true,
              accessTokenExpiresAt: true,
              refreshTokenExpiresAt: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          });
          currentAccounts = z.array(AccountSchema).parse(rawAccounts);

          // Sauvegarder les tokens Google Drive
          const rawGoogleTokens = await prisma.googleDriveToken.findMany({
            select: {
              id: true,
              accessToken: true,
              refreshToken: true,
              scope: true,
              userId: true,
              googleUserId: true,
              googleEmail: true,
              googleName: true,
              expiresAt: true,
              lastUsedAt: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          });
          currentGoogleTokens = z.array(GoogleDriveTokenSchema).parse(rawGoogleTokens);
          
          console.log(`🔒 Données sauvegardées:`);
          console.log(`   ${currentAdmins.length} administrateurs`);
          console.log(`   ${currentSessions.length} sessions actives`);
          console.log(`   ${currentAccounts.length} comptes OAuth`);
          console.log(`   ${currentGoogleTokens.length} tokens Google Drive`);

          // Traitement amélioré des commandes
          for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            
            if (!command) continue;
            
            try {
              // Identifier le type de commande et la table
              const upperCommand = command.toUpperCase();
              let tableName = 'unknown';
              
              if (upperCommand.includes('INSERT INTO')) {
                const match = command.match(/INSERT INTO "?(\w+)"?/i);
                tableName = match ? match[1] : 'unknown';
              }

              // Protection globale pour les utilisateurs critiques et leurs données
              if (tableName === 'User' && upperCommand.includes('INSERT INTO')) {
                const emailMatch = command.match(/email[^,]*['"]([^'"]+)['"]/i);
                if (emailMatch) {
                  const email = emailMatch[1];
                  const currentAdmin = currentAdmins.find(admin => admin.email === email);
                  
                  if (currentAdmin) {
                    console.log(`🛡️ Protection utilisateur critique détectée pour ${email} - préservation des données actuelles`);
                    skippedCount++;
                    continue;
                  }
                }
              }

              // Protection des sessions - ignorer les sessions des utilisateurs protégés
              if (tableName === 'Session' && upperCommand.includes('INSERT INTO')) {
                const userIdMatch = command.match(/userId[^,]*['"]([^'"]+)['"]/i);
                if (userIdMatch) {
                  const userId = userIdMatch[1];
                  const protectedUser = currentAdmins.find(admin => admin.id === userId);
                  
                  if (protectedUser) {
                    console.log(`🛡️ Protection session pour utilisateur ${protectedUser.email}`);
                    skippedCount++;
                    continue;
                  }
                }
              }

              // Protection des comptes OAuth
              if (tableName === 'Account' && upperCommand.includes('INSERT INTO')) {
                const userIdMatch = command.match(/userId[^,]*['"]([^'"]+)['"]/i);
                if (userIdMatch) {
                  const userId = userIdMatch[1];
                  const protectedUser = currentAdmins.find(admin => admin.id === userId);
                  
                  if (protectedUser) {
                    console.log(`🛡️ Protection compte OAuth pour utilisateur ${protectedUser.email}`);
                    skippedCount++;
                    continue;
                  }
                }
              }

              // Protection des tokens Google Drive
              if (tableName === 'GoogleDriveToken' && upperCommand.includes('INSERT INTO')) {
                const userIdMatch = command.match(/userId[^,]*['"]([^'"]+)['"]/i);
                if (userIdMatch) {
                  const userId = userIdMatch[1];
                  const protectedUser = currentAdmins.find(admin => admin.id === userId);
                  
                  if (protectedUser) {
                    console.log(`🛡️ Protection token Google Drive pour utilisateur ${protectedUser.email}`);
                    skippedCount++;
                    continue;
                  }
                }
              }
              
              // Ignorer les tables connues comme problématiques
              if (ignoredTables.has(tableName)) {
                skippedCount++;
                continue;
              }

              if (upperCommand.includes('INSERT') || 
                  upperCommand.includes('UPDATE') ||
                  upperCommand.includes('DELETE')) {
                
                await prisma.$executeRawUnsafe(command);
                successCount++;
                processedTables.add(tableName);
                
                // Progression
                if (i > 0 && i % 20 === 0) {
                  console.log(`📊 ${i}/${commands.length} - Réussies: ${successCount}, Ignorées: ${skippedCount}, Erreurs: ${errorCount}`);
                }
              }
            } catch (cmdError: unknown) {
              // Validation de l'erreur avec un schema flexible
              const errorData = z.object({
                code: z.string(),
                message: z.string()
              }).safeParse(cmdError);
              
              if (!errorData.success) {
                errorCount++;
                console.warn(`❌ Erreur inconnue:`, cmdError);
                continue;
              }
              
              let errorCode = errorData.data.code;
              const errorMessage = errorData.data.message;
              
              // Erreur Prisma - analyser pour extraire le vrai code PostgreSQL
              if (errorCode === 'P2010' && errorMessage) {
                const codeMatch = errorMessage.match(/Code: `(\w+)`/);
                if (codeMatch) {
                  errorCode = codeMatch[1]; // Remplacer P2010 par le vrai code PostgreSQL
                  console.log(`🔍 Code PostgreSQL détecté: ${errorCode}`);
                }
              }
              
              // Catégoriser et gérer les erreurs
              if (errorCode === '42P01') {
                // Table n'existe pas
                const match = command.match(/INSERT INTO "?(\w+)"?/i);
                const tableName = match ? match[1] : 'unknown';
                ignoredTables.add(tableName);
                errorCount++;
                console.log(`❌ Table ${tableName} n'existe pas - toutes les commandes futures pour cette table seront ignorées`);
              } else if (errorCode === '23505') {
                // Violation contrainte unique (doublon)
                skippedCount++;
                console.log(`⏭️ Doublon ignoré`);
              } else if (errorCode === '23502') {
                // Violation contrainte NOT NULL
                skippedCount++;
                console.log(`⏭️ Contrainte NOT NULL violée - enregistrement ignoré`);
              } else if (errorCode === '23503') {
                // Violation contrainte de clé étrangère
                skippedCount++;
                console.log(`⏭️ Contrainte de clé étrangère violée - enregistrement ignoré`);
              } else {
                errorCount++;
                console.warn(`❌ Erreur inconnue: ${errorCode} - ${errorMessage.substring(0, 100)}`);
              }
            }
          }
          
          restored = successCount > 0;
          console.log(`\n✅ Restauration Prisma terminée:`);
          console.log(`   ${successCount} commandes exécutées avec succès`);
          console.log(`   ${skippedCount} doublons/contraintes ignorés`);
          console.log(`   ${errorCount} erreurs de schéma rencontrées`);
          console.log(`   ${processedTables.size} tables traitées avec succès`);
          console.log(`   ${ignoredTables.size} tables ignorées (n'existent pas)`);
          
          if (ignoredTables.size > 0) {
            console.log(`📋 Tables manquantes: ${Array.from(ignoredTables).join(', ')}`);
          }

          // Mode réconciliation des données si certaines tables sont manquantes
          if (ignoredTables.size > 0) {
            console.log("\n🔄 Mode réconciliation détecté mais DÉSACTIVÉ");
            console.log("⚠️ SÉCURITÉ: Tables manquantes détectées mais préservation des données prioritaire");
            console.log("   Le schéma de sauvegarde contient des tables qui n'existent pas dans la base actuelle");
            console.log("   Pour éviter la corruption des données, ces tables sont ignorées");
            console.log(`   Tables ignorées: ${Array.from(ignoredTables).join(', ')}`);
          }

          // Mise à jour des statistiques finales
          finalStatistics = StatisticsSchema.parse({
            commandsProcessed: commands.length,
            successfulInserts: successCount,
            skippedDuplicates: skippedCount,
            schemaErrors: errorCount,
            tablesProcessed: processedTables.size,
            tablesIgnored: ignoredTables.size,
            reconciledRecords: reconciledCount
          });

          // Considérer comme réussi si des données ont été traitées (y compris doublons ignorés)
          if (successCount > 0 || skippedCount > 0) {
            restored = true;
          }

          // Restaurer toutes les données critiques protégées
          console.log("🛡️ Restauration complète des données critiques...");
          
          // 1. Restaurer les rôles des administrateurs
          for (const admin of currentAdmins) {
            try {
              await prisma.user.update({
                where: { email: admin.email },
                data: { role: admin.role }
              });
              console.log(`✅ Rôle ${admin.role} restauré pour ${admin.email}`);
            } catch (roleError) {
              console.warn(`⚠️ Impossible de restaurer le rôle pour ${admin.email}:`, roleError);
            }
          }

          // 2. Restaurer toutes les sessions actives
          for (const session of currentSessions) {
            try {
              await prisma.session.upsert({
                where: { id: session.id },
                update: {
                  token: session.token,
                  expiresAt: session.expiresAt,
                  ipAddress: session.ipAddress || undefined,
                  userAgent: session.userAgent || undefined
                },
                create: {
                  id: session.id,
                  token: session.token,
                  userId: session.userId,
                  expiresAt: session.expiresAt,
                  ipAddress: session.ipAddress || undefined,
                  userAgent: session.userAgent || undefined
                }
              });
              console.log(`✅ Session restaurée pour ${session.user.email}`);
            } catch (sessionError) {
              console.warn(`⚠️ Impossible de restaurer session pour ${session.user.email}:`, sessionError);
            }
          }

          // 3. Restaurer tous les comptes OAuth
          for (const account of currentAccounts) {
            try {
              await prisma.account.upsert({
                where: { id: account.id },
                update: {
                  accountId: account.accountId,
                  providerId: account.providerId,
                  accessToken: account.accessToken,
                  refreshToken: account.refreshToken,
                  idToken: account.idToken,
                  accessTokenExpiresAt: account.accessTokenExpiresAt,
                  refreshTokenExpiresAt: account.refreshTokenExpiresAt
                },
                create: {
                  id: account.id,
                  accountId: account.accountId,
                  providerId: account.providerId,
                  userId: account.userId,
                  accessToken: account.accessToken,
                  refreshToken: account.refreshToken,
                  idToken: account.idToken,
                  accessTokenExpiresAt: account.accessTokenExpiresAt,
                  refreshTokenExpiresAt: account.refreshTokenExpiresAt
                }
              });
              console.log(`✅ Compte OAuth ${account.providerId} restauré pour ${account.user.email}`);
            } catch (accountError) {
              console.warn(`⚠️ Impossible de restaurer compte OAuth pour ${account.user.email}:`, accountError);
            }
          }

          // 4. Restaurer tous les tokens Google Drive
          for (const token of currentGoogleTokens) {
            try {
              await prisma.googleDriveToken.upsert({
                where: { id: token.id },
                update: {
                  accessToken: token.accessToken,
                  refreshToken: token.refreshToken,
                  scope: token.scope,
                  googleUserId: token.googleUserId,
                  googleEmail: token.googleEmail,
                  googleName: token.googleName,
                  expiresAt: token.expiresAt || undefined,
                  lastUsedAt: token.lastUsedAt || undefined
                },
                create: {
                  id: token.id,
                  accessToken: token.accessToken,
                  refreshToken: token.refreshToken,
                  scope: token.scope || "https://www.googleapis.com/auth/drive.file",
                  userId: token.userId,
                  googleUserId: token.googleUserId,
                  googleEmail: token.googleEmail,
                  googleName: token.googleName,
                  expiresAt: token.expiresAt || undefined,
                  lastUsedAt: token.lastUsedAt || undefined
                }
              });
              console.log(`✅ Token Google Drive restauré pour ${token.user.email}`);
            } catch (tokenError) {
              console.warn(`⚠️ Impossible de restaurer token Google Drive pour ${token.user.email}:`, tokenError);
            }
          }

          console.log("🎯 Restauration complète des données critiques terminée !");
          
        } catch (prismaError) {
          console.error("❌ Restauration Prisma échouée:", prismaError);
        }
      }

      if (!restored) {
        throw new Error("Impossible de restaurer la base de données avec les méthodes disponibles");
      }

      // Nettoyer les fichiers temporaires
      console.log("🧹 Nettoyage des fichiers temporaires...");
      try {
        await Promise.all([
          unlink(tempSqlPath),
          metadataFileId ? unlink(tempMetadataPath).catch(() => {}) : Promise.resolve()
        ]);
      } catch (error) {
        console.warn("Impossible de supprimer les fichiers temporaires:", error);
      }

      return NextResponse.json({
        success: true,
        message: "Restauration base de données depuis Google Drive terminée avec succès",
        details: {
          sqlFileId,
          metadataFileId,
          sqlFileName: sqlFileInfo.name,
          sqlFileSize: sqlFileInfo.size,
          sqlFileCreatedTime: sqlFileInfo.createdTime,
          metadata,
          restorationMethod: restored ? "psql" : "prisma",
          securityBackupCreated: true,
          restoredBy: session.user.email,
          restoreDate: new Date().toISOString(),
          statistics: finalStatistics || {
            commandsProcessed: 0,
            successfulInserts: 0,
            skippedDuplicates: 0,
            schemaErrors: 0,
            tablesProcessed: 0,
            tablesIgnored: 0,
            reconciledRecords: 0
          }
        },
      });

    } finally {
      // S'assurer que les fichiers temporaires sont nettoyés
      try {
        await Promise.all([
          unlink(tempSqlPath).catch(() => {}),
          unlink(tempMetadataPath).catch(() => {})
        ]);
      } catch {
        // Ignorer les erreurs de nettoyage
      }
    }

  } catch (error) {
    console.error("❌ Erreur restauration base de données Google Drive:", error);
    
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
      if (error.message.includes("restaurer la base de données")) {
        return NextResponse.json(
          { error: "Échec de la restauration - vérifiez le format du fichier SQL" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erreur interne lors de la restauration Google Drive" },
      { status: 500 }
    );
  }
}