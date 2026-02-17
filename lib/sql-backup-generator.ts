import { PrismaClient } from "@/lib/generated/prisma";
import { prisma as sharedPrisma } from "@/lib/prisma";
import { writeFile } from "node:fs/promises";

// Version optimisée pour l'API backup/database
export async function generateAPICompleteSQLDump(outputPath: string, prismaClient?: PrismaClient) {
  console.log("🔄 Génération SQL API avec tables principales...");
  console.log(`🎯 Fichier cible: ${outputPath}`);

  // Utiliser l'instance Prisma fournie ou l'instance partagée
  const prisma = prismaClient || sharedPrisma;

  const timestamp = new Date().toISOString();
  
  // Fonction utilitaire pour échapper les chaînes SQL
  const escapeSql = (str: string | null | undefined): string => {
    if (str === null || str === undefined) return 'NULL';
    return `'${str.toString().replace(/'/g, "''")}'`;
  };
  
  const escapeDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'NULL';
    return `'${new Date(date).toISOString()}'`;
  };

  const escapeBoolean = (bool: boolean | null | undefined): string => {
    if (bool === null || bool === undefined) return 'NULL';
    return bool ? 'true' : 'false';
  };


  let sqlContent = `-- ABC BÉDARIEUX - DUMP SQL PRINCIPAL (API)
-- Date: ${timestamp}
-- Généré via API avec Prisma - TABLES PRINCIPALES

BEGIN;

-- Désactiver les contraintes temporairement
SET session_replication_role = replica;

-- Nettoyage des tables principales
DELETE FROM "user_badge";
DELETE FROM "Badge";
DELETE FROM "AbcMember";
DELETE FROM "abc_registrations";
DELETE FROM "NewsletterSubscriber";
DELETE FROM "Account";
DELETE FROM "Session";
DELETE FROM "User";

`;

  try {
    let totalRecords = 0;

    // 1. Users
    console.log("👥 Export users...");
    const users = await prisma.user.findMany();
    if (users.length > 0) {
      sqlContent += `\n-- USERS (${users.length} records)\n`;
      for (const user of users) {
        const values = [
          escapeSql(user.id),
          escapeSql(user.name),
          escapeSql(user.email),
          escapeBoolean(user.emailVerified),
          escapeSql(user.image),
          escapeSql(user.slug),
          escapeDate(user.createdAt),
          escapeDate(user.updatedAt),
          escapeSql(user.role),
          escapeSql(user.status),
          escapeBoolean(user.banned),
          escapeSql(user.banReason),
          escapeDate(user.banExpires),
          escapeSql(user.bannedBy)
        ];
        sqlContent += `INSERT INTO "User" (id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, status, banned, "banReason", "banExpires", "bannedBy") VALUES (${values.join(', ')});\n`;
      }
      totalRecords += users.length;
    }

    // 2. Sessions
    console.log("🔐 Export sessions...");
    const sessions = await prisma.session.findMany();
    if (sessions.length > 0) {
      sqlContent += `\n-- SESSIONS (${sessions.length} records)\n`;
      for (const session of sessions) {
        const values = [
          escapeSql(session.id),
          escapeSql(session.userId),
          escapeDate(session.expiresAt),
          escapeSql(session.token),
          escapeDate(session.createdAt),
          escapeDate(session.updatedAt)
        ];
        sqlContent += `INSERT INTO "Session" (id, "userId", "expiresAt", token, "createdAt", "updatedAt") VALUES (${values.join(', ')});\n`;
      }
      totalRecords += sessions.length;
    }

    // 3. Accounts
    console.log("🔗 Export accounts...");
    const accounts = await prisma.account.findMany();
    if (accounts.length > 0) {
      sqlContent += `\n-- ACCOUNTS (${accounts.length} records)\n`;
      for (const account of accounts) {
        const values = [
          escapeSql(account.id),
          escapeSql(account.userId),
          escapeSql(account.accountId),
          escapeSql(account.providerId),
          escapeSql(account.accessToken),
          escapeSql(account.refreshToken),
          escapeDate(account.accessTokenExpiresAt),
          escapeDate(account.refreshTokenExpiresAt),
          escapeSql(account.scope),
          escapeSql(account.password),
          escapeDate(account.createdAt),
          escapeDate(account.updatedAt)
        ];
        sqlContent += `INSERT INTO "Account" (id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") VALUES (${values.join(', ')});\n`;
      }
      totalRecords += accounts.length;
    }

    // 4. Badges
    console.log("🏆 Export badges...");
    const badges = await prisma.badge.findMany();
    if (badges.length > 0) {
      sqlContent += `\n-- BADGES (${badges.length} records)\n`;
      for (const badge of badges) {
        const values = [
          escapeSql(badge.id),
          escapeSql(badge.title),
          escapeSql(badge.description),
          escapeSql(badge.iconUrl),
          escapeSql(badge.color),
          escapeSql(badge.category),
          escapeSql(badge.rarity),
          escapeBoolean(badge.isActive),
          escapeDate(badge.createdAt),
          escapeDate(badge.updatedAt)
        ];
        sqlContent += `INSERT INTO "Badge" (id, title, description, "iconUrl", color, category, rarity, "isActive", "createdAt", "updatedAt") VALUES (${values.join(', ')});\n`;
      }
      totalRecords += badges.length;
    }

    // 5. User Badges
    console.log("🎖️ Export user badges...");
    const userBadges = await prisma.userBadge.findMany();
    if (userBadges.length > 0) {
      sqlContent += `\n-- USER BADGES (${userBadges.length} records)\n`;
      for (const userBadge of userBadges) {
        const values = [
          escapeSql(userBadge.id),
          escapeSql(userBadge.userId),
          escapeSql(userBadge.badgeId),
          escapeDate(userBadge.earnedAt),
          escapeSql(userBadge.reason),
          escapeBoolean(userBadge.isVisible)
        ];
        sqlContent += `INSERT INTO "user_badge" (id, "userId", "badgeId", "earnedAt", reason, "isVisible") VALUES (${values.join(', ')});\n`;
      }
      totalRecords += userBadges.length;
    }

    // 6. Newsletter Subscribers
    console.log("📧 Export newsletter subscribers...");
    const subscribers = await prisma.newsletterSubscriber.findMany();
    if (subscribers.length > 0) {
      sqlContent += `\n-- NEWSLETTER SUBSCRIBERS (${subscribers.length} records)\n`;
      for (const subscriber of subscribers) {
        const values = [
          escapeSql(subscriber.id),
          escapeSql(subscriber.email),
          escapeSql(subscriber.firstName),
          escapeSql(subscriber.lastName),
          escapeBoolean(subscriber.isActive),
          escapeBoolean(subscriber.isVerified),
          escapeSql(subscriber.verificationToken),
          escapeSql(subscriber.unsubscribeToken),
          escapeDate(subscriber.subscribedAt),
          escapeDate(subscriber.lastEmailSent),
          escapeDate(subscriber.createdAt),
          escapeDate(subscriber.updatedAt)
        ];
        sqlContent += `INSERT INTO "NewsletterSubscriber" (id, email, "firstName", "lastName", "isActive", "isVerified", "verificationToken", "unsubscribeToken", "subscribedAt", "lastEmailSent", "createdAt", "updatedAt") VALUES (${values.join(', ')});\n`;
      }
      totalRecords += subscribers.length;
    }

    // 7. ABC Members  
    console.log("👨‍👩‍👧‍👦 Export ABC members...");
    const abcMembers = await prisma.abcMember.findMany();
    if (abcMembers.length > 0) {
      sqlContent += `\n-- ABC MEMBERS (${abcMembers.length} records)\n`;
      for (const member of abcMembers) {
        const values = [
          escapeSql(member.id),
          escapeSql(member.userId),
          escapeSql(member.type),
          escapeSql(member.role),
          escapeSql(member.status),
          escapeSql(member.memberNumber),
          escapeDate(member.membershipDate),
          escapeDate(member.joinedAt),
          escapeDate(member.renewedAt),
          escapeDate(member.expiresAt),
          escapeDate(member.createdAt),
          escapeDate(member.updatedAt)
        ];
        sqlContent += `INSERT INTO "AbcMember" (id, "userId", type, role, status, "memberNumber", "membershipDate", "joinedAt", "renewedAt", "expiresAt", "createdAt", "updatedAt") VALUES (${values.join(', ')});\n`;
      }
      totalRecords += abcMembers.length;
    }

    // 8. ABC Registrations
    console.log("📝 Export ABC registrations...");
    const abcRegistrations = await prisma.abcRegistration.findMany();
    if (abcRegistrations.length > 0) {
      sqlContent += `\n-- ABC REGISTRATIONS (${abcRegistrations.length} records)\n`;
      for (const registration of abcRegistrations) {
        const values = [
          escapeSql(registration.id),
          escapeSql(registration.firstName),
          escapeSql(registration.lastName),
          escapeSql(registration.commercialName),
          escapeSql(registration.email),
          escapeSql(registration.phone),
          escapeSql(registration.birthDate),
          escapeSql(registration.address),
          escapeSql(registration.postalCode),
          escapeSql(registration.city),
          escapeSql(registration.membershipType),
          escapeSql(registration.status),
          escapeDate(registration.processedAt),
          escapeSql(registration.processedBy),
          escapeSql(registration.adminNotes),
          escapeDate(registration.createdAt),
          escapeDate(registration.updatedAt)
        ];
        sqlContent += `INSERT INTO "abc_registrations" (id, "firstName", "lastName", "commercialName", email, phone, "birthDate", address, "postalCode", city, "membershipType", status, "processedAt", "processedBy", "adminNotes", "createdAt", "updatedAt") VALUES (${values.join(', ')});\n`;
      }
      totalRecords += abcRegistrations.length;
    }

    // Finaliser le script
    sqlContent += `
-- Réactiver les contraintes
SET session_replication_role = DEFAULT;

COMMIT;

-- RÉSUMÉ DE LA SAUVEGARDE API
-- Total des enregistrements exportés: ${totalRecords}
-- Tables exportées: 8 tables principales (Users, Sessions, Accounts, Badges, Newsletter, ABC)
-- Méthode: Prisma SQL Generator (API optimisée)

-- INSTRUCTIONS DE RESTAURATION:
-- 1. Créer nouvelle base: createdb abc_bedarieux_restore
-- 2. Appliquer ce dump: psql -d abc_bedarieux_restore < dump.sql
-- 3. Générer Prisma: pnpm db:generate
-- 4. Vérifier: pnpm type-check && pnpm dev

-- ✅ RESTAURATION SQL API TERMINÉE
-- Total: ${totalRecords} enregistrements dans 8 tables principales
`;

    console.log(`💾 Écriture fichier SQL: ${outputPath}`);
    console.log(`📏 Taille contenu: ${sqlContent.length} caractères`);
    
    await writeFile(outputPath, sqlContent);
    console.log(`✅ Fichier SQL API créé avec succès: ${outputPath}`);
    
    const stats = {
      users: users.length,
      sessions: sessions.length,
      accounts: accounts.length,
      badges: badges.length,
      userBadges: userBadges.length,
      subscribers: subscribers.length,
      abcMembers: abcMembers.length,
      abcRegistrations: abcRegistrations.length,
      totalRecords
    };
    
    console.log(`📊 ${totalRecords} enregistrements exportés dans 8 tables principales`);
    
    return stats;

  } catch (error) {
    console.error("❌ Erreur génération SQL API:", error);
    throw error;
  } finally {
    // Fermer la connexion Prisma si on l'a créée
    if (!prismaClient) {
      await prisma.$disconnect();
    }
  }
}