import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Phone } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité - ABC Bédarieux",
  description: "Politique de confidentialité et protection des données personnelles de l'Association Bédaricienne des Commerçants.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Shield className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Politique de confidentialité</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Protection et utilisation de vos données personnelles
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long", 
            year: "numeric"
          })}
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>1. Responsable du traitement</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                Le responsable du traitement des données personnelles est l'Association Bédaricienne des Commerçants (ABC), 
                située à Bédarieux (34600), représentée par son président.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Contact :</h4>
                <p>Email : contact@abc-bedarieux.fr</p>
                <p>Téléphone : 04 67 95 XX XX</p>
                <p>Adresse : Mairie de Bédarieux, 1 Avenue Abbé Tarroux, 34600 Bédarieux</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Données collectées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Données d'inscription :</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Nom, prénom</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone (optionnel)</li>
                  <li>Mot de passe (chiffré)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Données d'établissement :</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Nom commercial</li>
                  <li>Adresse de l'établissement</li>
                  <li>Horaires d'ouverture</li>
                  <li>Description de l'activité</li>
                  <li>Photos et documents</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Données de navigation :</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Adresse IP</li>
                  <li>Cookies techniques</li>
                  <li>Données de géolocalisation (avec consentement)</li>
                  <li>Statistiques d'utilisation</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Finalités du traitement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Gestion des comptes utilisateurs</h4>
                  <p className="text-muted-foreground">
                    Création, authentification et gestion de votre compte sur notre plateforme.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Annuaire des commerçants</h4>
                  <p className="text-muted-foreground">
                    Publication et promotion des établissements membres de l'association.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Communication</h4>
                  <p className="text-muted-foreground">
                    Envoi de newsletters, notifications d'événements et informations importantes.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Amélioration des services</h4>
                  <p className="text-muted-foreground">
                    Analyse statistique pour améliorer l'expérience utilisateur et nos services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Base légale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Consentement</p>
                    <p className="text-sm text-muted-foreground">
                      Pour l'inscription à la newsletter et la géolocalisation
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Exécution du contrat</p>
                    <p className="text-sm text-muted-foreground">
                      Pour la gestion de votre compte et les services d'annuaire
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Intérêt légitime</p>
                    <p className="text-sm text-muted-foreground">
                      Pour l'amélioration de nos services et la sécurité de la plateforme
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Partage des données</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Vos données personnelles ne sont jamais vendues ou transmises à des tiers commerciaux. 
                Elles peuvent être partagées uniquement dans les cas suivants :
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Avec votre consentement explicite</li>
                <li>Pour répondre à une obligation légale</li>
                <li>Avec nos prestataires techniques (hébergement, maintenance) sous contrat de confidentialité</li>
                <li>Dans le cadre de la promotion de votre établissement (informations publiques)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Durée de conservation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Comptes actifs</span>
                  <span className="text-muted-foreground">Tant que le compte est utilisé</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Comptes inactifs</span>
                  <span className="text-muted-foreground">3 ans sans connexion</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Données de navigation</span>
                  <span className="text-muted-foreground">13 mois maximum</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Newsletters</span>
                  <span className="text-muted-foreground">Jusqu'à désinscription</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Vos droits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Droit d'accès</h4>
                  <p className="text-sm text-muted-foreground">
                    Obtenir une copie de vos données personnelles
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Droit de rectification</h4>
                  <p className="text-sm text-muted-foreground">
                    Corriger des données inexactes ou incomplètes
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Droit à l'effacement</h4>
                  <p className="text-sm text-muted-foreground">
                    Demander la suppression de vos données
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Droit à la portabilité</h4>
                  <p className="text-sm text-muted-foreground">
                    Récupérer vos données dans un format structuré
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Sécurité</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Chiffrement des données sensibles</li>
                <li>Authentification sécurisée</li>
                <li>Sauvegardes régulières</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Formation du personnel à la protection des données</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Cookies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Notre site utilise des cookies techniques nécessaires au fonctionnement de la plateforme. 
                Vous pouvez gérer vos préférences via notre bandeau de cookies.
              </p>
              <Button asChild variant="outline">
                <Link href="/cookies">
                  Gérer les cookies
                </Link>
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact DPO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pour exercer vos droits ou pour toute question relative à vos données personnelles :
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">dpo@abc-bedarieux.fr</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Téléphone</p>
                    <p className="text-sm text-muted-foreground">04 67 95 XX XX</p>
                  </div>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link href="/contact">
                  Exercer mes droits
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réclamation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL.
              </p>
              <Button asChild variant="outline" className="w-full">
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
                  Contacter la CNIL
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}