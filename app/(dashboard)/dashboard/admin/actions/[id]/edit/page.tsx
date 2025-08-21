"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ImageUpload } from "@/components/media/image-upload";
import Image from "next/image";

interface Action {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  summary?: string;
  coverImage?: string;
  gallery: string[];
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  isActive: boolean;
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  metaTitle?: string;
  metaDescription?: string;
  sortOrder: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export default function EditActionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    summary: "",
    coverImage: "",
    gallery: [] as string[],
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED",
    isActive: true,
    isFeatured: false,
    startDate: "",
    endDate: "",
    metaTitle: "",
    metaDescription: "",
    sortOrder: 0,
  });

  const [actionId, setActionId] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setActionId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  const fetchAction = useCallback(async () => {
    if (!actionId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/actions/${actionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Action non trouvée");
          router.push("/dashboard/admin/actions");
          return;
        }
        throw new Error("Erreur lors du chargement");
      }

      const data = await response.json();
      setAction(data);

      // Remplir le formulaire avec les données existantes
      setFormData({
        title: data.title || "",
        description: data.description || "",
        content: data.content || "",
        summary: data.summary || "",
        coverImage: data.coverImage || "",
        gallery: data.gallery || [],
        status: data.status || "DRAFT",
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        startDate: data.startDate
          ? new Date(data.startDate).toISOString().split("T")[0]
          : "",
        endDate: data.endDate
          ? new Date(data.endDate).toISOString().split("T")[0]
          : "",
        metaTitle: data.metaTitle || "",
        metaDescription: data.metaDescription || "",
        sortOrder: data.sortOrder || 0,
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement de l'action");
    } finally {
      setLoading(false);
    }
  }, [actionId, router]);

  useEffect(() => {
    if (actionId) {
      fetchAction();
    }
  }, [actionId, fetchAction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/actions/${actionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la modification");
      }

      const updatedAction = await response.json();
      toast.success("Action modifiée avec succès");
      router.push(`/dashboard/admin/actions/${updatedAction.id}`);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la modification"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number | boolean | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Action non trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/admin/actions/${actionId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Modifier l&apos;action</h1>
          <p className="text-muted-foreground">{action.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Titre de l'action"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Résumé</Label>
                  <Input
                    id="summary"
                    value={formData.summary}
                    onChange={(e) =>
                      handleInputChange("summary", e.target.value)
                    }
                    placeholder="Résumé court (280 caractères max)"
                    maxLength={280}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {formData.summary.length}/280 caractères
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Description de l'action"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Contenu détaillé</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      handleInputChange("content", e.target.value)
                    }
                    placeholder="Contenu détaillé de l'action"
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Image de couverture</Label>
                  <ImageUpload
                    value={formData.coverImage}
                    onChange={(url) => handleInputChange("coverImage", url)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Galerie d&apos;images</Label>
                  <div className="mt-2">
                    <ImageUpload
                      value=""
                      onChange={(url) => {
                        if (url && !formData.gallery.includes(url)) {
                          handleInputChange("gallery", [
                            ...formData.gallery,
                            url,
                          ]);
                        }
                      }}
                    />
                    {formData.gallery.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {formData.gallery.map((url, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={url}
                              alt={`Galerie ${index + 1}`}
                              width={100}
                              height={100}
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const newGallery = formData.gallery.filter(
                                  (_, i) => i !== index
                                );
                                handleInputChange("gallery", newGallery);
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader>
                <CardTitle>Référencement (SEO)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Titre SEO</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      handleInputChange("metaTitle", e.target.value)
                    }
                    placeholder="Titre pour les moteurs de recherche"
                  />
                </div>

                <div>
                  <Label htmlFor="metaDescription">Description SEO</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) =>
                      handleInputChange("metaDescription", e.target.value)
                    }
                    placeholder="Description pour les moteurs de recherche"
                    rows={3}
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
              <CardContent className="space-y-4">
                <Button type="submit" disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Modification..." : "Modifier l'action"}
                </Button>

                {action.status === "PUBLISHED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full"
                  >
                    <Link href={`/actions/${action.slug}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      Voir public
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Statut et visibilité */}
            <Card>
              <CardHeader>
                <CardTitle>Statut et visibilité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(
                      value: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED"
                    ) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Brouillon</SelectItem>
                      <SelectItem value="PUBLISHED">Publié</SelectItem>
                      <SelectItem value="SCHEDULED">Programmé</SelectItem>
                      <SelectItem value="ARCHIVED">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Action active</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleInputChange("isActive", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured">Mise en avant</Label>
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) =>
                      handleInputChange("isFeatured", checked)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="sortOrder">Ordre d&apos;affichage</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      handleInputChange(
                        "sortOrder",
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
