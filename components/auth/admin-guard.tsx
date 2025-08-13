"use client";

import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      fallback || (
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
          <div className="mt-4 text-sm text-gray-500">
            Status: {status} | Role: {session?.user?.role || "none"}
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
