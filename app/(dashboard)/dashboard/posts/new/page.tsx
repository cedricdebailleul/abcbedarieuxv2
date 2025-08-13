import { ArrowLeft, PlusCircle } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PostForm } from "@/components/forms/post-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function NewPostPage() {
  // Vérifier l'authentification
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  // Vérifier les permissions
  const canCreatePosts =
    session.user.role && ["admin", "editor", "user"].includes(session.user.role);

  if (!canCreatePosts) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Navigation et en-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/posts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux articles
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PlusCircle className="h-6 w-6" />
              Nouvel article
            </h1>
            <p className="text-muted-foreground">Créez un nouvel article pour votre blog</p>
          </div>
        </div>
      </div>

      {/* Conseils pour la rédaction */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full dark:bg-blue-900">
                <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Conseils pour un bon article
              </h3>
              <div className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                <ul className="list-disc list-inside space-y-1">
                  <li>Choisissez un titre accrocheur et descriptif</li>
                  <li>Rédigez un extrait qui donne envie de lire la suite</li>
                  <li>Organisez votre contenu avec des sous-titres</li>
                  <li>Ajoutez des tags pertinents pour faciliter la découverte</li>
                  <li>Optimisez le référencement avec les champs SEO</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de création */}
      <PostForm mode="create" />
    </div>
  );
}

// Métadonnées pour SEO
export const metadata = {
  title: "Nouvel article - Dashboard",
  description: "Créer un nouvel article",
};
