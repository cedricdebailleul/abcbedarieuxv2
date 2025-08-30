/**
 * Utilitaires d'authentification pour les composants serveur uniquement
 * Pour les composants client, utiliser auth-helpers-client.ts
 */

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/generated/prisma";

// Réexporter les types et utilitaires client pour compatibilité
export type { BetterAuthUser } from "@/lib/auth-helpers-client";
export { safeUserCast, safeSessionCast, hasRoleGuard, isAdminOrModeratorGuard } from "@/lib/auth-helpers-client";

/**
 * Cast sûr d'un utilisateur Better Auth en utilisateur avec rôle
 * Cette fonction étend l'utilisateur avec les données de la base
 */
export async function extendUserWithRole(betterAuthUser: unknown): Promise<import("@/lib/auth-helpers-client").BetterAuthUser> {
  if (!betterAuthUser || typeof betterAuthUser !== 'object' || !('id' in betterAuthUser)) {
    throw new Error("Utilisateur invalide");
  }
  
  const user = betterAuthUser as { id: string };

  // Récupérer les données complémentaires depuis la base
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, slug: true },
  });

  return {
    ...betterAuthUser,
    role: dbUser?.role || "user",
    slug: dbUser?.slug || null,
  } as import("@/lib/auth-helpers-client").BetterAuthUser;
}

/**
 * Récupère la session actuelle avec utilisateur étendu
 */
export async function getSessionWithExtendedUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return null;
  }

  const extendedUser = await extendUserWithRole(session.user);
  
  return {
    session: session.session,
    user: extendedUser,
  };
}

/**
 * Fonction utilitaire pour accéder au rôle de manière sûre
 * Usage: getUserRole(session?.user) au lieu de session.user.role
 */
export async function getUserRole(betterAuthUser: unknown): Promise<Role | null> {
  if (!betterAuthUser || typeof betterAuthUser !== 'object' || !('id' in betterAuthUser)) {
    return null;
  }
  
  const user = betterAuthUser as { id: string };
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  
  return dbUser?.role || null;
}