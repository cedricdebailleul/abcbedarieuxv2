/**
 * Solution temporaire pour les types Better Auth
 * Ce fichier fournit des utilitaires pour contourner les problèmes de typage
 * en attendant une solution plus permanente
 */

import type { Role } from "@/lib/generated/prisma/client";

// Type assertion pour Better Auth User avec role
export function assertUserWithRole(user: unknown): asserts user is { role: Role } {
  // En runtime, on ne fait rien, c'est juste pour TypeScript
}

// Type guard pour vérifier l'existence du role
export function hasRole(user: unknown): user is { role: Role } {
  return Boolean(user && typeof user === 'object' && 'role' in user);
}

// Fonction utilitaire pour extraire le rôle de manière sûre
export function extractRole(user: unknown): Role | undefined {
  return hasRole(user) ? user.role : undefined;
}

// Extension temporaire du type User pour Better Auth
declare module "better-auth" {
  interface BetterAuthUser {
    role?: Role;
  }
}

// Types étendus pour les composants qui ont besoin du role
export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface SessionWithRole {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  user: UserWithRole;
}