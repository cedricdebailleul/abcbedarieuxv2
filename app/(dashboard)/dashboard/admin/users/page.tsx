import { Plus, Users } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import InviteUserDialog from "./_components/invite-user-dialog";
import UsersStats from "./_components/users-stats";
import UsersTable from "./_components/users-table";

export default async function AdminUsersPage() {
  // Vérifier les permissions d'administration - la session est garantie par le layout
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Vérifier que l'utilisateur a les permissions d'administration
  if (
    !session?.user?.role ||
    !["admin", "moderator", "editor"].includes(session.user.role)
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez les utilisateurs, invitations et permissions
          </p>
        </div>
        <InviteUserDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Inviter un utilisateur
          </Button>
        </InviteUserDialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<StatsCardSkeleton />}>
          <UsersStats />
        </Suspense>
      </div>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilisateurs
          </CardTitle>
          <CardDescription>
            Liste de tous les utilisateurs de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<UsersTableSkeleton />}>
            <UsersTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Removed unused _StatsCards function to resolve the error

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

function UsersTableSkeleton() {
  return (
    <div className="p-6">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`user-skeleton-${i}`}
            className="flex items-center space-x-4"
          >
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
