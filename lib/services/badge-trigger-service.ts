import { getBadgeEngine } from "@/lib/engines/badge-engine";
import { BadgeAwardResult } from "@/lib/types/badge-engine";
// EventType and EventContext imports reserved for future use

// ============================================================
//                    BADGE TRIGGER SERVICE
// ============================================================

export class BadgeTriggerService {
  private static instance: BadgeTriggerService | null = null;

  public static getInstance(): BadgeTriggerService {
    if (!BadgeTriggerService.instance) {
      BadgeTriggerService.instance = new BadgeTriggerService();
    }
    return BadgeTriggerService.instance;
  }

  private constructor() {}

  // ============================================================
  //                    TRIGGER METHODS
  // ============================================================

  /**
   * Déclenche l'évaluation des badges lors de l'inscription d'un utilisateur
   */
  public async triggerUserRegistration(userId: string): Promise<void> {
    console.log(`🎖️ Triggering user registration badges for user: ${userId}`);
    
    // EventContext reserved for future event tracking enhancement

    try {
      const engine = getBadgeEngine();
      const results = await engine.awardEligibleBadges(userId, 'USER_CREATED');
      
      this.logBadgeResults('User Registration', results);
    } catch (error) {
      console.error('Error triggering user registration badges:', error);
    }
  }

  /**
   * Déclenche l'évaluation des badges lors de la mise à jour du profil
   */
  public async triggerProfileUpdate(userId: string): Promise<void> {
    console.log(`🎖️ Triggering profile update badges for user: ${userId}`);
    
    // EventContext reserved for future event tracking enhancement

    try {
      const engine = getBadgeEngine();
      const results = await engine.awardEligibleBadges(userId, 'PROFILE_COMPLETED');
      
      this.logBadgeResults('Profile Update', results);
    } catch (error) {
      console.error('Error triggering profile update badges:', error);
    }
  }

  /**
   * Déclenche l'évaluation des badges lors de la création d'une place
   */
  public async triggerPlaceCreation(userId: string, placeId: string): Promise<void> {
    console.log(`🎖️ Triggering place creation badges for user: ${userId}, place: ${placeId}`);
    
    // const eventContext: EventContext = {
    //   type: 'PLACE_CREATED',
    //   entityId: placeId,
    //   entityType: 'PLACE',
    //   timestamp: new Date(),
    //   metadata: { trigger: 'place_creation', placeId }
    // };

    try {
      const engine = getBadgeEngine();
      const results = await engine.awardEligibleBadges(userId, 'PLACE_CREATED');
      
      this.logBadgeResults('Place Creation', results);
    } catch (error) {
      console.error('Error triggering place creation badges:', error);
    }
  }

  /**
   * Déclenche l'évaluation des badges lors de la création d'un article
   */
  public async triggerPostCreation(userId: string, postId: string): Promise<void> {
    console.log(`🎖️ Triggering post creation badges for user: ${userId}, post: ${postId}`);
    
    // const eventContext: EventContext = {
    //   type: 'POST_CREATED',
    //   entityId: postId,
    //   entityType: 'POST',
    //   timestamp: new Date(),
    //   metadata: { trigger: 'post_creation', postId }
    // };

    try {
      const engine = getBadgeEngine();
      const results = await engine.awardEligibleBadges(userId, 'POST_CREATED');
      
      this.logBadgeResults('Post Creation', results);
    } catch (error) {
      console.error('Error triggering post creation badges:', error);
    }
  }

  /**
   * Déclenche l'évaluation des badges lors de la publication d'un article
   */
  public async triggerPostPublication(userId: string, postId: string): Promise<void> {
    console.log(`🎖️ Triggering post publication badges for user: ${userId}, post: ${postId}`);
    
    // const eventContext: EventContext = {
    //   type: 'POST_PUBLISHED',
    //   entityId: postId,
    //   entityType: 'POST',
    //   timestamp: new Date(),
    //   metadata: { trigger: 'post_publication', postId }
    // };

    try {
      const engine = getBadgeEngine();
      const results = await engine.awardEligibleBadges(userId, 'POST_PUBLISHED');
      
      this.logBadgeResults('Post Publication', results);
    } catch (error) {
      console.error('Error triggering post publication badges:', error);
    }
  }

