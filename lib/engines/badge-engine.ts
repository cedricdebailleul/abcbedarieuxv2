import { prisma } from "@/lib/prisma";
import { BadgeCategory, BadgeRarity } from "@/lib/generated/prisma";
import {
  BadgeConfiguration,
  BadgeContext,
  BadgeEngine,
  BadgeEvaluationResult,
  BadgeAwardResult,
  EventContext,
  EventType,
  UserContextData,
  UserMetrics,
  UserProfileData,
  BadgeEvaluationStrategy,
  BadgeCondition,
  ConditionType,
} from "@/lib/types/badge-engine";

// ============================================================
//                    BADGE ENGINE IMPLEMENTATION
// ============================================================

export class ModernBadgeEngine implements BadgeEngine {
  private configurations: Map<string, BadgeConfiguration> = new Map();
  private strategies: Map<ConditionType, BadgeEvaluationStrategy> = new Map();
  private cache: Map<string, BadgeContext> = new Map();

  constructor() {
    this.initializeStrategies();
    this.loadBadgeConfigurations();
  }

  // ============================================================
  //                    STRATEGIES INITIALIZATION
  // ============================================================

  private initializeStrategies(): void {
    this.strategies.set("COUNT", new CountEvaluationStrategy());
    this.strategies.set("FIELD_VALUE", new FieldValueEvaluationStrategy());
    this.strategies.set("TIME_BASED", new TimeBasedEvaluationStrategy());
    this.strategies.set("COMPLEX", new ComplexEvaluationStrategy());
  }

  // ============================================================
  //                    BADGE CONFIGURATIONS
  // ============================================================

  private loadBadgeConfigurations(): void {
    const configs = getBadgeConfigurations();
    configs.forEach((config) => {
      this.configurations.set(config.id, config);
    });
  }

  public registerBadge(config: BadgeConfiguration): void {
    this.configurations.set(config.id, config);
  }

  public getBadgeConfiguration(badgeId: string): BadgeConfiguration | null {
    return this.configurations.get(badgeId) || null;
  }

  public getAllConfigurations(): BadgeConfiguration[] {
    return Array.from(this.configurations.values());
  }

  // ============================================================
  //                    CONTEXT BUILDING
  // ============================================================

