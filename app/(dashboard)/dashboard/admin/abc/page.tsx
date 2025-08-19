"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconUsers, IconCreditCard, IconTrendingUp, IconClock } from "@tabler/icons-react";

interface AbcStats {
  overview: {
    totalMembers: number;
    totalPayments: number;
    totalTransactions: number;
    pendingPayments: number;
  };
  membersByType: Array<{
    type: string;
    count: number;
  }>;
  paymentsByMode: Array<{
    mode: string;
    count: number;
    total: number;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    mode: string;
    status: string;
    createdAt: string;
    member: {
      type: string;
      user: { name: string; email: string };
    };
  }>;
  monthlyPayments: Array<{
    month: string;
    total: number;
  }>;
}

export default function AbcAdminPage() {
  const [stats, setStats] = useState<AbcStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/abc/stats');
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des stats:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/abc/stats');
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des stats:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">ABC - Administration</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-300 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">ABC - Administration</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Erreur: {error}</p>
              <Button onClick={fetchStats}>Réessayer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const typeLabels: Record<string, string> = {
    ACTIF: "Actif",
    ARTISAN: "Artisan", 
    AUTO_ENTREPRENEUR: "Auto-entrepreneur",
    PARTENAIRE: "Partenaire",
    BIENFAITEUR: "Bienfaiteur"
  };

  const modeLabels: Record<string, string> = {
    CHEQUE: "Chèque",
    ESPECE: "Espèce", 
    VIREMENT: "Virement"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ABC - Administration</h1>
        <Button onClick={fetchStats} variant="outline">
          Actualiser
        </Button>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconUsers className="h-4 w-4" />
              Membres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconCreditCard className="h-4 w-4" />
              Paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalPayments.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">{stats.overview.totalTransactions} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconTrendingUp className="h-4 w-4" />
              Moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.overview.totalTransactions > 0 
                ? (stats.overview.totalPayments / stats.overview.totalTransactions).toFixed(2)
                : '0.00'} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconClock className="h-4 w-4" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Répartition des membres */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des membres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.membersByType.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <span className="text-sm">{typeLabels[item.type] || item.type}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Paiements par mode */}
        <Card>
          <CardHeader>
            <CardTitle>Paiements par mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.paymentsByMode.map((item) => (
                <div key={item.mode} className="flex items-center justify-between">
                  <span className="text-sm">{modeLabels[item.mode] || item.mode}</span>
                  <div className="text-right">
                    <div className="font-medium">{item.total.toFixed(2)} €</div>
                    <div className="text-xs text-muted-foreground">{item.count} transactions</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Paiements récents */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements récents</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucun paiement récent</p>
          ) : (
            <div className="space-y-3">
              {stats.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{payment.member.user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {typeLabels[payment.member.type]} • {modeLabels[payment.mode]}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{payment.amount.toFixed(2)} €</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}