  /**
   * Déclenche l'évaluation des badges lors de la création d'un avis
   */
  public async triggerReviewCreation(userId: string, reviewId: string): Promise<void> {
    console.log(`🎖️ Triggering review creation badges for user: ${userId}, review: ${reviewId}`);
    
    // const eventContext: EventContext = {
    //   type: 'REVIEW_CREATED',
    //   entityId: reviewId,
    //   entityType: 'REVIEW',
    //   timestamp: new Date(),
    //   metadata: { trigger: 'review_creation', reviewId }
    // };

    try {
      const engine = getBadgeEngine();
      const results = await engine.awardEligibleBadges(userId, 'REVIEW_CREATED');
      
      this.logBadgeResults('Review Creation', results);
    } catch (error) {
      console.error('Error triggering review creation badges:', error);
    }
  }

  /**
   * Déclenche l'évaluation des badges lors de la création d'un événement
   */
  public async triggerEventCreation(userId: string, eventId: string): Promise<void> {
    console.log(`🎖️ Triggering event creation badges for user: ${userId}, event: ${eventId}`);
    
    // const eventContext: EventContext = {
    //   type: 'EVENT_CREATED',
    //   entityId: eventId,
    //   entityType: 'EVENT',
    //   timestamp: new Date(),
    //   metadata: { trigger: 'event_creation', eventId }
    // };

    try {
      const engine = getBadgeEngine();
      const results = await engine.awardEligibleBadges(userId, 'EVENT_CREATED');
      
      this.logBadgeResults('Event Creation', results);
    } catch (error) {
      console.error('Error triggering event creation badges:', error);
    }
  }

  /**
   * Déclenche l'évaluation des badges lors de la création d'un produit
   */
  public async triggerProductCreation(userId: string, productId: string): Promise<void> {
    console.log(`🎖️ Triggering product creation badges for user: ${userId}, product: ${productId}`);
    
    // const eventContext: EventContext = {
    //   type: 'PRODUCT_CREATED',
    //   entityId: productId,
    //   entityType: 'PRODUCT',
    //   timestamp: new Date(),
    //   metadata: { trigger: 'product_creation', productId }
    // };

    try {
      const engine = getBadgeEngine();
      const results = await engine.awardEligibleBadges(userId, 'PRODUCT_CREATED');
      
      this.logBadgeResults('Product Creation', results);
    } catch (error) {
      console.error('Error triggering product creation badges:', error);
    }
  }

  /**
   * Déclenche l'évaluation des badges lors de la création d'un service
   */
  public async triggerServiceCreation(userId: string, serviceId: string): Promise<void> {
    console.log(`🎖️ Triggering service creation badges for user: ${userId}, service: ${serviceId}`);
    
    // const eventContext: EventContext = {
    //   type: 'SERVICE_CREATED',
    //   entityId: serviceId,
    //   entityType: 'SERVICE',
    //   timestamp: new Date(),
    //   metadata: { trigger: 'service_creation', serviceId }
    // };

    try {
      const engine = getBadgeEngine();
      const results = await engine.awardEligibleBadges(userId, 'SERVICE_CREATED');
      
      this.logBadgeResults('Service Creation', results);
    } catch (error) {
      console.error('Error triggering service creation badges:', error);
    }
  }

  /**
   * Vérifie et attribue les badges basés sur le temps (à exécuter périodiquement)
   */
  public async checkTimeBadges(userId?: string): Promise<void> {
    console.log(`🎖️ Checking time-based badges${userId ? ` for user: ${userId}` : ' for all users'}`);
    
    try {
      const engine = getBadgeEngine();
      
      if (userId) {
        // Check for specific user
        const results = await engine.awardEligibleBadges(userId);
        this.logBadgeResults('Time-based Check (User)', results);
      } else {
        // This would be a more complex implementation for all users
        // For now, we'll skip the implementation of checking all users
        console.log('Time-based check for all users not implemented in this version');
      }
    } catch (error) {
      console.error('Error checking time-based badges:', error);
    }
  }

