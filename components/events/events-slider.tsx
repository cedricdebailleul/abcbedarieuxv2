"use client";

import { ChevronLeft, ChevronRight, Calendar, MapPin, Euro, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  startDate: Date;
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
      <div className={`relative bg-gradient-to-br from-gray-600 via-gray-500 to-gray-400 rounded-3xl p-8 h-80 overflow-hidden ${className}`}>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <div className="text-2xl font-bold mb-2">Aucun événement à venir</div>
            <div className="text-white/80">Les prochains événements apparaîtront ici</div>
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
      case 'gastronomie':
        return 'from-orange-600 via-red-500 to-pink-400';
      case 'concert':
      case 'musique':
        return 'from-purple-600 via-blue-500 to-teal-400';
      case 'sport':
        return 'from-green-600 via-emerald-500 to-cyan-400';
      case 'culture':
        return 'from-indigo-600 via-purple-500 to-pink-400';
      case 'atelier':
        return 'from-yellow-600 via-orange-500 to-red-400';
      case 'marche':
        return 'from-green-600 via-lime-500 to-yellow-400';
      default:
        return 'from-blue-600 via-indigo-500 to-purple-400';
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
      case 'gastronomie':
        return 'bg-orange-100 text-orange-800';
      case 'concert':
      case 'musique':
        return 'bg-purple-100 text-purple-800';
      case 'sport':
        return 'bg-green-100 text-green-800';
      case 'culture':
        return 'bg-indigo-100 text-indigo-800';
      case 'atelier':
        return 'bg-yellow-100 text-yellow-800';
      case 'marche':
        return 'bg-lime-100 text-lime-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className={`relative bg-gradient-to-br ${getGradientByCategory(currentEvent.category)} rounded-3xl p-8 h-80 overflow-hidden ${className}`}>
      <div className="relative z-10 h-full flex flex-col">
        {/* En-tête avec catégorie */}
        <div className="mb-4">
          <Badge className={`${getCategoryColor(currentEvent.category)} mb-2`}>
            {currentEvent.category}
          </Badge>
          <div className="text-white text-3xl md:text-4xl font-bold mb-2 leading-tight">
            {currentEvent.title}
          </div>
        </div>

        {/* Description */}
        {currentEvent.description && (
          <div className="text-white/90 text-sm mb-4 line-clamp-2">
            {currentEvent.description}
          </div>
        )}

        {/* Informations de l'événement */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="space-y-2 mb-4">
            {/* Date et heure */}
            <div className="flex items-center text-white/90 text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(currentEvent.startDate)} à {formatTime(currentEvent.startDate)}
            </div>
            
            {/* Lieu */}
            {(currentEvent.location || currentEvent.place) && (
              <div className="flex items-center text-white/90 text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                {currentEvent.location || 
                 (currentEvent.place && `${currentEvent.place.name}, ${currentEvent.place.street}`)
                }
              </div>
            )}

            {/* Prix et participants */}
            <div className="flex items-center gap-4 text-white/90 text-sm">
              {currentEvent.price !== null && (
                <div className="flex items-center">
                  <Euro className="w-4 h-4 mr-1" />
                  {currentEvent.price === 0 ? 'Gratuit' : `${currentEvent.price}€`}
                </div>
              )}
              {currentEvent.maxParticipants && (
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {currentEvent.maxParticipants} places
                </div>
              )}
            </div>
          </div>

          {/* Bouton d'action */}
          <div className="mb-4">
            <Button asChild className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full">
              <Link href={`/events/${currentEvent.slug}`}>
                Voir l'événement
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation du slider */}
      {events.length > 1 && (
        <>
          <div className="absolute bottom-4 left-4 flex items-center space-x-4">
            <button
              type="button"
              onClick={prevSlide}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Indicateurs */}
            <div className="flex space-x-2">
              {events.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    setAutoPlay(false);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentSlide === index ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
            
            <button
              type="button"
              onClick={nextSlide}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 right-4 text-white text-sm">
            {currentSlide + 1} / {events.length}
          </div>
        </>
      )}

      {/* Effet de parallax/overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
}