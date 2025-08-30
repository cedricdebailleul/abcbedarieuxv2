"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconUsers,
  IconAward,
  IconBuilding,
  IconFlag,
  IconTrendingUp,
  IconDownload,
  IconMail} from "@tabler/icons-react";
import Link from "next/link";
import { AdminStatsCards } from "@/components/admin/admin-stats-cards";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">
          Gérez les utilisateurs, contenus et paramètres de la plateforme ABC
          Bédarieux.
        </p>
      </div>

      {/* Statistiques générales du site */}
      <AdminStatsCards />

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

        {/* Export des données */}
        <Link href="/dashboard/admin/export">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDownload className="h-5 w-5 text-cyan-500" />
                Export des données
              </CardTitle>
              <CardDescription>
                Exporter les données de la plateforme pour sauvegarde
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconTrendingUp className="h-4 w-4" />
                Sauvegarde et archivage
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Accès direct aux tâches d&apos;administration les plus courantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard/admin/claims"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <IconFlag className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">
                Traiter les réclamations
              </span>
            </Link>
            <Link
              href="/dashboard/admin/newsletter"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <IconMail className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">
                Envoyer une newsletter
              </span>
            </Link>
            <Link
              href="/dashboard/admin/users"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <IconUsers className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">
                Gérer les utilisateurs
              </span>
            </Link>
            <Link
              href="/dashboard/admin/badges"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <IconAward className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Attribuer des badges</span>
            </Link>
            <Link
              href="/dashboard/admin/export"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <IconDownload className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-medium">Exporter les données</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