  public async buildContext(
    userId: string,
    event?: EventContext
  ): Promise<BadgeContext> {
    const cacheKey = `${userId}-${event?.type || "default"}`;

    // Use cache if recent
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    const user = await this.getUserData(userId);
    const metrics = await this.getUserMetrics(userId);

    const context: BadgeContext = {
      userId,
      user,
      metrics,
      event,
    };

    // Cache for 5 minutes
    this.cache.set(cacheKey, context);
    setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

    return context;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private isCacheValid(_context: BadgeContext): boolean {
    // Simple cache validation - could be enhanced
    // The context parameter is reserved for future cache validation logic
    return true;
  }

  private async getUserData(userId: string): Promise<UserContextData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const profile: UserProfileData | undefined = user.profile
      ? {
          bio: user.profile.bio,
          firstname: user.profile.firstname,
          lastname: user.profile.lastname,
          isPublic: user.profile.isPublic,
          socials: this.parseSocials(user.profile.socials),
        }
      : undefined;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      role: user.role,
      profile,
    };
  }

  private parseSocials(socials: unknown): Record<string, string> | null {
    if (!socials) return null;
    try {
      if (typeof socials === "string") {
        return JSON.parse(socials);
      }
      return socials as Record<string, string>;
    } catch {
      return null;
    }
  }

  private async getUserMetrics(userId: string): Promise<UserMetrics> {
    const [
      placesData,
      postsData,
      reviewsData,
      eventsData,
      productsData,
      servicesData,
    ] = await Promise.all([
      prisma.place.aggregate({
        where: { ownerId: userId },
        _count: { id: true },
      }),
      prisma.post.aggregate({
        where: { authorId: userId },
        _count: { id: true },
      }),
      prisma.review.aggregate({
        where: { userId },
        _count: { id: true },
        _avg: { rating: true },
      }),
      prisma.event.aggregate({
        where: { organizerId: userId },
        _count: { id: true },
      }),
      prisma.product.aggregate({
        where: { place: { ownerId: userId } },
        _count: { id: true },
      }),
      prisma.service.aggregate({
        where: { place: { ownerId: userId } },
        _count: { id: true },
      }),
    ]);

    return {
      places: {
        total: placesData._count?.id || 0,
        active: placesData._count?.id || 0, // Simplification - could be enhanced
        pending: 0,
      },
      posts: {
        total: postsData._count?.id || 0,
        published: postsData._count?.id || 0,
        draft: 0,
      },
      reviews: {
        total: reviewsData._count?.id || 0,
        averageRating: reviewsData._avg?.rating || 0,
      },
      events: {
        total: eventsData._count?.id || 0,
        upcoming: eventsData._count?.id || 0,
      },
      products: {
        total: productsData._count?.id || 0,
        active: productsData._count?.id || 0,
      },
      services: {
        total: servicesData._count?.id || 0,
        active: servicesData._count?.id || 0,
      },
    };
  }

  // ============================================================
  //                    BADGE EVALUATION
  // ============================================================

  public async evaluateBadge(
    badgeId: string,
    context: BadgeContext
  ): Promise<BadgeEvaluationResult> {
    const config = this.getBadgeConfiguration(badgeId);
    if (!config) {
      return {
        badgeId,
        shouldAward: false,
        reason: "Badge configuration not found",
      };
    }

    if (!config.isAutomatic || !config.conditions) {
      return {
        badgeId,
        shouldAward: false,
        reason: "Badge is not automatic or has no conditions",
      };
    }

    // Check if user already has this badge
    const hasAlready = await this.userHasBadge(context.userId, badgeId);
    if (hasAlready) {
      return {
        badgeId,
        shouldAward: false,
        reason: "User already has this badge",
      };
    }

    // Evaluate all conditions
    const conditionResults = await Promise.all(
      config.conditions.map((condition) =>
        this.evaluateCondition(condition, context)
      )
    );

    const allConditionsMet = conditionResults.every((result) => result);

    return {
      badgeId,
      shouldAward: allConditionsMet,
      reason: allConditionsMet
        ? "All conditions met"
        : "Some conditions not met",
    };
  }

  public async evaluateAllBadges(
    context: BadgeContext
  ): Promise<BadgeEvaluationResult[]> {
    const configs = this.getAllConfigurations();

    return Promise.all(
      configs.map((config) => this.evaluateBadge(config.id, context))
    );
  }

  private async evaluateCondition(
    condition: BadgeCondition,
    context: BadgeContext
  ): Promise<boolean> {
    const strategy = this.strategies.get(condition.type);
    if (!strategy) {
      console.warn(`No strategy found for condition type: ${condition.type}`);
      return false;
    }

    return strategy.evaluate(condition, context);
  }

  private async userHasBadge(
    userId: string,
    badgeId: string
  ): Promise<boolean> {
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        },
      },
    });
    return Boolean(userBadge);
  }

  // ============================================================
  //                    BADGE AWARDING
  // ============================================================

  public async awardBadge(
    userId: string,
    badgeId: string,
    reason: string
  ): Promise<BadgeAwardResult> {
    try {
      // Check if badge exists in database
      const badge = await prisma.badge.findUnique({
        where: { id: badgeId },
        select: { id: true, title: true, isActive: true },
      });

      if (!badge) {
        return {
          success: false,
          badgeId,
          badgeTitle: "Unknown",
          reason,
          alreadyOwned: false,
          error: "Badge not found in database",
        };
      }

      if (!badge.isActive) {
        return {
          success: false,
          badgeId,
          badgeTitle: badge.title,
          reason,
          alreadyOwned: false,
          error: "Badge is not active",
        };
      }

      // Check if already owned
      const alreadyOwned = await this.userHasBadge(userId, badgeId);
      if (alreadyOwned) {
        return {
          success: false,
          badgeId,
          badgeTitle: badge.title,
          reason,
          alreadyOwned: true,
          error: "User already owns this badge",
        };
      }

      // Award the badge
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId,
          reason,
          isVisible: true,
        },
      });

      console.log(
        `🎖️ Badge "${badge.title}" awarded to user ${userId} - Reason: ${reason}`
      );

      return {
        success: true,
        badgeId,
        badgeTitle: badge.title,
        reason,
        alreadyOwned: false,
      };
    } catch (error) {
      console.error(
        `Error awarding badge ${badgeId} to user ${userId}:`,
        error
      );

      return {
        success: false,
        badgeId,
        badgeTitle: "Unknown",
        reason,
        alreadyOwned: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public async awardEligibleBadges(
    userId: string,
    eventType?: EventType
  ): Promise<BadgeAwardResult[]> {
    const context = await this.buildContext(userId);

    // Filter badges by event type if provided
    let badgesToEvaluate = this.getAllConfigurations();
    if (eventType) {
      badgesToEvaluate = badgesToEvaluate.filter((config) =>
        this.badgeTriggerHasEvent(config.id, eventType)
      );
    }

    const evaluations = await Promise.all(
      badgesToEvaluate.map((config) => this.evaluateBadge(config.id, context))
    );

    const eligibleBadges = evaluations.filter(
      (evaluation) => evaluation.shouldAward
    );

    return Promise.all(
      eligibleBadges.map((evaluation) =>
        this.awardBadge(userId, evaluation.badgeId, evaluation.reason)
      )
    );
  }

  private badgeTriggerHasEvent(badgeId: string, eventType: EventType): boolean {
    const triggers = getBadgeTriggers();
    const badgeTriggers = triggers[badgeId];
    return badgeTriggers ? badgeTriggers.includes(eventType) : true;
  }
}

// ============================================================
//                    EVALUATION STRATEGIES
// ============================================================

class CountEvaluationStrategy implements BadgeEvaluationStrategy {
  readonly type: ConditionType = "COUNT";

  async evaluate(
    condition: BadgeCondition,
    context: BadgeContext
  ): Promise<boolean> {
    const value = this.getMetricValue(condition.field, context);
    const targetValue = condition.value as number;

    switch (condition.operator) {
      case "EQUALS":
        return value === targetValue;
      case "GREATER_THAN":
        return value > targetValue;
      case "GREATER_EQUAL":
        return value >= targetValue;
      case "LESS_THAN":
        return value < targetValue;
      case "LESS_EQUAL":
        return value <= targetValue;
      default:
        return false;
    }
  }

  private getMetricValue(field: string, context: BadgeContext): number {
    const parts = field.split(".");
    let value: unknown = context.metrics;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return 0;
      }
    }

    return typeof value === "number" ? value : 0;
  }
}

