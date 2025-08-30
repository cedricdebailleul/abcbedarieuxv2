"use client";

import { Search, Calendar, Users, MapPin } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SearchResult {
  id: string;
  name: string;
  description?: string;
  type: "place" | "event" | "category";
  slug: string;
  category?: string;
  location?: string;
  date?: string;
}

interface DynamicSearchProps {
  placeholder?: string;
  className?: string;
}

export function DynamicSearch({
  placeholder = "Rechercher un lieu, événement, catégorie...",
  className = "",
}: DynamicSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  // Fermer les résultats quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fonction de recherche avec debounce
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Erreur de recherche:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce de la recherche
  const handleInputChange = (value: string) => {
    setQuery(value);

    // Annuler la recherche précédente
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Nouvelle recherche après 300ms
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Rediriger vers la page de recherche complète
      window.location.href = `/recherche?q=${encodeURIComponent(query)}`;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "place":
        return <MapPin className="w-4 h-4 text-blue-500" />;
      case "event":
        return <Calendar className="w-4 h-4 text-green-500" />;
      case "category":
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case "place":
        return `/places/${result.slug}`;
      case "event":
        return `/events/${result.slug}`;
      case "category":
        return `/categories/${result.slug}`;
      default:
        return "#";
    }
  };

  const getResultLabel = (type: string) => {
    switch (type) {
      case "place":
        return "Établissement";
      case "event":
        return "Événement";
      case "category":
        return "Catégorie";
      default:
        return "";
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="pl-12 bg-white border-0 text-gray-900 placeholder:text-gray-500 rounded-full h-12 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {/* Résultats de recherche */}
      {showResults && (
        <Card className="absolute top-14 left-0 right-0 z-50 max-h-96 overflow-y-auto shadow-xl">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
              <span className="ml-2">Recherche...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={getResultLink(result)}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowResults(false)}
                >
                  <div className="flex items-start gap-3">
                    {getResultIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">
                          {result.name}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {getResultLabel(result.type)}
                        </span>
                      </div>
                      {result.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {result.description}
                        </p>
                      )}
                      {result.location && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {result.location}
                        </p>
                      )}
                      {result.date && (
                        <p className="text-xs text-gray-500 mt-1">
                          📅 {result.date}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {/* Lien vers recherche complète */}
              <div className="border-t mt-2 pt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    window.location.href = `/recherche?q=${encodeURIComponent(
                      query
                    )}`;
                  }}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Voir tous les résultats pour &quot;{query}&quot;
                </Button>
              </div>
            </div>
          ) : query.length > 2 ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Aucun résultat trouvé pour &quot;{query}&quot;</p>
              <p className="text-sm mt-1">
                Essayez avec d&apos;autres mots-clés
              </p>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
