"use client";

import { authClient } from "@/lib/auth-client";

export function usePermissions() {
  const { data: session } = authClient.useSession();
  
  const isAdmin = session?.user?.role === "admin";
  const isModerator = session?.user?.role === "moderator";
  const isEditor = session?.user?.role === "editor";
  const isUser = session?.user?.role === "user";
  
  const canManageUsers = isAdmin || isModerator || isEditor;
  const canManageContent = isAdmin || isEditor;
  const canModerate = isAdmin || isModerator;
  
  return {
    user: session?.user,
    isAdmin,
    isModerator,
    isEditor,
    isUser,
    canManageUsers,
    canManageContent,
    canModerate,
    hasRole: (roles: string[]) => !!session?.user?.role && roles.includes(session.user.role),
  };
}