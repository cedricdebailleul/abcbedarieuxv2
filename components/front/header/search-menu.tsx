"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Calendar,
  FileText,
  Target,
  Check,
  Loader2} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchCategory {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const searchCategories: SearchCategory[] = [
  {
    value: "places",
    label: "Établissements",
    icon: Search,
    description: "Commerces, restaurants, services",
    color: "text-blue-600 bg-blue-50 hover:bg-blue-100",
  },
  {
    value: "events",
    label: "Événements",
    icon: Calendar,
    description: "Animations, festivités, manifestations",
    color: "text-green-600 bg-green-50 hover:bg-green-100",
  },
  {
    value: "actions",
    label: "Nos Actions",
    icon: Target,
    description: "Initiatives de l'association",
    color: "text-purple-600 bg-purple-50 hover:bg-purple-100",
  },
  {
    value: "posts",
    label: "Articles",
    icon: FileText,
    description: "Actualités et publications",
    color: "text-orange-600 bg-orange-50 hover:bg-orange-100",
  },
];

interface SearchMenuProps {
  className?: string;
}

export function SearchMenu({ className }: SearchMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleCategory = (categoryValue: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryValue)
        ? prev.filter((c) => c !== categoryValue)
        : [...prev, categoryValue]
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // Construire l'URL de recherche avec les catégories sélectionnées
    const searchParams = new URLSearchParams();
    searchParams.set("q", searchQuery.trim());

    if (selectedCategories.length > 0) {
      searchParams.set("categories", selectedCategories.join(","));
    }

    // Rediriger vers la page de recherche
    router.push(`/search?${searchParams.toString()}`);
    setIsOpen(false);
    setIsSearching(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        ref={buttonRef}
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary text-white bg-none size-10 rounded-full hover:bg-primary/90 sm:hover:bg-none transition-colors"
      >
        <Search className="size-6" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 bg-white rounded-lg shadow-xl border border-gray-200 z-[99999] overflow-hidden"
            style={{ 
              right: '-1rem',
              width: '300px',
              transform: 'translateX(-50px)'
            }}
          >
            {/* Header avec barre de recherche */}
            <div className="p-4 border-b border-gray-100">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  {isSearching ? (
                    <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  )}
                  <Input
                    type="text"
                    placeholder="Rechercher sur ABC Bédarieux..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 w-full"
                    autoFocus
                    disabled={isSearching}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!searchQuery.trim() || isSearching}
                >
                  {isSearching ? (
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
              </form>
            </div>

            {/* Filtres par catégorie */}
            <div className="p-4">
              <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
                Filtrer par catégorie
              </div>

              {/* Badges des catégories sélectionnées */}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedCategories.map((categoryValue) => {
                    const category = searchCategories.find(
                      (c) => c.value === categoryValue
                    );
                    return category ? (
                      <Badge
                        key={categoryValue}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-gray-200"
                        onClick={() => toggleCategory(categoryValue)}
                      >
                        {category.label}
                        <button className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setSelectedCategories([])}
                  >
                    Tout effacer
                  </Button>
                </div>
              )}

              <div className="space-y-1">
                {searchCategories.map((category) => {
                  const isSelected = selectedCategories.includes(
                    category.value
                  );
                  return (
                    <button
                      key={category.value}
                      onClick={() => toggleCategory(category.value)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-md w-full text-left transition-colors",
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                          category.color
                        )}
                      >
                        <category.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {category.label}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {category.description}
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer avec info */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              {selectedCategories.length === 0
                ? "Sélectionnez des catégories pour affiner votre recherche"
                : `Recherche dans ${selectedCategories.length} catégorie${
                    selectedCategories.length > 1 ? "s" : ""
                  }`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
