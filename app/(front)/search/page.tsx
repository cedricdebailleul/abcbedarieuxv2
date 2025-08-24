"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Calendar,
  FileText,
  Target,
  Filter,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
// import { normalizeForSearch } from "@/lib/share-utils";
import Image from "next/image";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  description?: string;
  summary?: string;
  coverImage?: string;
  type: "place" | "event" | "action" | "post";
  createdAt: string;
  updatedAt: string;
}

const categoryConfig = {
  place: {
    label: "Établissements",
    icon: MapPin,
    color: "text-blue-600 bg-blue-50",
  },
  event: {
    label: "Événements",
    icon: Calendar,
    color: "text-green-600 bg-green-50",
  },
  action: {
    label: "Actions",
    icon: Target,
    color: "text-purple-600 bg-purple-50",
  },
  post: {
    label: "Articles",
    icon: FileText,
    color: "text-orange-600 bg-orange-50",
  },
};

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("categories")?.split(",").filter(Boolean) || []
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Mapping entre les types singuliers (affichage) et pluriels (API)
  const typeMapping = useMemo(
    () => ({
      place: "places",
      event: "events",
      action: "actions",
      post: "posts",
    }),
    []
  );

  const performSearch = useCallback(
    async (searchQuery?: string, categories?: string[]) => {
      const finalQuery = searchQuery ?? query;
      const finalCategories = categories ?? selectedCategories;

      if (!finalQuery.trim()) return;

      setLoading(true);
      setHasSearched(true);

      try {
        const searchParams = new URLSearchParams();
        // Normaliser la requête pour ignorer les accents
        searchParams.set("q", finalQuery);

        if (finalCategories.length > 0) {
          // Convertir les types singuliers en pluriels pour l'API
          const apiCategories = finalCategories.map(
            (cat) => typeMapping[cat as keyof typeof typeMapping] || cat
          );
          searchParams.set("categories", apiCategories.join(","));
        }

        const response = await fetch(`/api/search?${searchParams.toString()}`);
        const data = await response.json();

        if (response.ok) {
          setResults(data.results || []);
        } else {
          console.error("Search error:", data.error);
          setResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [query, selectedCategories, typeMapping]
  ); // Supprimer query et selectedCategories des dépendances

  useEffect(() => {
    const searchQuery = searchParams.get("q");
    const categories =
      searchParams.get("categories")?.split(",").filter(Boolean) || [];

    if (searchQuery) {
      setQuery(searchQuery);
      setSelectedCategories(categories);

      // Faire la recherche directement ici pour éviter la dépendance sur performSearch
      setLoading(true);
      setHasSearched(true);

      const doSearch = async () => {
        try {
          const searchParams = new URLSearchParams();
          searchParams.set("q", searchQuery);

          if (categories.length > 0) {
            const apiCategories = categories.map(
              (cat) => typeMapping[cat as keyof typeof typeMapping] || cat
            );
            searchParams.set("categories", apiCategories.join(","));
          }

          const response = await fetch(
            `/api/search?${searchParams.toString()}`
          );
          const data = await response.json();

          if (response.ok) {
            setResults(data.results || []);
          } else {
            console.error("Search error:", data.error);
            setResults([]);
          }
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      };

      doSearch();
    }
  }, [searchParams, typeMapping]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, selectedCategories);
  };

  // Mapping entre les types singuliers (affichage) et pluriels (API)

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newCategories);
    if (query.trim()) {
      performSearch(query, newCategories);
    }
  };

  const removeCategory = (category: string) => {
    const newCategories = selectedCategories.filter((c) => c !== category);
    setSelectedCategories(newCategories);
    if (query.trim()) {
      performSearch(query, newCategories);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    if (query.trim()) {
      performSearch(query, []);
    }
  };

  const getResultHref = (result: SearchResult) => {
    switch (result.type) {
      case "place":
        return `/places/${result.slug}`;
      case "event":
        return `/events/${result.slug}`;
      case "action":
        return `/actions/${result.slug}`;
      case "post":
        return `/articles/${result.slug}`;
      default:
        return "#";
    }
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const config = categoryConfig[
      result.type as keyof typeof categoryConfig
    ] || {
      label: "Contenu",
      icon: FileText,
      color: "text-gray-600 bg-gray-50",
    };

    const IconComponent = config.icon;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
                config.color
              )}
            >
              <IconComponent className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
              </div>

              <h3 className="font-semibold text-lg mb-2 hover:text-primary">
                <Link href={getResultHref(result)}>{result.title}</Link>
              </h3>

              {(result.summary || result.description) && (
                <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                  {result.summary || result.description}
                </p>
              )}

              <div className="text-xs text-muted-foreground">
                {new Date(result.updatedAt).toLocaleDateString("fr-FR")}
              </div>
            </div>

            {result.coverImage && (
              <div className="w-20 h-20 flex-shrink-0">
                <Image
                  src={result.coverImage}
                  alt={result.title}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Recherche</h1>

          {/* Search Form */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher sur ABC Bédarieux..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={!query.trim() || loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Recherche...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Rechercher
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Filtres:
                    </span>
                    {Object.entries(categoryConfig).map(([key, config]) => {
                      const IconComponent = config.icon;
                      const isSelected = selectedCategories.includes(key);

                      return (
                        <Button
                          key={key}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCategory(key)}
                          className="h-8"
                        >
                          <IconComponent className="h-3 w-3 mr-1" />
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Filters */}
                {selectedCategories.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Catégories sélectionnées:
                    </span>
                    {selectedCategories.map((category) => {
                      const config =
                        categoryConfig[category as keyof typeof categoryConfig];
                      return config ? (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="cursor-pointer hover:bg-gray-200"
                          onClick={() => removeCategory(category)}
                        >
                          {config.label}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ) : null;
                    })}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-6 px-2 text-xs"
                    >
                      Tout effacer
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Recherche en cours...</p>
          </div>
        )}

        {!loading && hasSearched && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">
                Résultats de recherche
                {query && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    pour &quot;{query}&quot;
                  </span>
                )}
              </h2>
              <p className="text-muted-foreground">
                {results.length} résultat{results.length !== 1 ? "s" : ""}{" "}
                trouvé{results.length !== 1 ? "s" : ""}
                {selectedCategories.length > 0 && (
                  <span>
                    {" "}
                    dans {selectedCategories.length} catégorie
                    {selectedCategories.length > 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>

            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result) => (
                  <ResultCard
                    key={`${result.type}-${result.id}`}
                    result={result}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucun résultat trouvé
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Essayez avec d&apos;autres mots-clés ou modifiez vos
                    filtres.
                  </p>
                  <Button variant="outline" onClick={clearAllFilters}>
                    Effacer les filtres
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!hasSearched && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Commencez votre recherche
              </h3>
              <p className="text-muted-foreground">
                Saisissez des mots-clés pour rechercher dans nos établissements,
                événements, actions et articles.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">Recherche</h1>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
