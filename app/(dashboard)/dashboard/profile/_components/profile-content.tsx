"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Star,
  Trophy,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import ProfileEditForm from "./profile-edit-form";
import BadgeCollection from "./badge-collection";

interface UserData {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  status: string;
  slug?: string | null;
  createdAt: string | Date;
  lastLoginAt?: string;
  profile?: {
    firstname?: string;
    lastname?: string;
    bio?: string;
    phone?: string;
    address?: string;
    language?: string;
    timezone?: string;
    isPublic: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
  badges: Array<{
    id: string;
    earnedAt: string;
    reason?: string;
    isVisible: boolean;
    badge: {
      id: string;
      title: string;
      description: string;
      iconUrl?: string;
      color?: string;
      category: string;
      rarity: string;
    };
  }>;
  _count: {
    posts: number;
    sessions: number;
  };
}

interface ProfileContentProps {
  user: UserData;
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(user);

  const handleProfileUpdate = (updatedUser: any) => {
    setUserData(updatedUser);
    setIsEditing(false);
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: "Administrateur",
      moderator: "Modérateur",
      dpo: "Délégué à la protection des données",
      editor: "Éditeur",
      user: "Utilisateur"
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants = {
      admin: "destructive",
      moderator: "secondary",
      dpo: "outline",
      editor: "default",
      user: "secondary",
    } as const;
    return variants[role as keyof typeof variants] || "secondary";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: "text-green-600",
      INACTIVE: "text-gray-500",
      SUSPENDED: "text-orange-500",
      BANNED: "text-red-600",
      PENDING_VERIFICATION: "text-yellow-600",
    };
    return colors[status as keyof typeof colors] || "text-gray-500";
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getDisplayName = () => {
    if (userData.profile?.firstname && userData.profile?.lastname) {
      return `${userData.profile.firstname} ${userData.profile.lastname}`;
    }
    return userData.name;
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      COMMON: "text-gray-600",
      UNCOMMON: "text-green-600",
      RARE: "text-blue-600",
      EPIC: "text-purple-600",
      LEGENDARY: "text-yellow-600",
    };
    return colors[rarity as keyof typeof colors] || "text-gray-600";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête du profil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={`/api/avatar/${userData.id}`} />
              <AvatarFallback className="text-lg">
                {getDisplayName().slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{getDisplayName()}</h1>
                <Badge variant={getRoleBadgeVariant(userData.role)}>
                  {getRoleLabel(userData.role)}
                </Badge>
                {!userData.emailVerified && (
                  <Badge variant="outline" className="text-orange-600">
                    Email non vérifié
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>@{userData.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{userData.profile?.showEmail || userData.role === "admin" ? userData.email : "Email masqué"}</span>
                </div>
                {userData.profile?.phone && (userData.profile.showPhone || userData.role === "admin") && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{userData.profile.phone}</span>
                  </div>
                )}
                {userData.profile?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{userData.profile.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Membre depuis le {formatDate(userData.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2"
              >
                {isEditing ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Annuler
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    Modifier le profil
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userData.badges.length}</div>
              <div className="text-sm text-gray-600">Badges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userData._count.posts}</div>
              <div className="text-sm text-gray-600">Publications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userData._count.sessions}</div>
              <div className="text-sm text-gray-600">Connexions</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(userData.status)}`}>
                {userData.status === "ACTIVE" ? "Actif" : "Inactif"}
              </div>
              <div className="text-sm text-gray-600">Statut</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu en onglets */}
      <Tabs defaultValue={isEditing ? "edit" : "overview"} value={isEditing ? "edit" : undefined}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="badges">Badges ({userData.badges.length})</TabsTrigger>
          <TabsTrigger value="edit" disabled={!isEditing}>Modifier</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData.profile?.bio ? (
                <div>
                  <h4 className="font-medium mb-2">Biographie</h4>
                  <p className="text-gray-600">{userData.profile.bio}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">Aucune biographie ajoutée</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium mb-1">Langue</h4>
                  <p className="text-gray-600">{userData.profile?.language || "Français"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Fuseau horaire</h4>
                  <p className="text-gray-600">{userData.profile?.timezone || "Europe/Paris"}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Confidentialité</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Profil public</span>
                    <Badge variant={userData.profile?.isPublic ? "default" : "secondary"}>
                      {userData.profile?.isPublic ? "Oui" : "Non"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email visible</span>
                    <Badge variant={userData.profile?.showEmail ? "default" : "secondary"}>
                      {userData.profile?.showEmail ? "Oui" : "Non"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Téléphone visible</span>
                    <Badge variant={userData.profile?.showPhone ? "default" : "secondary"}>
                      {userData.profile?.showPhone ? "Oui" : "Non"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu des badges récents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Badges récents
              </CardTitle>
              <CardDescription>
                Vos derniers badges obtenus
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userData.badges.slice(0, 6).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {userData.badges.slice(0, 6).map((userBadge) => (
                    <div
                      key={userBadge.id}
                      className="text-center p-3 rounded-lg border"
                      style={{ borderColor: userBadge.badge.color || "#3B82F6" }}
                    >
                      <div 
                        className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: userBadge.badge.color || "#3B82F6" }}
                      >
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div className="text-xs font-medium truncate" title={userBadge.badge.title}>
                        {userBadge.badge.title}
                      </div>
                      <div className={`text-xs ${getRarityColor(userBadge.badge.rarity)}`}>
                        {userBadge.badge.rarity}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-8">
                  Aucun badge obtenu pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="badges">
          <BadgeCollection badges={userData.badges} />
        </TabsContent>
        
        <TabsContent value="edit">
          <ProfileEditForm 
            user={userData} 
            onUpdate={handleProfileUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}