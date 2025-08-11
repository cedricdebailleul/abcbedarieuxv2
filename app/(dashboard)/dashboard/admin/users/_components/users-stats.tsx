"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  newUsersThisMonth: number;
  inactiveUsers: number;
}

export default function UsersStats() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    newUsersThisMonth: 0,
    inactiveUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/users/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    color = "text-blue-600" 
  }: {
    title: string;
    value: number;
    description: string;
    icon: React.ElementType;
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>
          {loading ? "-" : value.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <StatCard
        title="Total utilisateurs"
        value={stats.totalUsers}
        description="Tous les utilisateurs"
        icon={Users}
        color="text-blue-600"
      />
      
      <StatCard
        title="Utilisateurs actifs"
        value={stats.activeUsers}
        description="Comptes actifs"
        icon={UserCheck}
        color="text-green-600"
      />

      <StatCard
        title="Nouveaux ce mois"
        value={stats.newUsersThisMonth}
        description="Inscriptions récentes"
        icon={TrendingUp}
        color="text-purple-600"
      />

      <StatCard
        title="Utilisateurs bannis"
        value={stats.bannedUsers}
        description="Comptes suspendus/bannis"
        icon={UserX}
        color="text-red-600"
      />
    </>
  );
}