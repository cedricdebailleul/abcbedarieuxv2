"use client";

import {
  Calendar,
  FileText,
  Info,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { PlaceArticlesTab } from "./place-articles-tab";
import { PlaceEventsTab } from "./place-events-tab";
import { PlaceProductsServicesWrapper } from "./place-products-services-wrapper";
import { cn } from "@/lib/utils";

interface PlaceTabsProps {
  placeId: string;
  placeName?: string;
  aboutContent?: React.ReactNode;
  reviewsContent?: React.ReactNode;
  ratingsContent?: React.ReactNode;
  isOwner?: boolean;
  placeType?: string;
}

type TabType =
  | "about"
  | "articles"
  | "events"
  | "products-services"
  | "reviews";

export function PlaceTabs({
  placeId,
  placeName = "",
  aboutContent,
  reviewsContent,
  isOwner = false,
  placeType,
}: PlaceTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("about");

  const allTabs = [
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
      id: "products-services" as TabType,
      label: "Produits & Services",
      icon: ShoppingBag,
    },
    {
      id: "reviews" as TabType,
      label: "Avis",
      icon: MessageSquare,
    },
  ];

  // Filtrer les onglets selon le type de place (mémorisé pour éviter les boucles)
  const tabs = useMemo(() => {
    return allTabs.filter(tab => {
      // Masquer l'onglet "Produits & Services" pour les associations
      if (tab.id === "products-services" && placeType === "ASSOCIATION") {
        return false;
      }
      return true;
    });
  }, [placeType]);

  // Rediriger vers "about" si l'onglet actif n'est plus disponible
  useEffect(() => {
    // Seulement vérifier quand le type de place change
    if (placeType === "ASSOCIATION" && activeTab === "products-services") {
      setActiveTab("about");
    }
  }, [placeType, activeTab]);

  return (
    <div className="space-y-4 sm:space-y-6 relative z-20">
      {/* Navigation des onglets améliorée */}
      <div className="relative z-20">
        <div className="bg-muted/30 rounded-xl p-1">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap flex-shrink-0",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <tab.icon
                  className={cn(
                    "h-4 w-4 transition-colors flex-shrink-0",
                    activeTab === tab.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <span className="font-semibold hidden sm:inline">
                  {tab.label}
                </span>
                <span className="font-semibold sm:hidden text-xs">
                  {tab.label.split(" ")[0]}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu des onglets avec animation */}
      <div className="min-h-[400px] relative z-20">
        <div
          className={cn(
            "transition-opacity duration-200",
            activeTab === "about"
              ? "opacity-100"
              : "opacity-0 absolute pointer-events-none"
          )}
        >
          {activeTab === "about" && aboutContent}
        </div>
        <div
          className={cn(
            "transition-opacity duration-200",
            activeTab === "articles"
              ? "opacity-100"
              : "opacity-0 absolute pointer-events-none"
          )}
        >
          {activeTab === "articles" && <PlaceArticlesTab placeId={placeId} />}
        </div>
        <div
          className={cn(
            "transition-opacity duration-200",
            activeTab === "events"
              ? "opacity-100"
              : "opacity-0 absolute pointer-events-none"
          )}
        >
          {activeTab === "events" && <PlaceEventsTab placeId={placeId} />}
        </div>
        <div
          className={cn(
            "transition-opacity duration-200",
            activeTab === "products-services"
              ? "opacity-100"
              : "opacity-0 absolute pointer-events-none"
          )}
        >
          {activeTab === "products-services" && (
            <PlaceProductsServicesWrapper
              placeId={placeId}
              placeName={placeName}
              isOwner={isOwner}
            />
          )}
        </div>
        <div
          className={cn(
            "transition-opacity duration-200",
            activeTab === "reviews"
              ? "opacity-100"
              : "opacity-0 absolute pointer-events-none"
          )}
        >
          {activeTab === "reviews" && reviewsContent}
        </div>
      </div>
    </div>
  );
}