class FieldValueEvaluationStrategy implements BadgeEvaluationStrategy {
  readonly type: ConditionType = "FIELD_VALUE";

  async evaluate(
    condition: BadgeCondition,
    context: BadgeContext
  ): Promise<boolean> {
    const value = this.getFieldValue(condition.field, context);
    const targetValue = condition.value;

    switch (condition.operator) {
      case "EQUALS":
        return value === targetValue;
      case "CONTAINS":
        return typeof value === "string" && typeof targetValue === "string"
          ? value.includes(targetValue)
          : false;
      default:
        return false;
    }
  }

  private getFieldValue(field: string, context: BadgeContext): unknown {
    const parts = field.split(".");
    let value: unknown = context;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return null;
      }
    }

    return value;
  }
}

class TimeBasedEvaluationStrategy implements BadgeEvaluationStrategy {
  readonly type: ConditionType = "TIME_BASED";

  async evaluate(
    condition: BadgeCondition,
    context: BadgeContext
  ): Promise<boolean> {
    if (!condition.timeframe) return false;

    const now = new Date();
    const referenceDate =
      condition.timeframe.reference === "CREATION"
        ? context.user.createdAt
        : now;

    const timeDiff = now.getTime() - referenceDate.getTime();
    const targetTime = this.getTimeInMilliseconds(
      condition.timeframe.unit,
      condition.timeframe.value
    );

    switch (condition.operator) {
      case "GREATER_THAN":
        return timeDiff > targetTime;
      case "GREATER_EQUAL":
        return timeDiff >= targetTime;
      default:
        return false;
    }
  }

  private getTimeInMilliseconds(unit: string, value: number): number {
    const multipliers = {
      DAYS: 24 * 60 * 60 * 1000,
      MONTHS: 30 * 24 * 60 * 60 * 1000,
      YEARS: 365 * 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit as keyof typeof multipliers] || 0);
  }
}

class ComplexEvaluationStrategy implements BadgeEvaluationStrategy {
  readonly type: ConditionType = "COMPLEX";