  /**
   * Attribution manuelle d'un badge spécial
   */
  public async awardSpecialBadge(
    userId: string, 
    badgeId: string, 
    reason: string,
    _adminId?: string
  ): Promise<boolean> {
    console.log(`🎖️ Manually awarding special badge: ${badgeId} to user: ${userId}`);
    
    try {
      const engine = getBadgeEngine();
      const result = await engine.awardBadge(userId, badgeId, reason);
      
      if (result.success) {
        console.log(`✅ Successfully awarded badge "${result.badgeTitle}" to user ${userId}`);
        return true;
      } else {
        console.log(`❌ Failed to award badge: ${result.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('Error manually awarding badge:', error);
      return false;
    }
  }

  /**
   * Vérification complète de tous les badges pour un utilisateur
   */
  public async checkAllBadgesForUser(userId: string): Promise<void> {
    console.log(`🎖️ Running complete badge check for user: ${userId}`);
    
    try {
      const engine = getBadgeEngine();
      const results = await engine.awardEligibleBadges(userId);
      
      this.logBadgeResults('Complete Badge Check', results);
    } catch (error) {
      console.error('Error during complete badge check:', error);
    }
  }

  // ============================================================
  //                    UTILITY METHODS
  // ============================================================

  private logBadgeResults(context: string, results: BadgeAwardResult[]): void {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`📊 ${context} - Badges processed:`, {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      awarded: successful.map(r => r.badgeTitle).join(', ') || 'None'
    });

    // Log failed attempts for debugging
    if (failed.length > 0) {
      console.log('❌ Failed badge awards:', failed.map(f => ({
        badge: f.badgeTitle,
        error: f.error,
        alreadyOwned: f.alreadyOwned
      })));
    }
  }
}

// ============================================================
//                    CONVENIENCE FUNCTIONS
// ============================================================

/**
 * Fonction utilitaire pour déclencher les badges lors de l'inscription
 */
export async function triggerUserRegistrationBadges(userId: string): Promise<void> {
  const service = BadgeTriggerService.getInstance();
  await service.triggerUserRegistration(userId);
}

/**
 * Fonction utilitaire pour déclencher les badges lors de la mise à jour du profil
 */
export async function triggerProfileUpdateBadges(userId: string): Promise<void> {
  const service = BadgeTriggerService.getInstance();
  await service.triggerProfileUpdate(userId);
}

/**
 * Fonction utilitaire pour déclencher les badges lors de la création d'une place
 */
export async function triggerPlaceCreationBadges(userId: string, placeId: string): Promise<void> {
  const service = BadgeTriggerService.getInstance();
  await service.triggerPlaceCreation(userId, placeId);
}

/**
 * Fonction utilitaire pour déclencher les badges lors de la création d'un article
 */
export async function triggerPostCreationBadges(userId: string, postId: string): Promise<void> {
  const service = BadgeTriggerService.getInstance();
  await service.triggerPostCreation(userId, postId);
}

/**
 * Fonction utilitaire pour déclencher les badges lors de la publication d'un article
 */
export async function triggerPostPublicationBadges(userId: string, postId: string): Promise<void> {
  const service = BadgeTriggerService.getInstance();
  await service.triggerPostPublication(userId, postId);
}

/**
 * Fonction utilitaire pour déclencher les badges lors de la création d'un avis
 */
export async function triggerReviewCreationBadges(userId: string, reviewId: string): Promise<void> {
  const service = BadgeTriggerService.getInstance();
  await service.triggerReviewCreation(userId, reviewId);
}

/**
 * Fonction utilitaire pour déclencher les badges lors de la création d'un événement
 */
export async function triggerEventCreationBadges(userId: string, eventId: string): Promise<void> {
  const service = BadgeTriggerService.getInstance();
  await service.triggerEventCreation(userId, eventId);
}

/**
 * Fonction utilitaire pour attribuer un badge spécial manuellement
 */
export async function awardSpecialBadge(
  userId: string, 
  badgeId: string, 
  reason: string,
  adminId?: string
): Promise<boolean> {
  const service = BadgeTriggerService.getInstance();
  return service.awardSpecialBadge(userId, badgeId, reason, adminId);
}

/**
 * Fonction utilitaire pour déclencher les badges lors de la création d'un produit
 */
export async function triggerProductCreationBadges(userId: string, productId: string): Promise<void> {
  const service = BadgeTriggerService.getInstance();
  await service.triggerProductCreation(userId, productId);
}

/**
 * Fonction utilitaire pour déclencher les badges lors de la création d'un service
 */
export async function triggerServiceCreationBadges(userId: string, serviceId: string): Promise<void> {
  const service = BadgeTriggerService.getInstance();
  await service.triggerServiceCreation(userId, serviceId);
}

/**
 * Fonction utilitaire pour vérifier tous les badges d'un utilisateur
 */
export async function checkAllUserBadges(userId: string): Promise<void> {
  const service = BadgeTriggerService.getInstance();
  await service.checkAllBadgesForUser(userId);
}

// BadgeTriggerService is already exported above as the class declaration