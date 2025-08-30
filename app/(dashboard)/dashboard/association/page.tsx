"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import {
  IconUsers,
  IconBell,
  IconCalendar,
  IconEye,
  IconDownload,
  IconUserCheck,
  IconFileText} from "@tabler/icons-react";

interface Bulletin {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  meeting?: {
    id: string;
    title: string;
    scheduledAt: string;
  };
}

interface Member {
  id: string;
  membershipNumber: string;
  status: string;
  membershipDate: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: {
    name: string;
  };
}

interface AssociationStats {
  totalMembers: number;
  activeMembers: number;
  recentBulletins: number;
  publicDocuments: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  bulletinId: string;
  isRead: boolean;
  readAt?: string | null;
}

export default function AssociationPage() {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<AssociationStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Charger les bulletins publiés
  const fetchPublishedBulletins = useCallback(async () => {
    try {
      const response = await fetch("/api/association/bulletins");
      if (response.ok) {
        const data = await response.json();
        setBulletins(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des bulletins:", error);
    }
  }, []);

  // Charger les membres actifs
  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/association/members");
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
    }
  }, []);

  // Charger les documents publics
  const fetchPublicDocuments = useCallback(async () => {
    try {
      const response = await fetch("/api/association/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
    }
  }, []);

  // Charger les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/association/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  }, []);

  // Charger les notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/association/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPublishedBulletins(),
        fetchMembers(),
        fetchPublicDocuments(),
        fetchStats(),
        fetchNotifications(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchPublishedBulletins, fetchMembers, fetchPublicDocuments, fetchStats, fetchNotifications]);

  // Fonction pour basculer le statut de lecture d'une notification
  const toggleNotificationRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/association/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
          action: "toggle",
        }),
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: !notification.isRead, readAt: !notification.isRead ? new Date().toISOString() : null }
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification:", error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Association ABC Bédarieux</h1>
        <p className="text-muted-foreground mt-2">
          Espace membres - Informations, bulletins et documents
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <IconUsers className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                  <p className="text-sm text-muted-foreground">Membres total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <IconUserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeMembers}</p>
                  <p className="text-sm text-muted-foreground">Membres actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <IconBell className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.recentBulletins}</p>
                  <p className="text-sm text-muted-foreground">Bulletins récents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <IconFileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.publicDocuments}</p>
                  <p className="text-sm text-muted-foreground">Documents publics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconBell className="h-5 w-5" />
              <span>Notifications récentes</span>
              <Badge variant="secondary">
                {notifications.filter(n => !n.isRead).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                    notification.isRead 
                      ? "bg-muted/30 border-muted" 
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium ${
                        notification.isRead ? "text-muted-foreground" : "text-foreground"
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      notification.isRead ? "text-muted-foreground" : "text-foreground"
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleNotificationRead(notification.id)}
                      className={`${
                        notification.isRead 
                          ? "text-muted-foreground hover:text-blue-600" 
                          : "text-blue-600"
                      }`}
                    >
                      <IconEye className="h-4 w-4" />
                    </Button>
                    {notification.type === "NEW_BULLETIN" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const bulletin = bulletins.find(b => b.id === notification.bulletinId);
                          if (bulletin) setSelectedBulletin(bulletin);
                        }}
                      >
                        <IconFileText className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bulletins récents */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IconBell className="h-5 w-5" />
                <span>Derniers bulletins</span>
                {bulletins.length > 0 && (
                  <Badge variant="secondary">{bulletins.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bulletins.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun bulletin publié pour le moment
                </p>
              ) : (
                <div className="space-y-4">
                  {bulletins.slice(0, 5).map((bulletin) => (
                    <div
                      key={bulletin.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{bulletin.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Par {bulletin.createdBy.name} •{" "}
                            {new Date(bulletin.publishedAt || bulletin.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                          {bulletin.meeting && (
                            <div className="flex items-center space-x-1 mt-2 text-sm text-blue-600">
                              <IconCalendar className="h-4 w-4" />
                              <span>Réunion: {bulletin.meeting.title}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBulletin(bulletin)}
                        >
                          <IconEye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents publics */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IconFileText className="h-5 w-5" />
                <span>Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun document public disponible
                </p>
              ) : (
                <div className="space-y-3">
                  {documents.slice(0, 8).map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{document.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(document.fileSize)} • {" "}
                          {new Date(document.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/api/association/documents/${document.id}/download`, '_blank')}
                      >
                        <IconDownload className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Liste des membres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconUsers className="h-5 w-5" />
            <span>Membres de l&apos;association</span>
            <Badge variant="secondary">{members.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun membre trouvé
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        #{member.membershipNumber}
                      </p>
                      <Badge 
                        variant={member.status === "ACTIVE" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {member.status === "ACTIVE" ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog aperçu bulletin */}
      <Dialog
        open={!!selectedBulletin}
        onOpenChange={() => setSelectedBulletin(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBulletin?.title}</DialogTitle>
            <DialogDescription>
              Publié le {selectedBulletin?.publishedAt && 
                new Date(selectedBulletin.publishedAt).toLocaleDateString("fr-FR", {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              } par {selectedBulletin?.createdBy.name}
            </DialogDescription>
          </DialogHeader>
          {selectedBulletin && (
            <div className="space-y-4">
              {selectedBulletin.meeting && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <IconCalendar className="h-4 w-4" />
                    <span>Réunion associée</span>
                  </h3>
                  <p className="mt-2">{selectedBulletin.meeting.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedBulletin.meeting.scheduledAt).toLocaleDateString("fr-FR", {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ 
                  __html: selectedBulletin.content.replace(/\n/g, '<br>')
                }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog fiche membre */}
      <Dialog
        open={!!selectedMember}
        onOpenChange={() => setSelectedMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fiche membre</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.user.image || ""} />
                  <AvatarFallback className="text-lg">
                    {getInitials(selectedMember.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedMember.user.name}</h3>
                  <p className="text-muted-foreground">#{selectedMember.membershipNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={selectedMember.status === "ACTIVE" ? "default" : "secondary"}>
                    {selectedMember.status === "ACTIVE" ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Adhésion</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.membershipDate ? 
                      new Date(selectedMember.membershipDate).toLocaleDateString("fr-FR") : 
                      "Non renseignée"
                    }
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{selectedMember.user.email}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}