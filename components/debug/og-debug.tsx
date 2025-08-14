"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface OpenGraphDebugProps {
  url: string;
  className?: string;
}

interface OGData {
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
  timestamp: string;
}

export function OpenGraphDebug({ url, className }: OpenGraphDebugProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [ogData, setOgData] = useState<OGData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const testMetadata = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/og-refresh?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (response.ok) {
        setOgData(data);
        toast.success("Métadonnées récupérées avec succès");
      } else {
        toast.error(data.error || "Erreur lors de la récupération");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFacebookCache = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/og-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("Cache Facebook rafraîchi");
        // Recharger les métadonnées après rafraîchissement
        await testMetadata();
      } else {
        toast.error(data.message || "Erreur lors du rafraîchissement");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setIsRefreshing(false);
    }
  };

  const openFacebookDebugger = () => {
    const debugUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`;
    window.open(debugUrl, '_blank');
  };

  // N'afficher qu'en mode développement
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="w-4 h-4" />
          Debug Open Graph
          <Badge variant="outline" className="text-xs">Dev</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={testMetadata}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {isLoading ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Eye className="w-3 h-3 mr-1" />}
            Tester métadonnées
          </Button>
          
          <Button
            onClick={refreshFacebookCache}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {isRefreshing ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
            Rafraîchir FB
          </Button>
          
          <Button
            onClick={openFacebookDebugger}
            size="sm"
            variant="outline"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>

        {ogData && (
          <div className="space-y-3 text-xs">
            <div>
              <h4 className="font-medium mb-2">Open Graph</h4>
              <div className="space-y-1 text-muted-foreground">
                {Object.entries(ogData.openGraph).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="font-mono w-20 shrink-0">{key}:</span>
                    <span className="truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {Object.keys(ogData.twitter).length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Twitter</h4>
                  <div className="space-y-1 text-muted-foreground">
                    {Object.entries(ogData.twitter).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-mono w-20 shrink-0">{key}:</span>
                        <span className="truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <Separator />
            <div className="text-xs text-muted-foreground">
              Testé le {new Date(ogData.timestamp).toLocaleString('fr-FR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}