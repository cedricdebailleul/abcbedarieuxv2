import { prisma } from '@/lib/prisma';
import { sendEmail, createNewsletterEmailTemplate } from '@/lib/email';

interface QueueJob {
  id: string;
  campaignId: string;
  subscriberId: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  processedAt?: Date | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailData {
  subscriber: {
    id: string;
    email: string;
    firstName?: string | null;
    unsubscribeToken: string;
  };
  campaign: {
    id: string;
    title: string;
    subject: string;
    content: string;
    type: string;
  };
  baseUrl: string;
  selectedContent: {
    events: any[];
    places: any[];
    posts: any[];
  };
  attachments: any[];
}

class NewsletterQueue {
  private isProcessing = false;
  private batchSize = 10; // Limite de 10 emails par batch
  private processingDelay = 1000; // 1 seconde entre chaque email
  private batchDelay = 5000; // 5 secondes entre chaque batch

  async addToQueue(campaignId: string, subscriberIds: string[], priority: number = 0) {
    try {
      // Ajouter les tâches à la base de données
      const jobs = subscriberIds.map(subscriberId => ({
        campaignId,
        subscriberId,
        priority,
        attempts: 0,
        maxAttempts: 3,
        scheduledAt: new Date(),
        status: 'PENDING' as const
      }));

      // Utiliser une transaction pour insérer tous les jobs
      await prisma.$transaction(async (tx) => {
        for (const job of jobs) {
          await tx.newsletterQueue.create({
            data: job
          });
        }
      });

      console.log(`✅ ${jobs.length} emails ajoutés à la file d'attente pour la campagne ${campaignId}`);

      // Démarrer le traitement si ce n'est pas déjà en cours
      if (!this.isProcessing) {
        this.processQueue();
      }

      return { success: true, queued: jobs.length };
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout à la file d\'attente:', error);
      throw error;
    }
  }

  async processQueue() {
    if (this.isProcessing) {
      console.log('🔄 Traitement de la file d\'attente déjà en cours');
      return;
    }

    this.isProcessing = true;
    console.log('🚀 Démarrage du traitement de la file d\'attente');

    // Vérifier et corriger les campagnes qui peuvent être coincées en statut SENDING
    await this.updateCampaignStatuses();

    try {
      while (true) {
        // Récupérer le prochain batch de jobs en attente
        const pendingJobs = await prisma.newsletterQueue.findMany({
          where: {
            status: 'PENDING',
            scheduledAt: { lte: new Date() }
          },
          orderBy: [
            { priority: 'desc' },
            { scheduledAt: 'asc' }
          ],
          take: this.batchSize
        });

        if (pendingJobs.length === 0) {
          console.log('📭 Aucun job en attente, arrêt du traitement');
          break;
        }

        console.log(`📧 Traitement d'un batch de ${pendingJobs.length} emails...`);

        // Traiter chaque job du batch
        for (const job of pendingJobs) {
          await this.processJob(job);
          
          // Délai entre chaque email pour éviter de surcharger le serveur SMTP
          if (pendingJobs.indexOf(job) < pendingJobs.length - 1) {
            await this.sleep(this.processingDelay);
          }
        }

        // Vérifier et mettre à jour les statuts des campagnes après chaque batch
        await this.updateCampaignStatuses();

        // Délai entre chaque batch
        await this.sleep(this.batchDelay);
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement de la file d\'attente:', error);
    } finally {
      this.isProcessing = false;
      console.log('✅ Traitement de la file d\'attente terminé');
    }
  }

