import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type { Role } from "@/lib/generated/prisma/client";

/**
 * Récupère la session actuelle avec le rôle utilisateur depuis la base de données
 */
export async function getSessionWithRole() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user?.id) {
    return null;
  }

  // Récupérer le rôle depuis la base de données
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    session: session.session,
    user: {
      ...session.user,
      role: user.role,
    },
  };
}

/**
 * Vérifie si l'utilisateur actuel a un rôle spécifique
 */
export async function hasUserRole(roles: Role | Role[]): Promise<boolean> {
  const sessionWithRole = await getSessionWithRole();
  
  if (!sessionWithRole?.user?.role) {
    return false;
  }

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(sessionWithRole.user.role);
}

/**
 * Vérifie si l'utilisateur actuel est admin ou modérateur
 */
export async function isUserAdminOrModerator(): Promise<boolean> {
  return await hasUserRole(["admin", "moderator"]);
}

/**
 * Vérifie si l'utilisateur actuel est admin
 */
export async function isUserAdmin(): Promise<boolean> {
  return await hasUserRole("admin");
}

/**
 * Obtient le rôle de l'utilisateur actuel
 */
export async function getCurrentUserRole(): Promise<Role | null> {
  const sessionWithRole = await getSessionWithRole();
  return sessionWithRole?.user?.role ?? null;
}