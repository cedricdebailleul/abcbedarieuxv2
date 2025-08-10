import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import UsersTable from "./_components/users-table";
import InviteUserDialog from "./_components/invite-user-dialog";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function AdminUsersPage() {
  // Vérifier l'authentification et les permissions
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Vérifier que l'utilisateur est admin
  if (session.user.role !== "admin") {
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
          <StatsCards />
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

async function StatsCards() {
  // Ces requêtes pourraient être mises en cache ou optimisées
  const stats = {
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    bannedUsers: 0,
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total utilisateurs
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Tous les utilisateurs
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Utilisateurs actifs
          </CardTitle>
          <div className="h-2 w-2 bg-green-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            Statut actif
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Nouveaux ce mois
          </CardTitle>
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            Inscriptions récentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Utilisateurs bannis
          </CardTitle>
          <div className="h-2 w-2 bg-red-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.bannedUsers}</div>
          <p className="text-xs text-muted-foreground">
            Comptes suspendus
          </p>
        </CardContent>
      </Card>
    </>
  );
}

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
          <div key={i} className="flex items-center space-x-4">
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