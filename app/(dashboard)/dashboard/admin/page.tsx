import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconUsers, IconAward, IconBuilding, IconMail, IconFlag, IconTrendingUp } from "@tabler/icons-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">
          Gérez les utilisateurs, contenus et paramètres de la plateforme ABC Bédarieux.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Utilisateurs */}
        <Link href="/dashboard/admin/users">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5 text-blue-500" />
                Utilisateurs
              </CardTitle>
              <CardDescription>
                Gérer les comptes utilisateurs et leurs permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconTrendingUp className="h-4 w-4" />
                Gestion des utilisateurs
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Badges */}
        <Link href="/dashboard/admin/badges">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconAward className="h-5 w-5 text-yellow-500" />
                Badges
              </CardTitle>
              <CardDescription>
                Créer et attribuer des badges aux utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconTrendingUp className="h-4 w-4" />
                Système de récompenses
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Catégories de Places */}
        <Link href="/dashboard/admin/place-categories">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBuilding className="h-5 w-5 text-green-500" />
                Catégories
              </CardTitle>
              <CardDescription>
                Organiser les catégories de commerces et lieux
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconTrendingUp className="h-4 w-4" />
                Classification des lieux
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Réclamations */}
        <Link href="/dashboard/admin/claims">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFlag className="h-5 w-5 text-orange-500" />
                Réclamations
              </CardTitle>
              <CardDescription>
                Traiter les demandes de réclamation de lieux
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconTrendingUp className="h-4 w-4" />
                Gestion des réclamations
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Newsletter */}
        <Link href="/dashboard/admin/newsletter">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMail className="h-5 w-5 text-purple-500" />
                Newsletter
              </CardTitle>
              <CardDescription>
                Créer et envoyer des newsletters aux abonnés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconTrendingUp className="h-4 w-4" />
                Communication marketing
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques d'administration</CardTitle>
          <CardDescription>
            Aperçu rapide de l'activité administrative
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total utilisateurs</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Badges créés</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Réclamations en attente</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Campagnes newsletter</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}