"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  Mail,
  Loader2} from "lucide-react";

interface QueueStatusData {
  pending?: number;
  processing?: number;
  completed?: number;
  failed?: number;
}

interface QueueStatusProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function QueueStatus({
  className = "",
  autoRefresh = false,
  refreshInterval = 5000,
}: QueueStatusProps) {
  const [status, setStatus] = useState<QueueStatusData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/newsletter/queue/status", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setStatus(data.status || {});
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const totalJobs = Object.values(status).reduce(
    (sum, count) => sum + (count || 0),
    0
  );
  const activeJobs = (status.pending || 0) + (status.processing || 0);

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Erreur de statut
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            File d&apos;attente
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && totalJobs === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Résumé général */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Total emails</span>
              </div>
              <Badge variant={activeJobs > 0 ? "default" : "secondary"}>
                {totalJobs}
              </Badge>
            </div>

            {/* Détails par statut */}
            <div className="grid grid-cols-2 gap-3">
              {/* En attente */}
              <div className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-xs">En attente</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-200"
                >
                  {status.pending || 0}
                </Badge>
              </div>

              {/* En cours */}
              <div className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  <span className="text-xs">En cours</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-200"
                >
                  {status.processing || 0}
                </Badge>
              </div>

              {/* Complétés */}
              <div className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Envoyés</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-200"
                >
                  {status.completed || 0}
                </Badge>
              </div>

              {/* Échecs */}
              <div className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs">Échecs</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-red-600 border-red-200"
                >
                  {status.failed || 0}
                </Badge>
              </div>
            </div>

            {/* Informations système */}
            <div className="text-xs text-gray-500 pt-2 border-t">
              <div className="flex justify-between">
                <span>Batch: 10 emails max</span>
                <span>Délai: 1s entre emails</span>
              </div>
              {lastUpdated && (
                <div className="mt-1">
                  Mis à jour: {lastUpdated.toLocaleTimeString("fr-FR")}
                </div>
              )}
            </div>

            {/* Statut actuel */}
            {activeJobs > 0 ? (
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm text-blue-700">
                  {activeJobs} email{activeJobs > 1 ? "s" : ""} en traitement
                </span>
              </div>
            ) : totalJobs > 0 ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700">
                  File d&apos;attente vide
                </span>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-2">
                Aucun email en queue
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
