"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Send, 
  Save,
  AlertTriangle,
  RefreshCw,
  Users
} from "lucide-react";
import { useAvailableContent } from "../_hooks/useAvailableContent";
import { ContentSelector } from "../_components/ContentSelector";
import { AttachmentManager, type Attachment } from "../_components/AttachmentManager";
import { NewsletterPreview } from "../_components/NewsletterPreview";

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Utiliser le hook pour récupérer le contenu dynamique
  const { content, stats, loading: contentLoading, error: contentError, refetch } = useAvailableContent();
  
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    type: "NEWSLETTER",
    content: "",
    includedEvents: [] as string[],
    includedPlaces: [] as string[],
    includedPosts: [] as string[],
    scheduledAt: ""
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);

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
          attachments: attachments.filter(a => a.uploaded), // Seulement les fichiers uploadés
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

  const toggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      includedEvents: prev.includedEvents.includes(eventId)
        ? prev.includedEvents.filter(id => id !== eventId)
        : [...prev.includedEvents, eventId]
    }));
  };

  const togglePlace = (placeId: string) => {
    setFormData(prev => ({
      ...prev,
      includedPlaces: prev.includedPlaces.includes(placeId)
        ? prev.includedPlaces.filter(id => id !== placeId)
        : [...prev.includedPlaces, placeId]
    }));
  };

  const togglePost = (postId: string) => {
    setFormData(prev => ({
      ...prev,
      includedPosts: prev.includedPosts.includes(postId)
        ? prev.includedPosts.filter(id => id !== postId)
        : [...prev.includedPosts, postId]
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Nouvelle campagne</h1>
        <p className="text-muted-foreground">
          Créez une nouvelle campagne d&apos;email pour vos abonnés
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {contentError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement du contenu: {contentError}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              className="ml-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Réessayer
            </Button>
          </AlertDescription>
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
                  <Label htmlFor="subject">Objet de l&apos;email *</Label>
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
                    onValueChange={(value: "NEWSLETTER" | "ANNOUNCEMENT" | "EVENT_DIGEST" | "PLACE_UPDATE" | "PROMOTIONAL") => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEWSLETTER">Newsletter régulière</SelectItem>
                      <SelectItem value="ANNOUNCEMENT">Annonce spéciale</SelectItem>
                      <SelectItem value="EVENT_DIGEST">Digest d&apos;événements</SelectItem>
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
                <div className="flex items-center justify-between">
                  <CardTitle>Contenu à inclure</CardTitle>
                  {contentLoading && (
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {contentLoading ? (
                  <div className="space-y-4">
                    <div className="flex space-x-1">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <Tabs defaultValue="events" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="events">
                        Événements ({content.events.length})
                      </TabsTrigger>
                      <TabsTrigger value="places">
                        Commerces ({content.places.length})
                      </TabsTrigger>
                      <TabsTrigger value="posts">
                        Articles ({content.posts.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="events" className="mt-6">
                      <ContentSelector
                        items={content.events}
                        selectedIds={formData.includedEvents}
                        onToggle={toggleEvent}
                        type="event"
                      />
                    </TabsContent>
                    
                    <TabsContent value="places" className="mt-6">
                      <ContentSelector
                        items={content.places}
                        selectedIds={formData.includedPlaces}
                        onToggle={togglePlace}
                        type="place"
                      />
                    </TabsContent>
                    
                    <TabsContent value="posts" className="mt-6">
                      <ContentSelector
                        items={content.posts}
                        selectedIds={formData.includedPosts}
                        onToggle={togglePost}
                        type="post"
                      />
                    </TabsContent>
                  </Tabs>
                )}
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

            {/* Attachments */}
            <AttachmentManager
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <NewsletterPreview
                  campaignTitle={formData.title || "Aperçu de la campagne"}
                  subject={formData.subject || "Sujet de l'email"}
                  content={formData.content}
                  selectedEvents={content.events.filter(e => formData.includedEvents.includes(e.id))}
                  selectedPlaces={content.places.filter(p => formData.includedPlaces.includes(p.id))}
                  selectedPosts={content.posts.filter(p => formData.includedPosts.includes(p.id))}
                  attachments={attachments}
                />
                
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
                  <Label htmlFor="scheduledAt">Date d&apos;envoi (optionnel)</Label>
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
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Aperçu des destinataires
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contentLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Abonnés actifs :
                      </span>
                      <span className="font-medium text-blue-600">
                        {stats.totalSubscribers}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Événements sélectionnés :</span>
                      <span className="font-medium">
                        {formData.includedEvents.length} / {stats.eventsCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Commerces sélectionnés :</span>
                      <span className="font-medium">
                        {formData.includedPlaces.length} / {stats.placesCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Articles sélectionnés :</span>
                      <span className="font-medium">
                        {formData.includedPosts.length} / {stats.postsCount}
                      </span>
                    </div>
                    
                    {(formData.includedEvents.length + formData.includedPlaces.length + formData.includedPosts.length) > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total contenu :</span>
                          <span className="text-green-600">
                            {formData.includedEvents.length + formData.includedPlaces.length + formData.includedPosts.length} éléments
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}