  async evaluate(
    condition: BadgeCondition,
    context: BadgeContext
  ): Promise<boolean> {
    // Complex logic implementation
    // This is where we can add sophisticated badge logic
    return this.evaluateComplexCondition(condition, context);
  }

  private async evaluateComplexCondition(
    condition: BadgeCondition,
    context: BadgeContext
  ): Promise<boolean> {
    // Example of complex logic for profile completion
    if (condition.field === "profile.complete") {
      const profile = context.user.profile;
      if (!profile) return false;

      const requiredFields = ["bio", "firstname", "lastname"];
      const completedFields = requiredFields.filter((field) => {
        const value = profile[field as keyof UserProfileData];
        return value && value.toString().trim().length > 0;
      });

      const isPublic = profile.isPublic === true;
      const hasSocials = Boolean(
        profile.socials && Object.keys(profile.socials).length > 0
      );

      // Different completion levels
      const completionLevel = condition.value as string;
      switch (completionLevel) {
        case "basic":
          return completedFields.length >= 2;
        case "complete":
          return completedFields.length === requiredFields.length;
        case "ambassador":
          return (
            completedFields.length === requiredFields.length &&
            isPublic &&
            hasSocials
          );
        default:
          return false;
      }
    }

    return false;
  }
}

// ============================================================
//                    BADGE CONFIGURATIONS
// ============================================================

