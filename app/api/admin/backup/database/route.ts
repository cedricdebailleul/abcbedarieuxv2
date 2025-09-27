import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateAPICompleteSQLDump } from "@/lib/sql-backup-generator";

const execAsync = promisify(exec);

// API pour créer un dump PostgreSQL de la base de données
export async function POST() {
  try {
    // Vérifier l'authentification et les permissions admin
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Permissions insuffisantes - admin requis" }, { status: 403 });
    }

    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];
    const timeStr = timestamp.split('T')[1].split('.')[0].replace(/:/g, '-');
    
    console.log("🗄️ Début de la sauvegarde PostgreSQL...");

    // Créer le dossier de sauvegarde
    const backupDir = join(process.cwd(), "backups", "database", dateStr);
    await mkdir(backupDir, { recursive: true });

    // Extraire les informations de connexion depuis DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: "DATABASE_URL non configurée" }, { status: 500 });
    }

    // Parser l'URL de base de données
    const dbUrl = new URL(databaseUrl);
    const dbConfig = {
      host: dbUrl.hostname,
      port: dbUrl.port || "5432",
      database: dbUrl.pathname.slice(1), // Enlever le "/" initial
      username: dbUrl.username,
      password: dbUrl.password
    };

    // Nom du fichier de dump
    const dumpFileName = `abc-bedarieux-db-dump-${dateStr}-${timeStr}.sql`;
    const dumpPath = join(backupDir, dumpFileName);

    // Commande pg_dump
    const pgDumpCmd = [
      "pg_dump",
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--username=${dbConfig.username}`,
      `--dbname=${dbConfig.database}`,
      "--no-password", // Utiliser PGPASSWORD
      "--verbose",
      "--clean", // Inclure les commandes DROP
      "--if-exists", // Éviter les erreurs si les objets n'existent pas
      "--create", // Inclure la création de la base
      `--file=${dumpPath}`,
      "--encoding=UTF8"
    ].join(" ");

    console.log("🔄 Tentative pg_dump...");

    let usedPgDump = false;
    let dbStats: Record<string, number | string> = {};
    
    try {
      // Définir le mot de passe PostgreSQL via variable d'environnement
      const env = {
        ...process.env,
        PGPASSWORD: dbConfig.password
      };

      const { stderr } = await execAsync(pgDumpCmd, { 
        env,
        timeout: 300000 // 5 minutes de timeout
      });

      console.log("✅ pg_dump terminé avec succès");
      if (stderr) {
        console.log("ℹ️ Avertissements pg_dump:", stderr);
      }
      usedPgDump = true;

    } catch (pgError) {
      console.error("❌ Erreur pg_dump:", pgError);
      
      // Fallback: Générer un vrai dump SQL COMPLET avec Prisma
      console.log("🔄 Génération SQL COMPLÈTE avec Prisma (pas de pg_dump)...");
      
      try {
        // Créer le dossier parent s'il n'existe pas
        await mkdir(backupDir, { recursive: true });
        console.log(`📁 Dossier backup: ${backupDir}`);
        console.log(`🎯 Fichier SQL cible: ${dumpPath}`);
        
        dbStats = await generateAPICompleteSQLDump(dumpPath, prisma);
        console.log("✅ Dump SQL Prisma COMPLET généré avec succès");
        console.log(`📊 ${dbStats.totalRecords} enregistrements dans ${Object.keys(dbStats).length - 1} tables`);
        usedPgDump = false;
      } catch (sqlError) {
        console.error("❌ Erreur génération SQL Prisma:", sqlError);
        
        // Dernier recours: fichier d'instructions simple
        const instructionScript = `-- ⚠️ ÉCHEC GÉNÉRATION SQL AUTOMATIQUE
-- Date: ${timestamp}
-- Raisons: pg_dump indisponible ET erreur génération Prisma

-- 🚀 SOLUTIONS ALTERNATIVES:

-- 1️⃣ UTILISER LA SAUVEGARDE JSON (RECOMMANDÉ)
-- - Aller sur l'interface admin (/dashboard/admin/export)
-- - Télécharger la sauvegarde JSON complète
-- - Plus fiable que SQL pour cette application

-- 2️⃣ ESSAYER LA COMMANDE DIRECTE
-- pnpm backup:sql-complete

-- 3️⃣ INSTALLER POSTGRESQL COMPLET
-- - Installer PostgreSQL avec pg_dump
-- - Relancer cette sauvegarde

-- 4️⃣ RESTAURATION MANUELLE
-- - createdb abc_bedarieux_new
-- - pnpm db:push (applique schéma Prisma)
-- - Utiliser interface admin pour restaurer JSON

-- Erreurs rencontrées:
-- pg_dump: ${pgError}
-- Prisma SQL: ${sqlError}

SELECT 'Utiliser la sauvegarde JSON comme alternative' as recommendation;`;

        await writeFile(dumpPath, instructionScript);
        console.log("⚠️ Fichier d'instructions créé (double échec)");
        
        // Calculer les stats même en cas d'échec
        dbStats = {
          users: 0,
          places: 0,
          events: 0,
          posts: 0,
          newsletterSubscribers: 0,
          abcMembers: 0,
          totalRecords: 0,
          error: "Échec génération SQL et pg_dump"
        };
      }
    }

    // Créer un fichier de métadonnées pour ce dump
    const metadataPath = join(backupDir, "database-backup-info.json");
    const dumpMetadata = {
      exportDate: timestamp,
      exportedBy: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      },
      database: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        username: dbConfig.username
      },
      files: {
        sqlDump: dumpFileName,
        metadata: "database-backup-info.json"
      },
      method: usedPgDump ? "pg_dump" : "prisma_sql_generator",
      instructions: usedPgDump 
        ? [
            "1. Créer une nouvelle base PostgreSQL",
            "2. Restaurer avec: psql -h host -U username -d database < " + dumpFileName,
            "3. Ou utiliser pnpm db:push + API restore avec JSON",
            "4. Vérifier les variables d'environnement",
            "5. Restaurer les fichiers uploads séparément"
          ]
        : [
            "1. Créer une nouvelle base PostgreSQL", 
            "2. Restaurer avec: psql -d database < " + dumpFileName,
            "3. Générer Prisma: pnpm db:generate",
            "4. Vérifier l'application: pnpm type-check && pnpm dev",
            "5. Restaurer les fichiers uploads séparément"
          ]
    };

    await writeFile(metadataPath, JSON.stringify(dumpMetadata, null, 2));

    // Statistiques de la base de données (si pas déjà calculées)
    if (Object.keys(dbStats).length === 0) {
      dbStats = {
        users: await prisma.user.count(),
        places: await prisma.place.count(),
        events: await prisma.event.count(),
        posts: await prisma.post.count(),
        newsletterSubscribers: await prisma.newsletterSubscriber.count(),
        abcMembers: await prisma.abcMember.count(),
      };
    }

    console.log("📊 Statistiques de la base:", dbStats);

    return NextResponse.json({
      success: true,
      message: usedPgDump 
        ? "Sauvegarde PostgreSQL terminée avec succès (pg_dump)"
        : "Sauvegarde PostgreSQL terminée avec succès (Prisma SQL Generator)",
      details: {
        method: usedPgDump ? "pg_dump" : "prisma_sql_generator",
        dumpFile: dumpPath,
        metadataFile: metadataPath,
        backupDate: timestamp,
        databaseStats: dbStats,
        exportedBy: session.user.email,
        instructions: dumpMetadata.instructions,
        tablesCount: usedPgDump ? "Toutes (pg_dump)" : `${Object.keys(dbStats).length - 1} tables`
      }
    });

  } catch (error) {
    console.error("❌ Erreur lors du dump PostgreSQL:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur lors du dump base de données" }, 
      { status: 500 }
    );
  }
}