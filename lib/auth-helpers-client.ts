/**
 * Utilitaires d'authentification pour les composants client
 */

import type { Role } from "@/lib/generated/prisma/browser";

/**
 * Type pour session Better Auth étendue avec rôle
 */
export interface BetterAuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Ces propriétés sont ajoutées par notre fonction
  role?: Role;
  slug?: string | null;
}

/**
 * Cast sûr pour les utilisateurs avec rôle (solution temporaire pour le typage)
 * Usage: const user = safeUserCast(session.user); puis user.role
 */
export function safeUserCast(user: unknown): BetterAuthUser & { role: "user" | "admin" | "moderator" | "dpo" | "editor" } {
  return user as BetterAuthUser & { role: "user" | "admin" | "moderator" | "dpo" | "editor" };
}

/**
 * Cast sûr pour les sessions avec utilisateur ayant un rôle
 */
export function safeSessionCast(session: unknown): { user: BetterAuthUser & { role: Role } } {
  return session as { user: BetterAuthUser & { role: Role } };
}

/**
 * Type guard pour vérifier si un utilisateur a un rôle spécifique
 */
export function hasRoleGuard(user: BetterAuthUser, roles: Role | Role[]): boolean {
  if (!user.role) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

/**
 * Type guard pour admin/moderator
 */
export function isAdminOrModeratorGuard(user: BetterAuthUser): boolean {
  return hasRoleGuard(user, ["admin", "moderator"]);
}