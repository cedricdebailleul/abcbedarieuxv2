"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Calendar, Plus, AlertCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { HistoryConfigForm } from "@/components/admin/history/history-config-form";
import { MilestoneForm } from "@/components/admin/history/milestone-form";
import { TimelineEventForm } from "@/components/admin/history/timeline-event-form";
import { MilestoneList } from "@/components/admin/history/milestone-list";
import { TimelineEventList } from "@/components/admin/history/timeline-event-list";
import {
  HistoryConfig,
  HistoryMilestone,
  HistoryTimelineEvent,
  HistoryApiResponse,
} from "@/lib/types/history";

export default function AdminHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<HistoryConfig | null>(null);
  const [milestones, setMilestones] = useState<HistoryMilestone[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<HistoryTimelineEvent[]>(
    []
  );
  const [activeTab, setActiveTab] = useState("general");

  // États pour les formulaires
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [editingMilestone, setEditingMilestone] =
    useState<HistoryMilestone | null>(null);
  const [editingTimelineEvent, setEditingTimelineEvent] =
    useState<HistoryTimelineEvent | null>(null);

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      const response = await fetch("/api/admin/history");

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const data: HistoryApiResponse = await response.json();
      setConfig(data.config);
      setMilestones(data.milestones);
      setTimelineEvents(data.timelineEvents);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la récupération des données");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = async (configData: Partial<HistoryConfig>) => {
    setSaving(true);
    try {
      const method = config ? "PUT" : "POST";
      const response = await fetch("/api/admin/history", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      const updatedConfig = await response.json();
      setConfig(updatedConfig);
      toast.success("Configuration sauvegardée avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleMilestoneSave = async (
    milestoneData: Partial<HistoryMilestone>
  ) => {
    try {
      if (editingMilestone) {
        // Mise à jour
        const response = await fetch(
          `/api/admin/history/milestones/${editingMilestone.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(milestoneData),
          }
        );

        if (!response.ok) throw new Error("Erreur lors de la mise à jour");

        const updatedMilestone = await response.json();
        setMilestones((prev) =>
          prev.map((m) => (m.id === editingMilestone.id ? updatedMilestone : m))
        );
        toast.success("Milestone mise à jour avec succès");
      } else {
        // Création
        const response = await fetch("/api/admin/history/milestones", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(milestoneData),
        });

        if (!response.ok) throw new Error("Erreur lors de la création");

        const newMilestone = await response.json();
        setMilestones((prev) => [...prev, newMilestone]);
        toast.success("Milestone créée avec succès");
      }

      setShowMilestoneForm(false);
      setEditingMilestone(null);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde de la milestone");
    }
  };

  const handleTimelineEventSave = async (
    eventData: Partial<HistoryTimelineEvent>
  ) => {
    try {
      if (editingTimelineEvent) {
        // Mise à jour
        const response = await fetch(
          `/api/admin/history/timeline/${editingTimelineEvent.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventData),
          }
        );

        if (!response.ok) throw new Error("Erreur lors de la mise à jour");

        const updatedEvent = await response.json();
        setTimelineEvents((prev) =>
          prev.map((e) => (e.id === editingTimelineEvent.id ? updatedEvent : e))
        );
        toast.success("Événement mis à jour avec succès");
      } else {
        // Création
        const response = await fetch("/api/admin/history/timeline", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) throw new Error("Erreur lors de la création");

        const newEvent = await response.json();
        setTimelineEvents((prev) => [...prev, newEvent]);
        toast.success("Événement créé avec succès");
      }

      setShowTimelineForm(false);
      setEditingTimelineEvent(null);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde de l'événement");
    }
  };

  const handleMilestoneDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/history/milestones/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      setMilestones((prev) => prev.filter((m) => m.id !== id));
      toast.success("Milestone supprimée avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleTimelineEventDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/history/timeline/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      setTimelineEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Événement supprimé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion de l&apos;histoire
          </h1>
          <p className="text-muted-foreground">
            Configurez le contenu de la page &quot;Notre histoire&quot;
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config?.isActive ? "default" : "secondary"}>
            {config?.isActive ? "Actif" : "Inactif"}
          </Badge>
        </div>
      </div>

      {!config && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucune configuration n&apos;a été créée. Commencez par configurer
            les paramètres généraux.
          </AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration générale
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Étapes clés ({milestones.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Chronologie ({timelineEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration générale</CardTitle>
              <CardDescription>
                Paramètres généraux de la page histoire (titre, description,
                vision future, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryConfigForm
                config={config}
                onSave={handleConfigSave}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Étapes clés</CardTitle>
                  <CardDescription>
                    Chiffres et statistiques importantes à mettre en avant
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingMilestone(null);
                    setShowMilestoneForm(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une étape
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MilestoneList
                milestones={milestones}
                onEdit={(milestone) => {
                  setEditingMilestone(milestone);
                  setShowMilestoneForm(true);
                }}
                onDelete={handleMilestoneDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chronologie</CardTitle>
                  <CardDescription>
                    Événements marquants de l&apos;histoire d&apos;ABC Bédarieux
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingTimelineEvent(null);
                    setShowTimelineForm(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un événement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TimelineEventList
                events={timelineEvents}
                onEdit={(event) => {
                  setEditingTimelineEvent(event);
                  setShowTimelineForm(true);
                }}
                onDelete={handleTimelineEventDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modales de formulaires */}
      <MilestoneForm
        milestone={editingMilestone}
        open={showMilestoneForm}
        onClose={() => {
          setShowMilestoneForm(false);
          setEditingMilestone(null);
        }}
        onSave={handleMilestoneSave}
      />

      <TimelineEventForm
        event={editingTimelineEvent}
        open={showTimelineForm}
        onClose={() => {
          setShowTimelineForm(false);
          setEditingTimelineEvent(null);
        }}
        onSave={handleTimelineEventSave}
      />
    </div>
  );
}
