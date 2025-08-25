import { BadgeCategory, BadgeRarity } from "@/lib/generated/prisma";

// ============================================================
//                    TYPES BADGE ENGINE
// ============================================================

// Configuration d'un badge
export interface BadgeConfiguration {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly iconUrl: string;
  readonly color: string;
  readonly category: BadgeCategory;
  readonly rarity: BadgeRarity;
  readonly isAutomatic: boolean;
  readonly conditions?: BadgeCondition[];
}

// Conditions pour l'attribution automatique
export interface BadgeCondition {
  readonly type: ConditionType;
  readonly field: string;
  readonly operator: ConditionOperator;
  readonly value: number | string | boolean | Date;
  readonly timeframe?: Timeframe;
}

// Types de conditions
export type ConditionType = 
  | 'COUNT'           // Compter des éléments
  | 'FIELD_VALUE'     // Valeur d'un champ
  | 'TIME_BASED'      // Basé sur le temps
  | 'COMPLEX';        // Logique complexe

// Opérateurs de comparaison
export type ConditionOperator = 
  | 'EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_EQUAL'
  | 'LESS_THAN'
  | 'LESS_EQUAL'
  | 'CONTAINS'
  | 'BETWEEN';

// Plages temporelles
export interface Timeframe {
  readonly unit: 'DAYS' | 'MONTHS' | 'YEARS';
  readonly value: number;
  readonly reference: 'CREATION' | 'NOW';
}

// Données de contexte pour l'évaluation
export interface BadgeContext {
  readonly userId: string;
  readonly user: UserContextData;
  readonly metrics: UserMetrics;
  readonly event?: EventContext;
}

// Données utilisateur pour le contexte
export interface UserContextData {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly createdAt: Date;
  readonly role: string;
  readonly profile?: UserProfileData;
}

// Données de profil utilisateur
export interface UserProfileData {
  readonly bio: string | null;
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly isPublic: boolean;
  readonly socials: Record<string, string> | null;
}

// Métriques utilisateur
export interface UserMetrics {
  readonly places: {
    readonly total: number;
    readonly active: number;
    readonly pending: number;
  };
  readonly posts: {
    readonly total: number;
    readonly published: number;
    readonly draft: number;
  };
  readonly reviews: {
    readonly total: number;
    readonly averageRating: number;
  };
  readonly events: {
    readonly total: number;
    readonly upcoming: number;
  };
  readonly products: {
    readonly total: number;
    readonly active: number;
  };
  readonly services: {
    readonly total: number;
    readonly active: number;
  };
}

// Contexte d'événement
export interface EventContext {
  readonly type: EventType;
  readonly entityId: string;
  readonly entityType: EntityType;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp: Date;
}

// Types d'événements
export type EventType =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'PROFILE_COMPLETED'
  | 'PLACE_CREATED'
  | 'PLACE_APPROVED'
  | 'POST_CREATED'
  | 'POST_PUBLISHED'
  | 'REVIEW_CREATED'
  | 'EVENT_CREATED'
  | 'PRODUCT_CREATED'
  | 'SERVICE_CREATED'
  | 'LOGIN_STREAK'
  | 'SPECIAL_ACTION';

// Types d'entités
export type EntityType =
  | 'USER'
  | 'PLACE'
  | 'POST'
  | 'REVIEW'
  | 'EVENT'
  | 'PRODUCT'
  | 'SERVICE';

// Résultat d'évaluation
export interface BadgeEvaluationResult {
  readonly badgeId: string;
  readonly shouldAward: boolean;
  readonly reason: string;
  readonly metadata?: Record<string, unknown>;
}

// Résultat d'attribution
export interface BadgeAwardResult {
  readonly success: boolean;
  readonly badgeId: string;
  readonly badgeTitle: string;
  readonly reason: string;
  readonly alreadyOwned: boolean;
  readonly error?: string;
}

// Engine de badges
export interface BadgeEngine {
  // Évaluation des badges
  evaluateBadge(badgeId: string, context: BadgeContext): Promise<BadgeEvaluationResult>;
  evaluateAllBadges(context: BadgeContext): Promise<BadgeEvaluationResult[]>;
  
  // Attribution des badges
  awardBadge(userId: string, badgeId: string, reason: string): Promise<BadgeAwardResult>;
  awardEligibleBadges(userId: string, eventType?: EventType): Promise<BadgeAwardResult[]>;
  
  // Gestion du contexte
  buildContext(userId: string, event?: EventContext): Promise<BadgeContext>;
  
  // Configuration
  registerBadge(config: BadgeConfiguration): void;
  getBadgeConfiguration(badgeId: string): BadgeConfiguration | null;
  getAllConfigurations(): BadgeConfiguration[];
}

// Stratégie d'évaluation
export interface BadgeEvaluationStrategy {
  readonly type: ConditionType;
  evaluate(condition: BadgeCondition, context: BadgeContext): Promise<boolean>;
}

// ============================================================
//                    BADGES PREDEFINIES
// ============================================================

// Configuration des badges par catégorie
export interface BadgeRegistry {
  readonly [BadgeCategory.GENERAL]: BadgeConfiguration[];
  readonly [BadgeCategory.ACHIEVEMENT]: BadgeConfiguration[];
  readonly [BadgeCategory.PARTICIPATION]: BadgeConfiguration[];
  readonly [BadgeCategory.SPECIAL]: BadgeConfiguration[];
  readonly [BadgeCategory.ANNIVERSARY]: BadgeConfiguration[];
}

// Events déclencheurs par badge
export interface BadgeTriggers {
  readonly [key: string]: EventType[];
}