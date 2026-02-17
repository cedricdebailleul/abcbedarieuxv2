import { z } from "zod";
import { Role } from "@/lib/generated/prisma/browser";

// Schéma Zod pour l'utilisateur avec rôle
export const UserWithRoleSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  name: z.string(),
  image: z.string().nullable().optional(),
  role: z.nativeEnum(Role).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserWithRole = z.infer<typeof UserWithRoleSchema>;

// Schéma pour la session avec utilisateur ayant un rôle
export const SessionWithUserSchema = z.object({
  session: z.object({
    id: z.string(),
    userId: z.string(),
    expiresAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
    token: z.string(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
  }),
  user: UserWithRoleSchema,
});

export type SessionWithUser = z.infer<typeof SessionWithUserSchema>;

// Type pour Better Auth avec extension
export interface ExtendedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  role?: Role;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les sessions étendues
export interface SessionLike {
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
    role?: string | null;
  };
}