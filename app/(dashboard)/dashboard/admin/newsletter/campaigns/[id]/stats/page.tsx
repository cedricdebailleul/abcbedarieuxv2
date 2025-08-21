"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { CampaignStatsLive } from "../../_components/CampaignStatsLive";
import { QueueStatus } from "../../_components/QueueStatus";

export default function CampaignStatsPage() {
  const params = useParams();
  const campaignId = params.id as string;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/newsletter/campaigns">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux campagnes
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold mt-2">
            Statistiques de la campagne
          </h1>
          <p className="text-muted-foreground">
            Suivi en temps réel des performances d&apos;envoi et
            d&apos;engagement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Temps réel
          </Badge>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Statistiques principales */}
        <div className="lg:col-span-3">
          <CampaignStatsLive
            campaignId={campaignId}
            autoRefresh={true}
            refreshInterval={15000}
          />
        </div>

        {/* Sidebar avec statut de queue */}
        <div className="space-y-6">
          <QueueStatus autoRefresh={true} refreshInterval={10000} />

          {/* Informations utiles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium mb-1">Mise à jour</h4>
                <p className="text-muted-foreground">
                  Les statistiques se mettent à jour automatiquement toutes les
                  15 secondes.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Tracking</h4>
                <p className="text-muted-foreground">
                  Les ouvertures sont suivies via pixel de tracking. Les clics
                  via redirection.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Performance</h4>
                <p className="text-muted-foreground">
                  Taux d&apos;ouverture moyen en France: 15-25%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Aide rapide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Améliorer les performances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="space-y-1">
                <h4 className="font-medium">Pour plus d&apos;ouvertures:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Personnalisez les sujets</li>
                  <li>Évitez les mots spam</li>
                  <li>Envoyez aux bonnes heures</li>
                  <li>Nettoyez vos listes</li>
                </ul>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Pour plus de clics:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Call-to-action clairs</li>
                  <li>Contenu pertinent</li>
                  <li>Design responsive</li>
                  <li>Liens visibles</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
