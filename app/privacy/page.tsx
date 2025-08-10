import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Clock, FileText, Users, Lock, Eye, Database, Mail } from "lucide-react";
import { PrivacyActions } from "@/components/rgpd/privacy-action";
import { siteConfig } from "@/lib/site.config";

import { headers } from "next/headers";

export default async function PrivacyPage() {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  });

  let userConsent = null;
  if (session) {
    userConsent = await prisma.userConsent.findUnique({
      where: { userId: session.user.id },
    });
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Confidentialité et données</h1>
          <p className="text-muted-foreground mt-1">Gérez vos données personnelles et vos préférences de confidentialité</p>
        </div>
      </div>

      <div className="space-y-6">
        {session ? (
          <>
            {/* Aperçu du compte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Mon compte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-muted-foreground">{session.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Nom</p>
                    <p className="text-muted-foreground">{session.user.name || "Non défini"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Membre depuis</p>
                    <p className="text-muted-foreground">
                      {new Date(session.user.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Statut</p>
                    <Badge variant="outline">{session.user.role}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statut des consentements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Mes consentements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userConsent ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Cookies de préférences</h4>
                          <Badge variant={userConsent.cookies ? "default" : "secondary"}>
                            {userConsent.cookies ? "Activé" : "Désactivé"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Mémorisation de vos préférences (thème, langue, etc.)
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Analytics</h4>
                          <Badge variant={userConsent.analytics ? "default" : "secondary"}>
                            {userConsent.analytics ? "Activé" : "Désactivé"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Statistiques d'utilisation anonymisées
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Marketing</h4>
                          <Badge variant={userConsent.marketing ? "default" : "secondary"}>
                            {userConsent.marketing ? "Activé" : "Désactivé"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Communications promotionnelles personnalisées
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                      <Clock className="h-4 w-4" />
                      Dernière mise à jour : {new Date(userConsent.consentDate).toLocaleDateString("fr-FR")} à {new Date(userConsent.consentDate).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-2">
                      Aucun consentement enregistré
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Le banner de cookies apparaîtra lors de votre prochaine visite pour définir vos préférences.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions RGPD - Composant client */}
            <PrivacyActions />
          </>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Accès restreint</h3>
                <p className="text-muted-foreground mb-4">
                  Pour gérer vos données personnelles et vos préférences de confidentialité, vous devez être connecté.
                </p>
                <a 
                  href="/login" 
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
                >
                  Se connecter
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations détaillées sur les données */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Données collectées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Types de données collectées :</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm mb-1">Données d'identification</h5>
                    <p className="text-xs text-muted-foreground">Email, nom, photo de profil</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm mb-1">Données de navigation</h5>
                    <p className="text-xs text-muted-foreground">Pages visitées, temps de session</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm mb-1">Données techniques</h5>
                    <p className="text-xs text-muted-foreground">Adresse IP, navigateur, appareil</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm mb-1">Préférences</h5>
                    <p className="text-xs text-muted-foreground">Consentements, paramètres d'affichage</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">Finalités du traitement :</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                    Fourniture et amélioration des services
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                    Communications importantes et notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                    Analyse d'utilisation et statistiques (avec consentement)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                    Respect des obligations légales
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vos droits RGPD */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Vos droits RGPD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">📋 Droit d'accès</h4>
                  <p className="text-sm text-muted-foreground">
                    Obtenez une copie de toutes vos données personnelles que nous détenons.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">✏️ Droit de rectification</h4>
                  <p className="text-sm text-muted-foreground">
                    Demandez la correction de données inexactes ou incomplètes.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">🗑️ Droit à l'effacement</h4>
                  <p className="text-sm text-muted-foreground">
                    Demandez la suppression de vos données dans certaines conditions.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">📦 Droit à la portabilité</h4>
                  <p className="text-sm text-muted-foreground">
                    Récupérez vos données dans un format structuré et réutilisable.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">⛔ Droit d'opposition</h4>
                  <p className="text-sm text-muted-foreground">
                    Opposez-vous au traitement de vos données pour des raisons légitimes.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">⏸️ Droit à la limitation</h4>
                  <p className="text-sm text-muted-foreground">
                    Demandez la limitation du traitement de vos données.
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Contact pour vos droits</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Pour exercer vos droits ou pour toute question relative à vos données personnelles :
                    </p>
                    <a
                      href="mailto:privacy@abcbedarieux.com"
                      className="text-primary hover:underline font-medium"
                    >
                      privacy@abcbedarieux.com
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">
                      Délai de réponse : 30 jours maximum
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Politique complète */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents légaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Politique de confidentialité complète</h4>
                  <p className="text-sm text-muted-foreground">Version détaillée de notre politique de protection des données</p>
                </div>
                <a 
                  href="/documents/privacy-policy.pdf" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Consulter
                </a>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Conditions générales d'utilisation</h4>
                  <p className="text-sm text-muted-foreground">Termes et conditions d'utilisation du service</p>
                </div>
                <a 
                  href="/terms" 
                  className="text-primary hover:underline font-medium"
                >
                  Consulter
                </a>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>
                <p>Responsable du traitement : {siteConfig.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
