"use client";

import { Calendar, FileText, Info, MessageSquare, Star } from "lucide-react";
import { useState } from "react";
import { PlaceArticlesTab } from "./place-articles-tab";
import { PlaceEventsTab } from "./place-events-tab";
import { cn } from "@/lib/utils";

interface PlaceTabsProps {
  placeId: string;
  aboutContent?: React.ReactNode;
  reviewsContent?: React.ReactNode;
  ratingsContent?: React.ReactNode;
}

type TabType = "about" | "articles" | "events" | "reviews" | "ratings";

export function PlaceTabs({ 
  placeId, 
  aboutContent, 
  reviewsContent, 
  ratingsContent 
}: PlaceTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("about");

  const tabs = [
    {
      id: "about" as TabType,
      label: "À propos",
      icon: Info,
    },
    {
      id: "articles" as TabType,
      label: "Articles",
      icon: FileText,
    },
    {
      id: "events" as TabType,
      label: "Événements",
      icon: Calendar,
    },
    {
      id: "reviews" as TabType,
      label: "Avis",
      icon: MessageSquare,
    },
    {
      id: "ratings" as TabType,
      label: "Notes",
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation des onglets améliorée */}
      <div className="relative">
        <div className="bg-muted/30 rounded-xl p-1">
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <tab.icon className={cn(
                  "h-4 w-4 transition-colors",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="font-semibold">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu des onglets avec animation */}
      <div className="min-h-[400px]">
        <div className={cn(
          "transition-opacity duration-200",
          activeTab === "about" ? "opacity-100" : "opacity-0 absolute pointer-events-none"
        )}>
          {activeTab === "about" && aboutContent}
        </div>
        <div className={cn(
          "transition-opacity duration-200",
          activeTab === "articles" ? "opacity-100" : "opacity-0 absolute pointer-events-none"
        )}>
          {activeTab === "articles" && <PlaceArticlesTab placeId={placeId} />}
        </div>
        <div className={cn(
          "transition-opacity duration-200",
          activeTab === "events" ? "opacity-100" : "opacity-0 absolute pointer-events-none"
        )}>
          {activeTab === "events" && <PlaceEventsTab placeId={placeId} />}
        </div>
        <div className={cn(
          "transition-opacity duration-200",
          activeTab === "reviews" ? "opacity-100" : "opacity-0 absolute pointer-events-none"
        )}>
          {activeTab === "reviews" && reviewsContent}
        </div>
        <div className={cn(
          "transition-opacity duration-200",
          activeTab === "ratings" ? "opacity-100" : "opacity-0 absolute pointer-events-none"
        )}>
          {activeTab === "ratings" && (
            ratingsContent || (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Système de notation</h3>
                <p className="text-muted-foreground">
                  Le système de notation sera disponible prochainement.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}