function getBadgeConfigurations(): BadgeConfiguration[] {
  return [
    // BEGINNER BADGES
    {
      id: "welcome",
      title: "Bienvenue !",
      description: "Premier pas sur ABC Bédarieux",
      iconUrl: "👋",
      color: "#22c55e",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.COMMON,
      isAutomatic: true,
      conditions: [
        {
          type: "FIELD_VALUE",
          field: "user.id",
          operator: "EQUALS",
          value: true, // Always true for new users
        },
      ],
    },
    {
      id: "first_place",
      title: "Premier lieu",
      description: "Première place ajoutée sur la plateforme",
      iconUrl: "🏪",
      color: "#3b82f6",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.COMMON,
      isAutomatic: true,
      conditions: [
        {
          type: "COUNT",
          field: "places.total",
          operator: "GREATER_EQUAL",
          value: 1,
        },
      ],
    },
    {
      id: "profile_complete",
      title: "Profil complété",
      description: "Profil utilisateur entièrement renseigné",
      iconUrl: "✅",
      color: "#10b981",
      category: BadgeCategory.GENERAL,
      rarity: BadgeRarity.COMMON,
      isAutomatic: true,
      conditions: [
        {
          type: "COMPLEX",
          field: "profile.complete",
          operator: "EQUALS",
          value: "complete",
        },
      ],
    },

    // CONTRIBUTOR BADGES
    {
      id: "explorer",
      title: "Explorateur",
      description: "A ajouté 3 lieux sur la plateforme",
      iconUrl: "🗺️",
      color: "#8b5cf6",
      category: BadgeCategory.ACHIEVEMENT,
      rarity: BadgeRarity.UNCOMMON,
      isAutomatic: true,
      conditions: [
        {
          type: "COUNT",
          field: "places.total",
          operator: "GREATER_EQUAL",
          value: 3,
        },
      ],
    },
    {
      id: "active_contributor",
      title: "Contributeur actif",
      description: "A ajouté 5 lieux sur la plateforme",
      iconUrl: "⭐",
      color: "#f59e0b",
      category: BadgeCategory.ACHIEVEMENT,
      rarity: BadgeRarity.RARE,
      isAutomatic: true,
      conditions: [
        {
          type: "COUNT",
          field: "places.total",
          operator: "GREATER_EQUAL",
          value: 5,
        },
      ],
    },
    {
      id: "regular_author",
      title: "Auteur régulier",
      description: "A publié 5 articles",
      iconUrl: "✍️",
      color: "#ef4444",
      category: BadgeCategory.ACHIEVEMENT,
      rarity: BadgeRarity.UNCOMMON,
      isAutomatic: true,
      conditions: [
        {
          type: "COUNT",
          field: "posts.total",
          operator: "GREATER_EQUAL",
          value: 5,
        },
      ],
    },

    // EXPERT BADGES
    {
      id: "prolific_writer",
      title: "Rédacteur prolifique",
      description: "A publié 10 articles",
      iconUrl: "📝",
      color: "#dc2626",
      category: BadgeCategory.PARTICIPATION,
      rarity: BadgeRarity.RARE,
      isAutomatic: true,
      conditions: [
        {
          type: "COUNT",
          field: "posts.total",
          operator: "GREATER_EQUAL",
          value: 10,
        },
      ],
    },
    {
      id: "master_writer",
      title: "Maître écrivain",
      description: "A publié 25 articles",
      iconUrl: "🖋️",
      color: "#7c2d12",
      category: BadgeCategory.PARTICIPATION,
      rarity: BadgeRarity.EPIC,
      isAutomatic: true,
      conditions: [
        {
          type: "COUNT",
          field: "posts.total",
          operator: "GREATER_EQUAL",
          value: 25,
        },
      ],
    },

    // COMMUNITY BADGES
    {
      id: "ambassador",
      title: "Ambassadeur",
      description: "Profil public avec réseaux sociaux",
      iconUrl: "🌟",
      color: "#7c3aed",
      category: BadgeCategory.SPECIAL,
      rarity: BadgeRarity.RARE,
      isAutomatic: true,
      conditions: [
        {
          type: "COMPLEX",
          field: "profile.complete",
          operator: "EQUALS",
          value: "ambassador",
        },
      ],
    },
    {
      id: "faithful_member",
      title: "Membre fidèle",
      description: "Membre depuis plus de 3 mois",
      iconUrl: "🏆",
      color: "#0891b2",
      category: BadgeCategory.SPECIAL,
      rarity: BadgeRarity.UNCOMMON,
      isAutomatic: true,
      conditions: [
        {
          type: "TIME_BASED",
          field: "user.createdAt",
          operator: "GREATER_THAN",
          value: 90,
          timeframe: {
            unit: "DAYS",
            value: 90,
            reference: "CREATION",
          },
        },
      ],
    },
    {
      id: "veteran",
      title: "Vétéran",
      description: "Membre depuis plus d'un an",
      iconUrl: "🎖️",
      color: "#b45309",
      category: BadgeCategory.SPECIAL,
      rarity: BadgeRarity.EPIC,
      isAutomatic: true,
      conditions: [
        {
          type: "TIME_BASED",
          field: "user.createdAt",
          operator: "GREATER_THAN",
          value: 365,
          timeframe: {
            unit: "DAYS",
            value: 365,
            reference: "CREATION",
          },
        },
      ],
    },

    // SPECIAL BADGES (Manual only)
    {
      id: "bedarieux_native",
      title: "Bédarieux native",
      description: "Résident authentique de Bédarieux",
      iconUrl: "🏰",
      color: "#dc2626",
      category: BadgeCategory.SPECIAL,
      rarity: BadgeRarity.LEGENDARY,
      isAutomatic: false,
    },
    {
      id: "pioneer",
      title: "Pionnier",
      description: "Parmi les 100 premiers membres",
      iconUrl: "🚀",
      color: "#7c2d12",
      category: BadgeCategory.SPECIAL,
      rarity: BadgeRarity.LEGENDARY,
      isAutomatic: false,
    },
  ];
}

function getBadgeTriggers(): Record<string, EventType[]> {
  return {
    welcome: ["USER_CREATED"],
    first_place: ["PLACE_CREATED"],
    profile_complete: ["USER_UPDATED", "PROFILE_COMPLETED"],
    explorer: ["PLACE_CREATED"],
    active_contributor: ["PLACE_CREATED"],
    regular_author: ["POST_CREATED", "POST_PUBLISHED"],
    prolific_writer: ["POST_CREATED", "POST_PUBLISHED"],
    master_writer: ["POST_CREATED", "POST_PUBLISHED"],
    ambassador: ["USER_UPDATED", "PROFILE_COMPLETED"],
    faithful_member: [], // Time-based, no specific trigger
    veteran: [], // Time-based, no specific trigger
  };
}

// Singleton instance
let engineInstance: ModernBadgeEngine | null = null;

export function getBadgeEngine(): ModernBadgeEngine {
  if (!engineInstance) {
    engineInstance = new ModernBadgeEngine();
  }
  return engineInstance;
}

// ModernBadgeEngine is already exported above
