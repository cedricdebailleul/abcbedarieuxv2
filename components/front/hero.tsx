"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  LucideLightbulb,
  Book,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  helpTitle?: string;
  searchPlaceholder?: string;
}

const helpCards = [
  {
    title: "Inscription",
    description: "Où puis-je m'inscrire pour devenir membre?",
    subtitle: "Consultez le calendrier",
    link: "/calendrier-des-evenements",
    bgColor: "bg-gray-800",
  },
  {
    title: "Fête des commerçants",
    description:
      "Les commerces de Bédarieux exposent | le 20 septembre rue de la république",
    subtitle: "En savoir plus",
    link: "/calendrier-des-evenements",
    bgColor: "bg-gray-800",
  },
];

export default function Hero({
  title = "Association Bédaricienne des Commerçants",
  subtitle = "Explorez nos initiatives et participez à nos événements pour soutenir le commerce local.",
  ctaText = "Calendrier des événements",
  ctaLink = "/calendrier-des-evenements",
  helpTitle = "Comment pouvons-nous vous aider aujourd'hui?",
  searchPlaceholder = "Lancer une recherche",
}: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("search") as string;
    if (query.trim()) {
      window.location.href = `/recherche?q=${encodeURIComponent(query)}`;
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % 2);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + 2) % 2);
  };

  return (
    <section className="relative mx-auto px-8">
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

            {/* Image 275 avec carrousel */}
            <div className="relative bg-gradient-to-br from-purple-600 via-blue-500 to-teal-400 rounded-3xl p-8 h-80 overflow-hidden">
              <div className="relative z-10">
                <div className="text-white text-5xl font-bold mb-2">
                  Fête des commerçants
                </div>
                <div className="text-white text-2xl font-semibold">
                  Bédarieux
                </div>
                <div className="text-white/80 text-sm mt-2">
                  Le 20 septembre 2025
                  <br />
                  rue de la république
                </div>
              </div>

              {/* Navigation du carrousel */}
              <div className="absolute bottom-4 left-4 flex items-center space-x-4">
                <button
                  onClick={prevSlide}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      currentSlide === 0 ? "bg-white" : "bg-white/50"
                    }`}
                  ></div>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      currentSlide === 1 ? "bg-white" : "bg-white/50"
                    }`}
                  ></div>
                </div>
                <button
                  onClick={nextSlide}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="absolute bottom-4 right-4 text-white text-sm">
                {currentSlide + 1} / 2
              </div>
            </div>
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
              {/* Search Form */}
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    name="search"
                    placeholder={searchPlaceholder}
                    className="pl-12 bg-white border-0 text-gray-900 placeholder:text-gray-500 rounded-full h-12 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </form>

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
          <div className="flex items-start bg-gray-800 space-x-2  rounded-full w-full p-4">
            <Link href="/places" className="flex items-center gap-2 ">
              <span className="bg-gray-900 p-3 rounded-full text-white">
                <Book className="size-5 text-white" />
              </span>
              <span className="text-white">Les lieux & activités</span>
            </Link>
          </div>
          <div className="flex items-start bg-gray-800 space-x-2  rounded-full w-full p-4">
            <Link href="/recherche" className="flex items-center gap-2 ">
              <span className="bg-gray-900 p-3 rounded-full text-white">
                <Book className="size-5 text-white" />
              </span>
              <span>Bibliothèque</span>
            </Link>
          </div>
          <div className="flex items-start bg-gray-800 space-x-2  rounded-full w-full p-4">
            <Link href="/recherche" className="flex items-center gap-2 ">
              <span className="bg-gray-900 p-3 rounded-full text-white">
                <Book className="size-5 text-white" />
              </span>
              <span>Bibliothèque</span>
            </Link>
          </div>
          <div className="flex items-start bg-gray-800 space-x-2  rounded-full w-full p-4">
            <Link href="/recherche" className="flex items-center gap-2 ">
              <span className="bg-gray-900 p-3 rounded-full text-white">
                <Book className="size-5 text-white" />
              </span>
              <span>Bibliothèque</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
