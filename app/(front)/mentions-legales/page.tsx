import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Mentions légales & CGU - ABC Bédarieux",
  description:
    "Mentions légales et conditions générales d'utilisation du site ABC Bédarieux, annuaire des commerçants de Bédarieux.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Scale className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Mentions légales &amp; CGU</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Conditions générales d&apos;utilisation et informations légales du site
          ABC Bédarieux
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Éditeur du site</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <p>
              Le site <strong>abcbedarieux.com</strong> est édité par
              l&apos;Association Bédaricienne des Commerçants (ABC), association
              loi 1901, dont le siège social est situé à Bédarieux (34600),
              représentée par son président.
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p><strong>Contact :</strong></p>
              <p>Email : {siteConfig.contact.email}</p>
              <p>Adresse : {siteConfig.contact.address}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Hébergement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Le site est hébergé par un prestataire d&apos;hébergement
              professionnel garantissant la disponibilité et la sécurité des
              données.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Propriété intellectuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              L&apos;ensemble des contenus présents sur ce site (textes, images,
              logos) sont la propriété de l&apos;Association Bédaricienne des
              Commerçants ou de leurs auteurs respectifs. Toute reproduction est
              interdite sans autorisation préalable.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Conditions d&apos;utilisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Accès au service</h4>
              <p className="text-muted-foreground">
                L&apos;utilisation du site est réservée aux personnes majeures
                ou aux mineurs avec l&apos;accord de leurs représentants légaux.
                L&apos;inscription est gratuite pour les commerces de Bédarieux et
                ses environs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contenu utilisateur</h4>
              <p className="text-muted-foreground">
                Les utilisateurs s&apos;engagent à ne publier que des informations
                exactes et à ne pas diffuser de contenu illicite, trompeur ou
                portant atteinte aux droits de tiers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Responsabilité</h4>
              <p className="text-muted-foreground">
                L&apos;association ABC Bédarieux ne peut être tenue responsable des
                informations publiées par les commerçants. Les fiches sont
                publiées sous la responsabilité de leurs auteurs.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Droit applicable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Les présentes mentions légales sont soumises au droit français.
              Tout litige relatif à l&apos;utilisation du site sera soumis à la
              compétence exclusive des tribunaux français.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
