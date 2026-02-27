"use client";

import {
  Calendar,
  Store,
  Briefcase,
  LucideLightbulb,
  MapPin} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicSearch } from "@/components/search/dynamic-search";
import { EventsSlider } from "@/components/events/events-slider";

interface Event {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  startDate: Date;
  coverImage?: string | null;
  location: string | null;
  category: string;
  price: number | null;
  maxParticipants: number | null;
  place?: {
    name: string;
    street: string;
    city: string;
  } | null;
}

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  helpTitle?: string;
  searchPlaceholder?: string;
  upcomingEvents?: Event[];
}

const helpCards = [
  {
    title: "Places",
    description: "Découvrez tous les établissements de Bédarieux",
    subtitle: "Explorer les lieux",
    link: "/places",
    bgColor: "bg-gray-800",
  },
  {
    title: "Événements",
    description: "Participez aux événements locaux et animations",
    subtitle: "Voir le calendrier",
    link: "/events",
    bgColor: "bg-gray-800",
  },
];

export default function Hero({
  title = "Association Bédaricienne des Commerçants",
  subtitle = "Explorez nos initiatives et participez à nos événements pour soutenir le commerce local.",
  ctaText = "Voir tous les événements",
  ctaLink = "/events",
  helpTitle = "Comment pouvons-nous vous aider aujourd'hui?",
  searchPlaceholder = "Rechercher un lieu, événement, catégorie...",
  upcomingEvents = [],
}: HeroProps) {
  return (
    <section className="py-16 relative container mx-auto px-8">
      <div className="space-y-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Section - Anniversary Content with Image */}
          <div className="relative flex flex-col justify-between h-full">
            <div className="space-y-8 mb-8 lg:mb-8">
              <h1 className="text-4xl font-bold leading-tight text-primary">
                {title}
              </h1>
              <p className="text-xl text-gray-600 font-medium">{subtitle}</p>
              <Button
                asChild
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-10 py-6 h-10"
              >
                <Link href={ctaLink}>{ctaText}</Link>
              </Button>
            </div>

            {/* Slider des événements */}
            <EventsSlider events={upcomingEvents} />
          </div>

          {/* Right Section - Help Card */}
          <div className="flex flex-col h-full">
            <div className="bg-gray-900 text-white rounded-3xl px-6 py-14 space-y-8 h-full">
              <div className="flex mb-4 gap-2 pb-4">
                <h2 className="text-white text-2xl font-semibold">
                  {helpTitle}
                </h2>
                <div className="border-b border-gray-700 border-dashed pb-6">
                  <div className="text-sm flex items-center gap-2 text-white/80 mb-2">
                    <LucideLightbulb className="size-6" />
                    <span className="uppercase">Suggestions d&apos;aide</span>
                  </div>
                  <p>
                    Essayez des mots-clés tels que anniversaire, cadeau,
                    surprise
                  </p>
                </div>
              </div>
              {/* Search Form Dynamic */}
              <DynamicSearch placeholder={searchPlaceholder} />

              {/* Help Cards - Stacked Vertically */}
              <div className="flex lg:flex-col gap-3 justify-between">
                {helpCards.map((card, index) => (
                  <Link
                    key={index}
                    href={card.link}
                    className={`block ${card.bgColor} rounded-2xl p-4 border border-gray-600 hover:opacity-90 transition-opacity`}
                  >
                    <div className="text-white/80 text-xs font-medium mb-1">
                      <Badge className="bg-orange-100 text-gray-900 rounded-2xl px-4 py-1 mb-3">
                        {card.title}
                      </Badge>
                    </div>
                    <div className="text-white text-sm font-semibold mb-2">
                      {card.description}
                    </div>
                    <div className="text-white/50 text-xs">{card.subtitle}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          <div className="flex items-start bg-gray-800 space-x-2 rounded-full w-full p-4">
            <Link href="/places" className="flex items-center gap-2">
              <span className="bg-gray-900 p-3 rounded-full text-white">
                <MapPin className="size-5 text-white" />
              </span>
              <span className="text-white">Les lieux & activités</span>
            </Link>
          </div>
          <div className="flex items-start bg-gray-800 space-x-2 rounded-full w-full p-4">
            <Link href="/events" className="flex items-center gap-2">
              <span className="bg-gray-900 p-3 rounded-full text-white">
                <Calendar className="size-5 text-white" />
              </span>
              <span className="text-white">Événements</span>
            </Link>
          </div>
          <div className="flex items-start bg-gray-800 space-x-2 rounded-full w-full p-4">
            <Link href="/categories" className="flex items-center gap-2">
              <span className="bg-gray-900 p-3 rounded-full text-white">
                <Store className="size-5 text-white" />
              </span>
              <span className="text-white">Catégories</span>
            </Link>
          </div>
          <div className="flex items-start bg-gray-800 space-x-2 rounded-full w-full p-4">
            <Link href="/carte" className="flex items-center gap-2">
              <span className="bg-gray-900 p-3 rounded-full text-white">
                <Briefcase className="size-5 text-white" />
              </span>
              <span className="text-white">Carte</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
