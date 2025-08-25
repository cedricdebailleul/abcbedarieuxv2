// ============================================================
//                    LEGACY BADGE SYSTEM
//                    (DEPRECATED - USE NEW ENGINE)
// ============================================================

import { BadgeTriggerService } from "@/lib/services/badge-trigger-service";

// Keep for backward compatibility but redirect to new system
export interface BadgeAward {
  userId: string;
  badgeTitle: string;
  reason: string;
}

/**
 * @deprecated Use BadgeTriggerService and ModernBadgeEngine instead
 * This class is kept for backward compatibility only
 */
export class BadgeSystem {
  // Legacy cache - kept for compatibility
  private static badgeCache: Record<string, unknown> = {};

  /**
   * @deprecated Use triggerUserRegistrationBadges() instead
   */
  static async onUserRegistration(userId: string) {
    console.warn(
      "BadgeSystem.onUserRegistration is deprecated. Use triggerUserRegistrationBadges() instead."
    );
    const service = BadgeTriggerService.getInstance();
    await service.triggerUserRegistration(userId);
  }

  /**
   * @deprecated Use triggerProfileUpdateBadges() instead
   */
  static async onProfileUpdate(userId: string) {
    console.warn(
      "BadgeSystem.onProfileUpdate is deprecated. Use triggerProfileUpdateBadges() instead."
    );
    const service = BadgeTriggerService.getInstance();
    await service.triggerProfileUpdate(userId);
  }

  /**
   * @deprecated Use triggerPlaceCreationBadges() instead
   */
  static async onPlaceCreated(userId: string, placeId?: string) {
    console.warn(
      "BadgeSystem.onPlaceCreated is deprecated. Use triggerPlaceCreationBadges() instead."
    );
    const service = BadgeTriggerService.getInstance();
    await service.triggerPlaceCreation(userId, placeId || "unknown");
  }

  /**
   * @deprecated Use triggerReviewCreationBadges() instead
   */
  static async onReviewCreated(userId: string, reviewId?: string) {
    console.warn(
      "BadgeSystem.onReviewCreated is deprecated. Use triggerReviewCreationBadges() instead."
    );
    const service = BadgeTriggerService.getInstance();
    await service.triggerReviewCreation(userId, reviewId || "unknown");
  }

  /**
   * @deprecated Use triggerPostCreationBadges() instead
   */
  static async onPostCreated(userId: string, postId?: string) {
    console.warn(
      "BadgeSystem.onPostCreated is deprecated. Use triggerPostCreationBadges() instead."
    );
    const service = BadgeTriggerService.getInstance();
    await service.triggerPostCreation(userId, postId || "unknown");

    // Return empty array to maintain compatibility
    return [];
  }

  /**
   * @deprecated Use BadgeTriggerService.checkTimeBadges() instead
   */
  static async checkTimeBadges(userId?: string) {
    console.warn(
      "BadgeSystem.checkTimeBadges is deprecated. Use BadgeTriggerService.checkTimeBadges() instead."
    );
    const service = BadgeTriggerService.getInstance();
    await service.checkTimeBadges(userId);
  }

  /**
   * @deprecated Use awardSpecialBadge() from BadgeTriggerService instead
   */
  static async awardBedarieuxNative(
    userId: string,
    reason = "Résident authentique de Bédarieux"
  ) {
    console.warn(
      "BadgeSystem.awardBedarieuxNative is deprecated. Use awardSpecialBadge() instead."
    );
    const service = BadgeTriggerService.getInstance();
    return service.awardSpecialBadge(userId, "bedarieux_native", reason);
  }

  /**
   * @deprecated Use checkAllUserBadges() from BadgeTriggerService instead
   */
  static async checkAllBadgesForUser(userId: string) {
    console.warn(
      "BadgeSystem.checkAllBadgesForUser is deprecated. Use checkAllUserBadges() instead."
    );
    const service = BadgeTriggerService.getInstance();
    await service.checkAllBadgesForUser(userId);
  }

  /**
   * @deprecated This method is no longer needed with the new system
   */
  static async getBadgeStats() {
    console.warn(
      "BadgeSystem.getBadgeStats is deprecated. Use badge actions instead."
    );
    return [];
  }

  /**
   * @deprecated This method is no longer needed with the new system
   */
  static clearCache() {
    console.warn(
      "BadgeSystem.clearCache is deprecated and has no effect in the new system."
    );
    BadgeSystem.badgeCache = {};
  }
}

// Re-export modern functions for easy migration
export {
  triggerUserRegistrationBadges,
  triggerProfileUpdateBadges,
  triggerPlaceCreationBadges,
  triggerPostCreationBadges,
  triggerReviewCreationBadges,
  awardSpecialBadge,
  checkAllUserBadges,
} from "@/lib/services/badge-trigger-service";

// BadgeAward interface is exported above
