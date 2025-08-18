"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Eye, 
  MousePointer, 
  Shield, 
  Info, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default function GmailTrackingHelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tracking Gmail - Guide d'aide</h1>
        <p className="text-muted-foreground">
          Comprendre pourquoi les statistiques d'ouverture peuvent être limitées sur Gmail
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Gmail et la plupart des clients email bloquent automatiquement les images pour protéger la vie privée, 
          ce qui peut affecter le tracking des ouvertures.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Tracking des ouvertures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Méthode</Badge>
                <span className="text-sm">Pixel invisible 1x1</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Un pixel transparent est chargé quand l'email s'ouvre
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Limitations Gmail
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Images bloquées par défaut</li>
                <li>• Chargement via proxy Google</li>
                <li>• Protection anti-tracking</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Solutions mises en place
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multiples pixels de tracking</li>
                <li>• Tracking CSS de fallback</li>
                <li>• Lien "Voir dans le navigateur"</li>
                <li>• Auto-tracking via clics</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-green-600" />
              Tracking des clics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Méthode</Badge>
                <span className="text-sm">Redirecteur de liens</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Tous les liens passent par notre système de tracking
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Fiabilité
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• ✅ Fonctionne sur tous les clients</li>
                <li>• ✅ Non bloqué par Gmail</li>
                <li>• ✅ Tracking précis à 100%</li>
                <li>• ✅ Marque aussi comme "ouvert"</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Contournements pour Gmail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Pour les destinataires :</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>📧 <strong>Cliquer sur "Voir dans le navigateur"</strong></p>
                <p>→ Ouvrira l'email dans le navigateur avec tracking complet</p>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>🖼️ <strong>Autoriser les images dans Gmail</strong></p>
                <p>→ Paramètres Gmail > Images > Toujours afficher</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Détection automatique :</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>🖱️ <strong>Tracking par les clics</strong></p>
                <p>→ Dès qu'un destinataire clique, il est marqué "ouvert"</p>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>🌐 <strong>Version web</strong></p>
                <p>→ Tracking fiable à 100% dans le navigateur</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques attendues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded">
              <span className="font-medium">Tracking des clics</span>
              <Badge variant="default">100% fiable</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded">
              <span className="font-medium">Tracking des ouvertures (Gmail)</span>
              <Badge variant="outline">30-60% visibilité</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded">
              <span className="font-medium">Tracking des ouvertures (autres clients)</span>
              <Badge variant="secondary">70-90% visibilité</Badge>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Note :</strong> Les taux d'ouverture réels sont généralement plus élevés que ce qui est mesuré, 
            en raison des protections anti-tracking des clients email modernes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}