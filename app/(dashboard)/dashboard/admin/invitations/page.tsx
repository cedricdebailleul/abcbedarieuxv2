import { CheckCircle, Clock, Mail, Plus, XCircle } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";
import InviteUserDialog from "../users/_components/invite-user-dialog";
import InvitationsTable from "./_components/invitations-table";

export default async function AdminInvitationsPage() {
  // Vérifier les permissions d'administration - la session est garantie par le layout
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Vérifier que l'utilisateur a les permissions d'administration
  if (!session?.user?.role || !["admin", "moderator", "editor"].includes(safeUserCast(session.user).role)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Gestion des invitations</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les invitations en attente, expirées et validées
          </p>
        </div>
        <InviteUserDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle invitation
          </Button>
        </InviteUserDialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<StatsCardSkeleton />}>
          <StatsCards />
        </Suspense>
      </div>

      {/* Tableau des invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitations
          </CardTitle>
          <CardDescription>Toutes les invitations envoyées et leur statut</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<InvitationsTableSkeleton />}>
            <InvitationsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCards() {
  return (
    <>
      <Card data-stat-card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En attente</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">0</div>
          <p className="text-xs text-muted-foreground">Invitations actives</p>
        </CardContent>
      </Card>

      <Card data-stat-card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Validées</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">0</div>
          <p className="text-xs text-muted-foreground">Comptes créés</p>
        </CardContent>
      </Card>

      <Card data-stat-card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expirées</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">0</div>
          <p className="text-xs text-muted-foreground">Non utilisées</p>
        </CardContent>
      </Card>

      <Card data-stat-card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Mail className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">0</div>
          <p className="text-xs text-muted-foreground">Toutes invitations</p>
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

function InvitationsTableSkeleton() {
  return (
    <div className="p-6">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
