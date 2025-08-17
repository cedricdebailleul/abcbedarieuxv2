"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Calendar, 
  MapPin, 
  FileText, 
  Send, 
  Save,
  Eye,
  AlertTriangle
} from "lucide-react";

interface ContentItem {
  id: string;
  type: "event" | "place" | "post";
  title: string;
  description?: string;
  date?: string;
  location?: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    type: "NEWSLETTER" as const,
    content: "",
    includedEvents: [] as string[],
    includedPlaces: [] as string[],
    includedPosts: [] as string[],
    scheduledAt: ""
  });

  // Mock data - à remplacer par de vraies données
  const [availableContent] = useState<ContentItem[]>([
    {
      id: "event-1",
      type: "event",
      title: "Festival de Bédarieux 2024",
      description: "Grand festival de musique au cœur de la ville",
      date: "2024-09-15",
      location: "Place de la République"
    },
    {
      id: "place-1", 
      type: "place",
      title: "Nouvelle Boulangerie Artisanale",
      description: "Ouverture d'une nouvelle boulangerie bio",
      location: "Rue de la Liberté"
    },
    {
      id: "post-1",
      type: "post", 
      title: "Les soldes d'été arrivent",
      description: "Découvrez les meilleures offres de nos commerçants"
    }
  ]);

  const handleSubmit = async (e: React.FormEvent, status: "DRAFT" | "SCHEDULED") => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status,
          scheduledAt: status === "SCHEDULED" ? formData.scheduledAt : null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.migrationRequired) {
          setError("Migration de base de données requise. Veuillez exécuter 'pnpm newsletter:migrate' pour créer les tables newsletter.");
        } else {
          throw new Error(data.error || "Erreur lors de la création");
        }
        return;
      }

      if (data.campaign?.id) {
        router.push(`/dashboard/admin/newsletter/campaigns/${data.campaign.id}`);
      } else {
        router.push("/dashboard/admin/newsletter");
      }
      
    } catch (err) {
      if (err instanceof SyntaxError && err.message.includes("Unexpected token")) {
        setError("Erreur de communication avec le serveur. Veuillez vérifier que toutes les routes API sont configurées.");
      } else {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleContent = (contentId: string, type: "event" | "place" | "post") => {
    const field = type === "event" ? "includedEvents" : 
                 type === "place" ? "includedPlaces" : "includedPosts";
    
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(contentId)
        ? prev[field].filter(id => id !== contentId)
        : [...prev[field], contentId]
    }));
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "event": return <Calendar className="w-4 h-4" />;
      case "place": return <MapPin className="w-4 h-4" />;
      case "post": return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Nouvelle campagne</h1>
        <p className="text-muted-foreground">
          Créez une nouvelle campagne d'email pour vos abonnés
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de la campagne *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Newsletter du mois de septembre"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Objet de l'email *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="🎉 Découvrez les nouveautés de Bédarieux"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type de campagne</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEWSLETTER">Newsletter régulière</SelectItem>
                      <SelectItem value="ANNOUNCEMENT">Annonce spéciale</SelectItem>
                      <SelectItem value="EVENT_DIGEST">Digest d'événements</SelectItem>
                      <SelectItem value="PLACE_UPDATE">Nouveaux commerces</SelectItem>
                      <SelectItem value="PROMOTIONAL">Promotionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Content Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Contenu à inclure</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="events" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="events">Événements</TabsTrigger>
                    <TabsTrigger value="places">Commerces</TabsTrigger>
                    <TabsTrigger value="posts">Articles</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="events" className="space-y-4">
                    {availableContent
                      .filter(item => item.type === "event")
                      .map((item) => (
                        <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={formData.includedEvents.includes(item.id)}
                            onCheckedChange={() => toggleContent(item.id, "event")}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {getContentIcon(item.type)}
                              <h4 className="font-medium">{item.title}</h4>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              {item.date && <span>📅 {new Date(item.date).toLocaleDateString("fr-FR")}</span>}
                              {item.location && <span>📍 {item.location}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                  
                  <TabsContent value="places" className="space-y-4">
                    {availableContent
                      .filter(item => item.type === "place")
                      .map((item) => (
                        <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={formData.includedPlaces.includes(item.id)}
                            onCheckedChange={() => toggleContent(item.id, "place")}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {getContentIcon(item.type)}
                              <h4 className="font-medium">{item.title}</h4>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                            {item.location && (
                              <p className="text-xs text-muted-foreground">📍 {item.location}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                  
                  <TabsContent value="posts" className="space-y-4">
                    {availableContent
                      .filter(item => item.type === "post")
                      .map((item) => (
                        <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={formData.includedPosts.includes(item.id)}
                            onCheckedChange={() => toggleContent(item.id, "post")}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {getContentIcon(item.type)}
                              <h4 className="font-medium">{item.title}</h4>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Custom Content */}
            <Card>
              <CardHeader>
                <CardTitle>Contenu personnalisé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="content">Message personnalisé (optionnel)</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Ajoutez un message personnalisé qui apparaîtra en introduction de votre newsletter..."
                    className="min-h-32"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {/* TODO: Implement preview */}}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={(e) => handleSubmit(e, "DRAFT")}
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer le brouillon
                </Button>
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle>Programmation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Date d'envoi (optionnel)</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Laissez vide pour envoyer immédiatement
                  </p>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={(e) => handleSubmit(e, "SCHEDULED")}
                  disabled={loading || !formData.title || !formData.subject}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {formData.scheduledAt ? "Programmer l'envoi" : "Envoyer maintenant"}
                </Button>
              </CardContent>
            </Card>

            {/* Statistics Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Aperçu des destinataires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Abonnés actifs :</span>
                    <span className="font-medium">TODO</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Événements :</span>
                    <span className="font-medium">TODO</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Commerces :</span>
                    <span className="font-medium">TODO</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Actualités :</span>
                    <span className="font-medium">TODO</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}