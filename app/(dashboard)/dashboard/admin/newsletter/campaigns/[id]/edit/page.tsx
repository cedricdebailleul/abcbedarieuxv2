"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Users,
  Calendar,
  Edit3,
} from "lucide-react";
import { useAvailableContent } from "../../_hooks/useAvailableContent";
import { ContentSelector } from "../../_components/ContentSelector";
import {
  AttachmentManager,
  type Attachment,
} from "../../_components/AttachmentManager";
import { NewsletterPreview } from "../../_components/NewsletterPreview";

interface CampaignData {
  id: string;
  title: string;
  subject: string;
  content: string;
  type: string;
  status: string;
  scheduledAt?: string;
  includedEvents: string[];
  includedPlaces: string[];
  includedPosts: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  totalRecipients: number;
}

interface EditCampaignPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(true);

  // Utiliser le hook pour récupérer le contenu dynamique
  const {
    content,
    loading: contentLoading,
    error: contentError,
    refetch,
  } = useAvailableContent();

  const [formData, setFormData] = useState<{
    title: string;
    subject: string;
    type:
      | "NEWSLETTER"
      | "ANNOUNCEMENT"
      | "EVENT_DIGEST"
      | "PLACE_UPDATE"
      | "PROMOTIONAL";
    content: string;
    includedEvents: string[];
    includedPlaces: string[];
    includedPosts: string[];
    scheduledAt: string;
  }>({
    title: "",
    subject: "",
    type: "NEWSLETTER",
    content: "",
    includedEvents: [],
    includedPlaces: [],
    includedPosts: [],
    scheduledAt: "",
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Charger les données de la campagne
  useEffect(() => {
    async function loadCampaign() {
      try {
        setCampaignLoading(true);
        const response = await fetch(`/api/admin/newsletter/campaigns/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors du chargement");
        }

        if (data.campaign) {
          setCampaign(data.campaign);
          setFormData({
            title: data.campaign.title,
            subject: data.campaign.subject,
            type: data.campaign.type,
            content: data.campaign.content,
            includedEvents: data.campaign.includedEvents || [],
            includedPlaces: data.campaign.includedPlaces || [],
            includedPosts: data.campaign.includedPosts || [],
            scheduledAt: data.campaign.scheduledAt
              ? new Date(data.campaign.scheduledAt).toISOString().slice(0, 16)
              : "",
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
      } finally {
        setCampaignLoading(false);
      }
    }

    if (id) {
      loadCampaign();
    }
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/newsletter/campaigns/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          attachments: attachments.filter((a) => a.uploaded),
          scheduledAt: formData.scheduledAt || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      // Rediriger vers la page de détails
      router.push(`/dashboard/admin/newsletter/campaigns/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      includedEvents: prev.includedEvents.includes(eventId)
        ? prev.includedEvents.filter((id) => id !== eventId)
        : [...prev.includedEvents, eventId],
    }));
  };

  const togglePlace = (placeId: string) => {
    setFormData((prev) => ({
      ...prev,
      includedPlaces: prev.includedPlaces.includes(placeId)
        ? prev.includedPlaces.filter((id) => id !== placeId)
        : [...prev.includedPlaces, placeId],
    }));
  };

  const togglePost = (postId: string) => {
    setFormData((prev) => ({
      ...prev,
      includedPosts: prev.includedPosts.includes(postId)
        ? prev.includedPosts.filter((id) => id !== postId)
        : [...prev.includedPosts, postId],
    }));
  };

  if (campaignLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-20 w-full" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Campagne non trouvée ou erreur lors du chargement.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  if (campaign.status !== "DRAFT") {
    return (
      <div className="space-y-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Seules les campagnes en brouillon peuvent être modifiées. Cette
            campagne a le statut :{" "}
            <Badge variant="outline">{campaign.status}</Badge>
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold">Modifier la campagne</h1>
          </div>
          <p className="text-muted-foreground">
            {campaign.title} • Créée le{" "}
            {new Date(campaign.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={campaign.status === "DRAFT" ? "secondary" : "default"}
          >
            {campaign.status}
          </Badge>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
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
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de la campagne *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Newsletter du mois de septembre"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Objet de l&apos;email *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    placeholder="🎉 Découvrez les nouveautés de Bédarieux"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type de campagne</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(
                      value:
                        | "NEWSLETTER"
                        | "ANNOUNCEMENT"
                        | "EVENT_DIGEST"
                        | "PLACE_UPDATE"
                        | "PROMOTIONAL"
                    ) => setFormData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEWSLETTER">
                        Newsletter régulière
                      </SelectItem>
                      <SelectItem value="ANNOUNCEMENT">
                        Annonce spéciale
                      </SelectItem>
                      <SelectItem value="EVENT_DIGEST">
                        Digest d&apos;événements
                      </SelectItem>
                      <SelectItem value="PLACE_UPDATE">
                        Nouveaux commerces
                      </SelectItem>
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
                  <Label htmlFor="content">
                    Message personnalisé (optionnel)
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
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
                <CardTitle>Aperçu</CardTitle>
              </CardHeader>
              <CardContent>
                <NewsletterPreview
                  campaignTitle={formData.title || campaign.title}
                  subject={formData.subject || campaign.subject}
                  content={formData.content}
                  selectedEvents={content.events.filter((e) =>
                    formData.includedEvents.includes(e.id)
                  )}
                  selectedPlaces={content.places.filter((p) =>
                    formData.includedPlaces.includes(p.id)
                  )}
                  selectedPosts={content.posts.filter((p) =>
                    formData.includedPosts.includes(p.id)
                  )}
                  attachments={attachments}
                />
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Programmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">
                    Date d&apos;envoi (optionnel)
                  </Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduledAt: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Laissez vide pour envoyer immédiatement
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Info Campaign */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Créée par :</span>
                  <span className="font-medium">{campaign.createdBy.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Créée le :</span>
                  <span className="font-medium">
                    {new Date(campaign.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Modifiée le :</span>
                  <span className="font-medium">
                    {new Date(campaign.updatedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Destinataires potentiels :</span>
                  <span className="font-medium text-blue-600">
                    {campaign.totalRecipients}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
