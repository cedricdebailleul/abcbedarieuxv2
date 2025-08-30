import type { Role } from "@/lib/generated/prisma";

declare module "better-auth/types" {
  interface User {
    role: Role;
  }

  interface Session {
    user: User & {
      role: Role;
    };
  }
}

// Extension pour les types Better Auth utilisés dans l'app
export interface ExtendedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

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
  user: ExtendedUser;
}