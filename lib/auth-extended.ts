import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/generated/prisma/client";

export interface ExtendedSession {
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
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Récupère la session actuelle avec le rôle utilisateur étendu
 */
export async function getExtendedSession(): Promise<ExtendedSession | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user?.id) {
    return null;
  }

  // Récupérer le rôle et autres données depuis la base de données
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

  if (!user) {
    return null;
  }

  return {
    session: session.session,
    user: user,
  };
}

/**
 * Vérifie si l'utilisateur actuel a des permissions admin/modérateur
 */
export async function requireAdminOrModerator(): Promise<ExtendedSession> {
  const session = await getExtendedSession();
  
  if (!session) {
    throw new Error("Non authentifié");
  }

  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    throw new Error("Permissions insuffisantes");
  }

  return session;
}

/**
 * Vérifie si l'utilisateur actuel a des permissions admin
 */
export async function requireAdmin(): Promise<ExtendedSession> {
  const session = await getExtendedSession();
  
  if (!session) {
    throw new Error("Non authentifié");
  }

  if (session.user.role !== "admin") {
    throw new Error("Permissions administrateur requises");
  }

  return session;
}

/**
 * Vérifie si l'utilisateur a un rôle admin ou modérateur (simple check)
 */
export async function checkIsAdminOrModerator(): Promise<boolean> {
  try {
    await requireAdminOrModerator();
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifie si l'utilisateur a un rôle admin (simple check)
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export function hasRole(user: { role: Role }, roles: Role | Role[]): boolean {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

/**
 * Vérifie si l'utilisateur est admin ou modérateur
 */
export function isAdminOrModerator(user: { role: Role }): boolean {
  return hasRole(user, ["admin", "moderator"]);
}