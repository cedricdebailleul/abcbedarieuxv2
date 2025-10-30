import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

// API pour déclencher une sauvegarde programmée (via cron job externe)
// Cette route peut être appelée par un système de tâches programmées
export async function POST(request: NextRequest) {
  try {
    // Vérifier le token de sécurité pour les tâches programmées
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.BACKUP_CRON_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Token d'autorisation invalide" }, { status: 401 });
    }

    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];
    const timeStr = timestamp.split('T')[1].split('.')[0].replace(/:/g, '-');
    
    console.log(`🚀 Début de la sauvegarde automatique ${dateStr} ${timeStr}...`);

    // Créer le dossier de sauvegarde
    const backupDir = join(process.cwd(), "backups", dateStr);
    await mkdir(backupDir, { recursive: true });

    // 1. Sauvegarde complète de la base de données
    console.log("💾 Création de la sauvegarde base de données...");
    
    const backupData = {
      metadata: {
        exportDate: timestamp,
        exportedBy: "SYSTEM_CRON",
        version: "1.0.0",
        type: "AUTOMATED_FULL_BACKUP"
      },
      data: {} as Record<string, unknown>
    };

    // Réutiliser la logique de sauvegarde complète
    const allTables = [
      'users', 'profiles', 'accounts', 'badges', 'userBadges', 'consent',
      'placeCategories', 'places', 'placeToCategories', 'openingHours',
      'events', 'eventParticipants', 'eventReminders', 'recurrenceRules',
      'posts', 'postViews', 'tags', 'postTags', 'categories',
      'reviews', 'googleReviews', 'favorites', 'claims',
      'products', 'services', 'offers', 'partners',
      'abcMembers', 'abcRegistrations', 'abcPayments', 'abcMeetings', 'abcDocuments', 'abcBulletins',
      'historyConfigs', 'historyMilestones', 'historyTimelineEvents',
      'whatsappConversations', 'whatsappMessages', 'whatsappBotSessions', 'whatsappBotConfigs', 'whatsappBotStats',
      'newsletterSubscribers', 'newsletterCampaigns', 'newsletterCampaignSent', 'newsletterAttachments', 'newsletterPreferences',
      'actions', 'userNotificationStatus'
    ];

    let totalRecords = 0;

    // Exporter chaque table avec gestion d'erreur individuelle
    for (const tableName of allTables) {
      try {
        console.log(`📋 Export table: ${tableName}`);
        
        // Mapper les noms de tables aux requêtes Prisma
        let tableData;
        
        switch (tableName) {
          case 'users':
            tableData = await prisma.user.findMany({ include: { profile: true, badges: true, consent: true } });
            break;
          case 'placeCategories':
            tableData = await prisma.placeCategory.findMany({ include: { places: true, parent: true, children: true } });
            break;
          case 'places':
            tableData = await prisma.place.findMany({ 
              include: { 
                categories: { include: { category: true } }, 
                openingHours: true, 
                reviews: true, 
                googleReviews: true, 
                favorites: true, 
                claims: true, 
                events: true, 
                posts: true, 
                products: true, 
                services: true, 
                offers: true, 
                owner: { select: { id: true, name: true, email: true } } 
              } 
            });
            break;
          case 'events':
            tableData = await prisma.event.findMany({ 
              include: { 
                organizer: { select: { id: true, name: true, email: true } }, 
                place: { select: { id: true, name: true, slug: true } }, 
                participants: true, 
                reminders: true 
              } 
            });
            break;
          case 'posts':
            tableData = await prisma.post.findMany({ 
              include: { 
                author: { select: { id: true, name: true, email: true } }, 
                place: { select: { id: true, name: true, slug: true } } 
              } 
            });
            break;
          case 'abcMembers':
            tableData = await prisma.abcMember.findMany({ include: { user: { select: { id: true, name: true, email: true } } } });
            break;
          case 'abcRegistrations':
            tableData = await prisma.abcRegistration.findMany();
            break;
          case 'abcPayments':
            tableData = await prisma.abcPayment.findMany({ include: { member: { include: { user: true } } } });
            break;
          case 'abcMeetings':
            tableData = await prisma.abcMeeting.findMany();
            break;
          case 'abcDocuments':
            tableData = await prisma.abcDocument.findMany();
            break;
          case 'abcBulletins':
            tableData = await prisma.abcBulletin.findMany();
            break;
          case 'newsletterSubscribers':
            tableData = await prisma.newsletterSubscriber.findMany({ include: { preferences: true } });
            break;
          case 'newsletterCampaigns':
            tableData = await prisma.newsletterCampaign.findMany({ include: { attachments: true } });
            break;
          case 'badges':
            tableData = await prisma.badge.findMany();
            break;
          case 'partners':
            tableData = await prisma.partner.findMany();
            break;
          case 'products':
            tableData = await prisma.product.findMany({ include: { place: { select: { id: true, name: true } } } });
            break;
          case 'services':
            tableData = await prisma.service.findMany({ include: { place: { select: { id: true, name: true } } } });
            break;
          case 'offers':
            tableData = await prisma.offer.findMany({ include: { place: { select: { id: true, name: true } } } });
            break;
          case 'historyConfigs':
            tableData = await prisma.historyConfig.findMany({ include: { milestones: true, timelineEvents: true } });
            break;
          default:
            console.log(`⚠️ Table non gérée: ${tableName}`);
            continue;
        }

        if (tableData && Array.isArray(tableData)) {
          backupData.data[tableName] = tableData;
          totalRecords += tableData.length;
          console.log(`✅ ${tableName}: ${tableData.length} enregistrements`);
        }

      } catch (error) {
        console.error(`❌ Erreur export ${tableName}:`, error);
      }
    }

    // Sauvegarder le fichier JSON sur le disque
    const dbBackupPath = join(backupDir, `database-backup-${timeStr}.json`);
    await writeFile(dbBackupPath, JSON.stringify(backupData, null, 2));

    // 2. Créer un fichier de métadonnées pour cette sauvegarde
    const metadataPath = join(backupDir, `metadata.json`);
    const metadata = {
      backupDate: timestamp,
      backupType: "AUTOMATED",
      totalRecords,
      files: {
        database: `database-backup-${timeStr}.json`,
        filesInventory: `files-inventory-${timeStr}.json` // Sera créé par l'API files
      },
      status: "COMPLETED",
      duration: "N/A" // Sera calculé par le système appelant
    };
    
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`✅ Sauvegarde automatique terminée: ${totalRecords} enregistrements`);
    console.log(`📁 Fichiers sauvegardés dans: ${backupDir}`);

    return NextResponse.json({
      success: true,
      message: "Sauvegarde automatique terminée avec succès",
      details: {
        backupDate: timestamp,
        totalRecords,
        backupPath: backupDir,
        files: {
          database: dbBackupPath,
          metadata: metadataPath
        }
      }
    });

  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde automatique:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur lors de la sauvegarde automatique" }, 
      { status: 500 }
    );
  }
}