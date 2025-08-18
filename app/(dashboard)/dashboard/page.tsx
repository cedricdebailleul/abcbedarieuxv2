"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionCards } from "@/components/sidebar/section-cards";
import { DynamicChart } from "@/components/dashboard/dynamic-chart";
import { ActivityTable } from "@/components/dashboard/activity-table";
import { ViewsAnalytics } from "@/components/dashboard/views-analytics";
import { IconDashboard, IconEye, IconActivity } from "@tabler/icons-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Toujours afficher les cartes principales */}
      <SectionCards />
      
      {/* Onglets pour les différentes vues */}
      <div className="px-4 lg:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <IconDashboard className="size-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <IconEye className="size-4" />
              Analytique
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <IconActivity className="size-4" />
              Activité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <DynamicChart />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <ViewsAnalytics />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <ActivityTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
