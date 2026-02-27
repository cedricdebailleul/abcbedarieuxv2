"use client";

import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Euro,
  Users,
  MapPin} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface EventsSliderProps {
  events: Event[];
  className?: string;
}

export function EventsSlider({ events, className = "" }: EventsSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-play du slider
  useEffect(() => {
    if (!autoPlay || events.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % events.length);
    }, 5000); // Change toutes les 5 secondes

    return () => clearInterval(interval);
  }, [autoPlay, events.length]);

  if (events.length === 0) {
    return (
      <div
        className={`relative bg-gradient-to-br from-gray-600 via-gray-500 to-gray-400 rounded-3xl p-8 h-80 overflow-hidden ${className}`}
      >
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <div className="text-2xl font-bold mb-2">
              Aucun événement à venir
            </div>
            <div className="text-white/80">
              Les prochains événements apparaîtront ici
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % events.length);
    setAutoPlay(false); // Arrêter l'auto-play quand l'utilisateur interagit
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
    setAutoPlay(false);
  };

  const currentEvent = events[currentSlide];

  // Couleurs de gradient selon la catégorie
  const getGradientByCategory = (category: string) => {
    switch (category?.toLowerCase()) {
      case "gastronomie":
        return "from-orange-600 via-red-500 to-pink-400";
      case "concert":
      case "musique":
        return "from-purple-600 via-blue-500 to-teal-400";
      case "sport":
        return "from-green-600 via-emerald-500 to-cyan-400";
      case "culture":
        return "from-indigo-600 via-purple-500 to-pink-400";
      case "atelier":
        return "from-yellow-600 via-orange-500 to-red-400";
      case "marche":
        return "from-green-600 via-lime-500 to-yellow-400";
      default:
        return "from-blue-600 via-indigo-500 to-purple-400";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "gastronomie":
        return "bg-orange-100 text-orange-800";
      case "concert":
      case "musique":
        return "bg-purple-100 text-purple-800";
      case "sport":
        return "bg-green-100 text-green-800";
      case "culture":
        return "bg-indigo-100 text-indigo-800";
      case "atelier":
        return "bg-yellow-100 text-yellow-800";
      case "marche":
        return "bg-lime-100 text-lime-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div
      className={`relative rounded-3xl p-4 sm:p-8 h-80 overflow-hidden ${
        currentEvent.coverImage ? "bg-gray-900" : `bg-gradient-to-br ${getGradientByCategory(currentEvent.category)}`
      } ${className}`}
    >
      {/* Photo de couverture en fond */}
      {currentEvent.coverImage && (
        <Image
          src={currentEvent.coverImage.startsWith("/") ? currentEvent.coverImage : `/${currentEvent.coverImage}`}
          alt={currentEvent.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      )}

      {/* Overlay sombre pour lisibilité */}
      <div className={`absolute inset-0 pointer-events-none ${
        currentEvent.coverImage
          ? "bg-gradient-to-t from-black/85 via-black/50 to-black/10"
          : "bg-gradient-to-t from-black/30 to-transparent"
      }`} />

      {/* Flèches navigation — côtés gauche/droite centrés verticalement */}
      {events.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Badge catégorie — positionné en absolu en haut à gauche */}
      {currentEvent.category && (
        <div className="absolute top-4 left-4 z-20">
          <Badge className={`${getCategoryColor(currentEvent.category)} text-xs font-semibold`}>
            {currentEvent.category}
          </Badge>
        </div>
      )}

      <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-8 pb-8 sm:pb-6">
        {/* Contenu principal ancré en bas */}
        <div className="space-y-2">
          {/* Titre */}
          <div
            className="text-white text-lg sm:text-2xl font-bold leading-tight"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
          >
            {currentEvent.title}
          </div>

          {/* Infos sur une ligne, bouton en dessous sur mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
              <div className="flex items-center text-white/95 text-xs sm:text-sm drop-shadow-md shrink-0">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 shrink-0" />
                {formatDate(currentEvent.startDate)} · {formatTime(currentEvent.startDate)}
              </div>

              {(currentEvent.location || currentEvent.place) && (
                <div className="flex items-center text-white/95 text-xs sm:text-sm drop-shadow-md min-w-0">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-[150px]">
                    {currentEvent.location ||
                      (currentEvent.place && currentEvent.place.name)}
                  </span>
                </div>
              )}

              {currentEvent.price !== null && (
                <div className="flex items-center text-white/95 text-xs sm:text-sm drop-shadow-md shrink-0">
                  <Euro className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 shrink-0" />
                  {currentEvent.price === 0 ? "Gratuit" : `${currentEvent.price}€`}
                </div>
              )}
            </div>

            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-xs sm:text-sm h-7 sm:h-8 px-3 sm:px-4 border-0 shrink-0 self-start sm:self-auto"
            >
              <Link href={`/events/${currentEvent.slug}`}>
                Voir l&apos;événement
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Dots de navigation en bas au centre */}
      {events.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-20">
          {events.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                setAutoPlay(false);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentSlide === index ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
          <span className="text-white/70 text-xs ml-2">
            {currentSlide + 1}/{events.length}
          </span>
        </div>
      )}
    </div>
  );
}
