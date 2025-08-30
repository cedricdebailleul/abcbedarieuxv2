import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type { UserWithRole, ExtendedUser } from "@/types/auth";
import type { Role } from "@/lib/generated/prisma";

/**
 * Récupère l'utilisateur actuel avec son rôle depuis la base de données
 */
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export function hasRole(user: UserWithRole | null, roles: Role | Role[]): boolean {
  if (!user?.role) return false;
  
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

/**
 * Vérifie si l'utilisateur est administrateur ou modérateur
 */
export function isAdminOrModerator(user: UserWithRole | null): boolean {
  return hasRole(user, ["admin", "moderator"]);
}

/**
 * Vérifie si l'utilisateur est administrateur
 */
export function isAdmin(user: UserWithRole | null): boolean {
  return hasRole(user, "admin");
}

/**
 * Vérifie si l'utilisateur est modérateur
 */
export function isModerator(user: UserWithRole | null): boolean {
  return hasRole(user, "moderator");
}

/**
 * Convertit un utilisateur Better Auth en utilisateur étendu avec rôle
 */
export async function extendUser(betterAuthUser: unknown): Promise<ExtendedUser | null> {
  if (!betterAuthUser || typeof betterAuthUser !== 'object' || !('id' in betterAuthUser) || !betterAuthUser.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: (betterAuthUser as { id: string }).id },
    select: { role: true },
  });

  return {
    ...betterAuthUser,
    role: dbUser?.role || "user",
  } as ExtendedUser;
}