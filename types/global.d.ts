// Types globaux pour résoudre les problèmes temporaires de Better Auth
import type { Role } from "@/lib/generated/prisma/browser";

declare global {
  namespace BetterAuth {
    interface User {
      role?: Role;
      slug?: string | null;
    }
    
    interface Session {
      user: User & {
        role?: Role;
      };
    }
  }
}

// Extension pour les modules Better Auth
declare module "better-auth" {
  interface User {
    role?: Role;
  }
}

declare module "better-auth/types" {
  interface User {
    role?: Role;
  }
}

export {};