  private async processJob(job: QueueJob) {
    try {
      // Marquer comme en cours de traitement
      await prisma.newsletterQueue.update({
        where: { id: job.id },
        data: { status: 'PROCESSING' }
      });

      // Récupérer les données nécessaires
      const emailData = await this.getEmailData(job.campaignId, job.subscriberId);
      
      if (!emailData) {
        throw new Error('Données email introuvables');
      }

      // Créer l'URL de tracking
      const trackingPixelUrl = `${emailData.baseUrl}/api/newsletter/track/open?c=${job.campaignId}&s=${job.subscriberId}`;
      const unsubscribeUrl = `${emailData.baseUrl}/newsletter/unsubscribe?token=${emailData.subscriber.unsubscribeToken}`;

      // Mapper les pièces jointes pour le template email
      const templateAttachments = emailData.attachments.map(attachment => ({
        name: attachment.originalName,
        size: attachment.fileSize,
        type: attachment.fileType,
        url: `${emailData.baseUrl}${attachment.filePath}`
      }));

      // Générer le contenu de l'email
      const emailHtml = createNewsletterEmailTemplate({
        campaignTitle: emailData.campaign.title,
        subject: emailData.campaign.subject,
        content: emailData.campaign.content,
        unsubscribeUrl,
        trackingPixelUrl,
        subscriberName: emailData.subscriber.firstName || undefined,
        events: emailData.selectedContent.events,
        places: emailData.selectedContent.places,
        posts: emailData.selectedContent.posts,
        attachments: templateAttachments,
        campaignId: job.campaignId,
        subscriberId: job.subscriberId
      });

      // Préparer les pièces jointes pour l'email
      const emailAttachments = emailData.attachments.map(attachment => ({
        filename: attachment.originalName,
        path: `${process.cwd()}/public${attachment.filePath}`, // Chemin vers le fichier
        contentType: attachment.fileType
      }));

      // Envoyer l'email
      const emailResult = await sendEmail({
        to: emailData.subscriber.email,
        subject: emailData.campaign.subject,
        html: emailHtml,
        attachments: emailAttachments.length > 0 ? emailAttachments : undefined
      });

      if (emailResult.success) {
        // Marquer le job comme réussi
        await prisma.newsletterQueue.update({
          where: { id: job.id },
          data: { 
            status: 'COMPLETED',
            error: null
          }
        });

        // Enregistrer l'envoi dans la table de suivi
        await prisma.newsletterCampaignSent.upsert({
          where: {
            campaignId_subscriberId: {
              campaignId: job.campaignId,
              subscriberId: job.subscriberId
            }
          },
          update: {
            sentAt: new Date(),
            status: emailResult.development ? 'SENT' : 'DELIVERED'
          },
          create: {
            campaignId: job.campaignId,
            subscriberId: job.subscriberId,
            sentAt: new Date(),
            status: emailResult.development ? 'SENT' : 'DELIVERED'
          }
        });

        console.log(`✅ Email envoyé avec succès à ${emailData.subscriber.email}`);
      } else {
        throw new Error(emailResult.error || 'Erreur d\'envoi inconnue');
      }

    } catch (error) {
      console.error(`❌ Erreur lors du traitement du job ${job.id}:`, error);

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const attempts = job.attempts + 1;
      const status = attempts >= job.maxAttempts ? 'FAILED' : 'PENDING';
      const scheduledAt = attempts < job.maxAttempts 
        ? new Date(Date.now() + Math.pow(2, attempts) * 60000) // Backoff exponentiel
        : undefined;

      await prisma.newsletterQueue.update({
        where: { id: job.id },
        data: {
          status,
          attempts,
          error: errorMessage,
          ...(scheduledAt && { scheduledAt })
        }
      });

      if (status === 'FAILED') {
        // Enregistrer l'échec
        await prisma.newsletterCampaignSent.upsert({
          where: {
            campaignId_subscriberId: {
              campaignId: job.campaignId,
              subscriberId: job.subscriberId
            }
          },
          update: {
            status: 'FAILED',
            errorMessage: errorMessage
          },
          create: {
            campaignId: job.campaignId,
            subscriberId: job.subscriberId,
            status: 'FAILED',
            errorMessage: errorMessage
          }
        });
      }
    }
  }

  private async getEmailData(campaignId: string, subscriberId: string): Promise<EmailData | null> {
    try {
      const campaign = await prisma.newsletterCampaign.findUnique({
        where: { id: campaignId },
        include: {
          attachments: true
        }
      });

      const subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { id: subscriberId },
        select: {
          id: true,
          email: true,
          firstName: true,
          unsubscribeToken: true
        }
      });

