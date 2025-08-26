"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Users,
  BarChart3,
  Phone,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface WhatsAppConfig {
  id: string;
  isEnabled: boolean;
  welcomeMessage: string;
  messages: Record<string, string>;
  flows: Record<string, unknown>;
  sessionTimeout: number;
  maxMessages: number;
  updatedByUser?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}


interface Stats {
  summary: {
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    messagesThisPeriod: number;
    averageResponseTime: number;
    evolution: number;
  };
  charts: {
    messagesByDay: Array<{
      date: string;
      total_messages: number;
      user_messages: number;
      bot_messages: number;
    }>;
    messagesByType: Array<{
      messageType: string;
      _count: { messageType: number };
    }>;
    topQueries: Array<{
      word: string;
      count: number;
    }>;
  };
  mostActiveConversations: Array<{
    id: string;
    phoneNumber: string;
    name?: string;
    messageCount: number;
    lastMessage: string;
  }>;
}

export default function WhatsAppBotPage() {
  const { data: session, status } = useSession();
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/admin/whatsapp/config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Erreur chargement config:", error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/whatsapp/stats?period=7");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadConfig(),
        loadStats()
      ]);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status, loadData]);

  const saveConfig = async (updatedConfig: Partial<WhatsAppConfig>) => {
    try {
      const response = await fetch("/api/admin/whatsapp/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConfig),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        toast.success("Configuration sauvegardée");
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };


  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
  };

  const getEvolutionIcon = (evolution: number) => {
    if (evolution > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (evolution < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getEvolutionColor = (evolution: number) => {
    if (evolution > 0) return "text-green-600";
    if (evolution < 0) return "text-red-600";
    return "text-gray-600";
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span>Chargement du chatbot WhatsApp...</span>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès restreint</h1>
          <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  const messagesByDayData = {
    labels: stats?.charts.messagesByDay.map(d => new Date(d.date).toLocaleDateString("fr-FR")) || [],
    datasets: [
      {
        label: "Messages utilisateurs",
        data: stats?.charts.messagesByDay.map(d => d.user_messages) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "Messages bot",
        data: stats?.charts.messagesByDay.map(d => d.bot_messages) || [],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      }
    ]
  };

  const messagesByTypeData = {
    labels: stats?.charts.messagesByType.map(t => t.messageType) || [],
    datasets: [
      {
        data: stats?.charts.messagesByType.map(t => t._count.messageType) || [],
        backgroundColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(239, 68, 68)",
          "rgb(139, 92, 246)",
          "rgb(236, 72, 153)",
        ]
      }
    ]
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chatbot WhatsApp</h1>
          <p className="text-muted-foreground">
            Gérez votre assistant WhatsApp automatisé
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          {config && (
            <Badge variant={config.isEnabled ? "default" : "secondary"}>
              {config.isEnabled ? "Actif" : "Inactif"}
            </Badge>
          )}
        </div>
      </div>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <>
              {/* Métriques principales */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.summary.totalConversations}</div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <span>{stats.summary.activeConversations} actives</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Messages</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.summary.totalMessages}</div>
                    <div className="flex items-center space-x-1 text-xs">
                      {getEvolutionIcon(stats.summary.evolution)}
                      <span className={getEvolutionColor(stats.summary.evolution)}>
                        {Math.abs(stats.summary.evolution)}% cette semaine
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Temps de réponse</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.summary.averageResponseTime}s
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Temps moyen de réponse
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Performance</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {config?.isEnabled ? "Opérationnel" : "Arrêté"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Statut du service
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Graphiques */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Messages par jour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ height: "300px" }}>
                      <Line data={messagesByDayData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "top" as const } },
                      }} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Types de messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ height: "300px" }}>
                      <Doughnut data={messagesByTypeData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "right" as const } },
                      }} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Conversations les plus actives */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversations les plus actives</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.mostActiveConversations.slice(0, 5).map((conv) => (
                      <div key={conv.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Phone className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {conv.name || formatPhoneNumber(conv.phoneNumber)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {conv.phoneNumber}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{conv.messageCount} messages</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(conv.lastMessage).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="config" className="space-y-6">
          {config && (
            <>
              {/* Configuration générale */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuration générale</CardTitle>
                  <CardDescription>
                    Paramètres principaux du chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enabled">Chatbot activé</Label>
                      <p className="text-sm text-muted-foreground">
                        Active ou désactive le chatbot WhatsApp
                      </p>
                    </div>
                    <Switch
                      id="enabled"
                      checked={config.isEnabled}
                      onCheckedChange={(enabled) => {
                        saveConfig({ ...config, isEnabled: enabled });
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="welcome">Message de bienvenue</Label>
                    <Textarea
                      id="welcome"
                      value={config.welcomeMessage}
                      onChange={(e) => {
                        setConfig({ ...config, welcomeMessage: e.target.value });
                      }}
                      onBlur={() => {
                        saveConfig({ welcomeMessage: config.welcomeMessage });
                      }}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timeout">Timeout session (secondes)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={config.sessionTimeout}
                        onChange={(e) => {
                          setConfig({ ...config, sessionTimeout: parseInt(e.target.value) });
                        }}
                        onBlur={() => {
                          saveConfig({ sessionTimeout: config.sessionTimeout });
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxmsg">Messages max par heure</Label>
                      <Input
                        id="maxmsg"
                        type="number"
                        value={config.maxMessages}
                        onChange={(e) => {
                          setConfig({ ...config, maxMessages: parseInt(e.target.value) });
                        }}
                        onBlur={() => {
                          saveConfig({ maxMessages: config.maxMessages });
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions de configuration WhatsApp */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuration WhatsApp Business API</CardTitle>
                  <CardDescription>
                    Variables d&apos;environnement requises
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Variables d&apos;environnement :</h4>
                    <code className="text-sm">
                      WHATSAPP_VERIFY_TOKEN=votre_token_de_verification<br/>
                      WHATSAPP_ACCESS_TOKEN=votre_access_token<br/>
                      WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id<br/>
                      WHATSAPP_WEBHOOK_SECRET=votre_webhook_secret
                    </code>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">URL Webhook :</h4>
                    <code className="text-sm">
                      {process.env.NEXT_PUBLIC_URL || "https://votre-domaine.com"}/api/whatsapp/webhook
                    </code>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>1. Créez une application Facebook Developer</p>
                    <p>2. Configurez WhatsApp Business API</p>
                    <p>3. Ajoutez les variables d&apos;environnement</p>
                    <p>4. Configurez le webhook avec l&apos;URL ci-dessus</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Autres onglets... */}
        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Conversations WhatsApp</CardTitle>
              <CardDescription>
                Liste des conversations avec vos utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Les conversations apparaîtront ici une fois le chatbot configuré
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytiques avancées</CardTitle>
              <CardDescription>
                Statistiques détaillées du chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Les analytiques seront disponibles après la configuration
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}