      if (!campaign || !subscriber) {
        return null;
      }

      // Récupérer les contenus sélectionnés basés sur les IDs
      const [events, places, posts] = await Promise.all([
        // Événements
        campaign.includedEvents.length > 0 
          ? prisma.event.findMany({
              where: { id: { in: campaign.includedEvents } },
              select: {
                id: true,
                title: true,
                slug: true,
                summary: true,
                description: true,
                startDate: true,
                endDate: true,
                isAllDay: true,
                locationName: true,
                locationAddress: true,
                locationCity: true,
                coverImage: true,
                category: true
              }
            })
          : [],
        
        // Places
        campaign.includedPlaces.length > 0
          ? prisma.place.findMany({
              where: { id: { in: campaign.includedPlaces } },
              select: {
                id: true,
                name: true,
                slug: true,
                summary: true,
                description: true,
                street: true,
                city: true,
                phone: true,
                website: true,
                logo: true,
                coverImage: true,
                type: true
              }
            })
          : [],
        
        // Posts
        campaign.includedPosts.length > 0
          ? prisma.post.findMany({
              where: { id: { in: campaign.includedPosts } },
              select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                coverImage: true,
                publishedAt: true,
                author: {
                  select: { name: true }
                }
              }
            })
          : []
      ]);

      const baseUrl = process.env.NEXTAUTH_URL || 'https://abc-bedarieux.fr';

      return {
        subscriber,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          subject: campaign.subject,
          content: campaign.content,
          type: campaign.type
        },
        baseUrl,
        selectedContent: {
          events,
          places,
          posts
        },
        attachments: campaign.attachments
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données email:', error);
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async updateCampaignStatuses() {
    try {
      // Récupérer toutes les campagnes en cours d'envoi
      const sendingCampaigns = await prisma.newsletterCampaign.findMany({
        where: {
          status: 'SENDING'
        },
        select: {
          id: true,
          title: true,
          totalRecipients: true
        }
      });

      for (const campaign of sendingCampaigns) {
        // Vérifier si tous les jobs de cette campagne sont terminés
        const [pendingCount, totalJobsCount, completedCount, failedCount] = await Promise.all([
          prisma.newsletterQueue.count({
            where: {
              campaignId: campaign.id,
              status: { in: ['PENDING', 'PROCESSING'] }
            }
          }),
          prisma.newsletterQueue.count({
            where: {
              campaignId: campaign.id
            }
          }),
          prisma.newsletterQueue.count({
            where: {
              campaignId: campaign.id,
              status: 'COMPLETED'
            }
          }),
          prisma.newsletterQueue.count({
            where: {
              campaignId: campaign.id,
              status: 'FAILED'
            }
          })
        ]);

        // Si plus aucun job en attente ou en cours de traitement
        if (pendingCount === 0 && totalJobsCount > 0) {
          const newStatus = failedCount === totalJobsCount ? 'ERROR' : 'SENT';
          
          await prisma.newsletterCampaign.update({
            where: { id: campaign.id },
            data: {
              status: newStatus,
              totalSent: completedCount,
              totalDelivered: completedCount // On assume que les emails sont délivrés s'ils sont envoyés avec succès
            }
          });

          console.log(`✅ Campagne "${campaign.title}" mise à jour avec le statut ${newStatus} (${completedCount} réussies, ${failedCount} échouées)`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des statuts de campagne:', error);
    }
  }

  async getQueueStatus() {
    const stats = await prisma.newsletterQueue.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    return stats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);
  }

  async clearCompletedJobs(olderThanDays: number = 7) {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const result = await prisma.newsletterQueue.deleteMany({
      where: {
        status: 'COMPLETED',
        scheduledAt: { lt: cutoffDate }
      }
    });

    console.log(`🧹 ${result.count} jobs complétés supprimés de la file d'attente`);
    return result.count;
  }

  async fixStuckCampaigns() {
    console.log('🔍 Vérification des campagnes bloquées...');
    await this.updateCampaignStatuses();
    console.log('✅ Mise à jour des campagnes terminée');
  }
}

export const newsletterQueue = new NewsletterQueue();