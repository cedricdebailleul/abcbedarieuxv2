"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Menu,
  X,
  MapPin,
  Calendar,
  Star,
  Newspaper,
  Home,
  Info,
  History,
  ExternalLink,
  Grid3X3,
  Map,
  Users,
  FileText,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { NavUser } from "@/components/layout/nav_user";
import Logo from "@/components/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SearchMenu } from "./search-menu";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  icon?: React.ElementType;
  featured?: boolean;
}

interface MenuSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  items: MenuItem[];
  featured?: MenuItem;
}

interface HeaderProps {
  className?: string;
}

const menuData: MenuSection[] = [
  {
    id: "discover",
    title: "Découvrir",
    icon: Home,
    color: "primary",
    items: [
      {
        id: "home",
        label: "Accueil",
        href: "/",
        description: "Retour à la page d'accueil",
        icon: Home,
      },
      {
        id: "about",
        label: "À propos",
        href: "/about",
        description: "En savoir plus sur ABC Bédarieux",
        icon: Info,
      },
      {
        id: "history",
        label: "Notre histoire",
        href: "/histoire",
        description: "Découvrez notre parcours",
        icon: History,
      },
    ],
    featured: {
      id: "newsletter",
      label: "Newsletter",
      href: "/newsletter/subscribe",
      description: "Restez informé de nos actualités",
      icon: FileText,
    },
  },
  {
    id: "places",
    title: "Établissements",
    icon: MapPin,
    color: "blue-600",
    items: [
      {
        id: "all-places",
        label: "Tous les établissements",
        href: "/places",
        description: "Explorez tous nos partenaires",
        icon: MapPin,
        featured: true,
      },
      {
        id: "categories",
        label: "Par catégories",
        href: "/categories",
        description: "Parcourez par type d'activité",
        icon: Grid3X3,
      },
      {
        id: "map",
        label: "Carte interactive",
        href: "/carte",
        description: "Localisez sur la carte",
        icon: Map,
      },
    ],
    featured: {
      id: "popular-places",
      label: "Établissements populaires",
      href: "/places?sort=popular",
      description: "Les plus appréciés de nos partenaires",
      icon: Star,
    },
  },
  {
    id: "events",
    title: "Événements",
    icon: Calendar,
    color: "green-600",
    items: [
      {
        id: "all-events",
        label: "Tous les événements",
        href: "/events",
        description: "Découvrez tous les événements",
        icon: Calendar,
        featured: true,
      },
      {
        id: "simple-events",
        label: "Événements simples",
        href: "/events/simple",
        description: "Événements ponctuels",
        icon: Clock,
      },
    ],
    featured: {
      id: "upcoming",
      label: "Événements à venir",
      href: "/events?filter=upcoming",
      description: "Ne manquez rien de l'actualité",
      icon: Star,
    },
  },
  {
    id: "content",
    title: "Contenu",
    icon: Newspaper,
    color: "orange-600",
    items: [
      {
        id: "articles",
        label: "Articles",
        href: "/articles",
        description: "Nos derniers articles",
        icon: FileText,
      },
      {
        id: "news",
        label: "Actualités",
        href: "/actualites",
        description: "L'actualité de la ville",
        icon: Newspaper,
      },
      {
        id: "actions",
        label: "Nos Actions",
        href: "/actions",
        description: "Découvrez nos initiatives",
        icon: Users,
      },
    ],
    featured: {
      id: "m-loisirs",
      label: "M Loisirs",
      href: "/m-loisirs",
      description: "Le magazine municipal",
      icon: ExternalLink,
    },
  },
];

const quickLinks = [
  { label: "Nous Joindre", href: "/contact" },
  { label: "Support", href: "/support" },
  { label: "FAQ", href: "/faq" },
];

export default function EnhancedHeader({ className }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeMobileSection, setActiveMobileSection] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_focusedItem, setFocusedItem] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const megaMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableElementRef = useRef<HTMLElement | null>(null);
  const lastFocusableElementRef = useRef<HTMLElement | null>(null);

  // État pour l'accessibilité
  const [announceText, setAnnounceText] = useState("");

  // Gestion du scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Gestion des clics extérieurs et navigation clavier
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMegaMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Fermeture avec Escape
      if (event.key === "Escape") {
        closeMegaMenu();
        closeMobileMenu();
        return;
      }

      // Navigation clavier dans le mega menu
      if (isMegaMenuOpen) {
        const focusableElements = menuRef.current?.querySelectorAll(
          'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );

        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;

          firstFocusableElementRef.current = firstElement;
          lastFocusableElementRef.current = lastElement;

          // Gestion du focus circulaire avec Tab
          if (event.key === "Tab") {
            if (event.shiftKey && document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            } else if (
              !event.shiftKey &&
              document.activeElement === lastElement
            ) {
              event.preventDefault();
              firstElement.focus();
            }
          }

          // Navigation avec les flèches dans les sections
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const currentIndex = Array.from(focusableElements).indexOf(
              document.activeElement as HTMLElement
            );

            if (event.key === "ArrowDown") {
              const nextIndex = (currentIndex + 1) % focusableElements.length;
              (focusableElements[nextIndex] as HTMLElement).focus();
            } else {
              const prevIndex =
                currentIndex === 0
                  ? focusableElements.length - 1
                  : currentIndex - 1;
              (focusableElements[prevIndex] as HTMLElement).focus();
            }
          }
        }
      }
    };

    if (isMegaMenuOpen || isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.addEventListener("keydown", handleKeyDown as any);
      document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.removeEventListener("keydown", handleKeyDown as any);
      document.body.style.overflow = "auto";
    };
  }, [isMegaMenuOpen, isMobileMenuOpen]);

  const openMegaMenu = () => {
    setIsMegaMenuOpen(true);
    setIsMobileMenuOpen(false);
    setActiveSection(null);
    setAnnounceText(
      "Menu principal ouvert. Utilisez les flèches pour naviguer entre les sections."
    );

    // Focus automatique sur le premier élément focusable après un court délai
    setTimeout(() => {
      if (firstFocusableElementRef.current) {
        firstFocusableElementRef.current.focus();
      }
    }, 100);
  };

  const closeMegaMenu = () => {
    setIsMegaMenuOpen(false);
    setActiveSection(null);
    setFocusedItem(null);
    setAnnounceText("Menu principal fermé.");
    megaMenuButtonRef.current?.focus();
  };

  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
    setIsMegaMenuOpen(false);
    setAnnounceText("Menu mobile ouvert.");
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveMobileSection(null);
    setAnnounceText("Menu mobile fermé.");
    mobileMenuButtonRef.current?.focus();
  };

  const handleMenuItemClick = () => {
    closeMegaMenu();
    closeMobileMenu();
  };

  const handleSectionHover = (sectionId: string) => {
    if (isMegaMenuOpen) {
      const section = menuData.find((s) => s.id === sectionId);
      setActiveSection(sectionId);
      if (section) {
        setAnnounceText(
          `Section ${section.title} active. ${section.items.length} éléments disponibles.`
        );
      }
    }
  };

  const handleSectionClick = (sectionId: string) => {
    const newActiveSection = activeSection === sectionId ? null : sectionId;
    const section = menuData.find((s) => s.id === sectionId);

    setActiveSection(newActiveSection);

    if (newActiveSection && section) {
      setAnnounceText(
        `Section ${section.title} ouverte. ${section.items.length} options disponibles.`
      );
    } else {
      setAnnounceText("Section fermée.");
    }
  };

  const handleKeyNavigation = (
    event: ReactKeyboardEvent,
    sectionId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSectionClick(sectionId);
    }
  };

  const handleMobileSectionToggle = (sectionId: string) => {
    setActiveMobileSection(activeMobileSection === sectionId ? null : sectionId);
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      primary: "text-primary bg-primary/10 border-primary/20",
      "blue-600": "text-blue-600 bg-blue-50 border-blue-200",
      "green-600": "text-green-600 bg-green-50 border-green-200",
      "orange-600": "text-orange-600 bg-orange-50 border-orange-200",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.primary;
  };

  return (
    <header
      className={cn("fixed top-0 left-0 right-0 z-[9998] bg-white/95 backdrop-blur-sm", className)}
    >
      {/* Main Header */}
      <motion.div
        className="bg-white/95 backdrop-blur-sm shadow-sm transition-all duration-300"
        animate={{
          y: isScrolled ? 0 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
              aria-label="Retour à l'accueil ABC Bédarieux"
            >
              <Logo width={40} height={40} />
            </Link>

            {/* Navigation Desktop */}
            <nav
              className="hidden lg:flex items-center space-x-1"
              role="navigation"
              aria-label="Navigation principale"
            >
              {/* Liens rapides */}
              <div className="flex items-center space-x-1 mr-4">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Mega Menu Button */}
              <button
                ref={megaMenuButtonRef}
                onClick={openMegaMenu}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  "bg-primary text-white hover:bg-primary/90",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  isMegaMenuOpen && "bg-primary/90"
                )}
                aria-expanded={isMegaMenuOpen}
                aria-haspopup="true"
                aria-label="Ouvrir le menu principal"
              >
                <span>Découvrir ABC Bédarieux</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isMegaMenuOpen && "rotate-180"
                  )}
                />
              </button>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center space-x-2">
                <SearchMenu />
                <ThemeToggle variant="navbar" />
                <NavUser />
              </div>

              {/* Mobile Actions (visible on tablet and mobile) */}
              <div className="flex lg:hidden items-center justify-end space-x-3">
                {/* Search Menu */}
                <div className="relative" style={{ zIndex: 99997 }}>
                  <SearchMenu />
                </div>
                
                {/* Theme Toggle */}
                <div className="relative" style={{ zIndex: 99997 }}>
                  <ThemeToggle variant="navbar" />
                </div>
                
                {/* NavUser */}
                <div className="relative" style={{ zIndex: 99997 }}>
                  <NavUser />
                </div>
                
                {/* Mobile Menu Button - Rond comme les autres */}
                <button
                  ref={mobileMenuButtonRef}
                  onClick={isMobileMenuOpen ? closeMobileMenu : openMobileMenu}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full border border-gray-200",
                    "bg-white text-gray-700 hover:text-primary hover:bg-gray-100 transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-sm"
                  )}
                  aria-expanded={isMobileMenuOpen}
                  aria-label={
                    isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"
                  }
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mega Menu Desktop */}
      <AnimatePresence>
        {isMegaMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMegaMenu}
            />

            {/* Menu Content */}
            <motion.div
              ref={menuRef}
              className={cn(
                "fixed left-0 right-0 z-50 py-6",
                isScrolled ? "top-16" : "top-16"
              )}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu principal"
            >
              <div className="mx-auto px-6 max-w-7xl">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                  <div className="p-8">
                    {/* Navigation par onglets */}
                    <div className="flex justify-center mb-8">
                      <nav
                        className="flex space-x-1 bg-gray-100 p-1 rounded-xl"
                        role="tablist"
                      >
                        {menuData.map((section) => {
                          const Icon = section.icon;
                          return (
                            <button
                              key={section.id}
                              onClick={() => handleSectionClick(section.id)}
                              onMouseEnter={() =>
                                handleSectionHover(section.id)
                              }
                              onKeyDown={(e) =>
                                handleKeyNavigation(e, section.id)
                              }
                              className={cn(
                                "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                activeSection === section.id
                                  ? "bg-white text-primary shadow-sm"
                                  : "text-gray-600 hover:text-primary hover:bg-white/50"
                              )}
                              role="tab"
                              aria-selected={activeSection === section.id}
                              aria-controls={`panel-${section.id}`}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{section.title}</span>
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    {/* Contenu des sections */}
                    <div className="min-h-[300px]">
                      <AnimatePresence mode="wait">
                        {menuData.map((section) => {
                          if (activeSection !== section.id) return null;

                          return (
                            <motion.div
                              key={section.id}
                              id={`panel-${section.id}`}
                              role="tabpanel"
                              aria-labelledby={`tab-${section.id}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-8"
                            >
                              {/* En-tête de section */}
                              <div className="text-center">
                                <div
                                  className={cn(
                                    "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4",
                                    getColorClasses(section.color)
                                  )}
                                >
                                  <section.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                  {section.title}
                                </h3>
                                <p className="text-gray-600 max-w-2xl mx-auto">
                                  {section.id === "discover" &&
                                    "Explorez ABC Bédarieux et découvrez tout ce que nous avons à offrir"}
                                  {section.id === "places" &&
                                    "Découvrez tous les établissements partenaires de votre territoire"}
                                  {section.id === "events" &&
                                    "Ne manquez aucun événement de votre ville"}
                                  {section.id === "content" &&
                                    "Restez informé avec nos dernières actualités et initiatives"}
                                </p>
                              </div>

                              {/* Grille des éléments */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                {section.items.map((item, index) => {
                                  const ItemIcon = item.icon || section.icon;
                                  return (
                                    <motion.div
                                      key={item.id}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{
                                        delay: index * 0.1,
                                        duration: 0.3,
                                      }}
                                    >
                                      <Link
                                        href={item.href}
                                        onClick={handleMenuItemClick}
                                        className={cn(
                                          "group block p-6 rounded-xl border transition-all duration-200 h-full",
                                          "hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                          item.featured
                                            ? "border-primary/20 bg-primary/5"
                                            : "border-gray-200 hover:border-primary/20"
                                        )}
                                      >
                                        <div className="flex items-start space-x-4 h-full">
                                          <div
                                            className={cn(
                                              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                                              getColorClasses(section.color)
                                            )}
                                          >
                                            <ItemIcon className="w-6 h-6" />
                                          </div>
                                          <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                                              {item.label}
                                              {item.featured && (
                                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-white">
                                                  Populaire
                                                </span>
                                              )}
                                            </h4>
                                            {item.description && (
                                              <p className="text-sm text-gray-600">
                                                {item.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </Link>
                                    </motion.div>
                                  );
                                })}
                              </div>

                              {/* Section featured */}
                              {section.featured && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.4 }}
                                  className="pt-6 border-t border-gray-100"
                                >
                                  <div className="max-w-md mx-auto">
                                    <Link
                                      href={section.featured.href}
                                      onClick={handleMenuItemClick}
                                      className="group block p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                    >
                                      <div className="text-center">
                                        <div className="w-12 h-12 mx-auto rounded-xl bg-primary text-white flex items-center justify-center mb-3">
                                          {section.featured.icon && (
                                            <section.featured.icon className="w-6 h-6" />
                                          )}
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                                          {section.featured.label}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                          {section.featured.description}
                                        </p>
                                      </div>
                                    </Link>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* État par défaut */}
                      {!activeSection && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-12"
                        >
                          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-6">
                            <Menu className="w-10 h-10 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Explorez ABC Bédarieux
                          </h3>
                          <p className="text-gray-600 max-w-lg mx-auto">
                            Sélectionnez une catégorie ci-dessus pour découvrir
                            tout ce que nous avons à vous offrir
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Footer du menu */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                      <button
                        onClick={closeMegaMenu}
                        className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-3 py-2"
                      >
                        <span>Fermer le menu</span>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Menu Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/50"
              style={{ 
                zIndex: 99998,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
            />

            {/* Menu Sidebar */}
            <motion.div
              className="lg:hidden fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl"
              style={{ 
                zIndex: 99999,
                position: 'fixed',
                top: 0,
                right: 0,
                height: '100vh',
                width: '100%',
                maxWidth: '384px'
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
            >
              <div className="flex flex-col h-full bg-white">
                {/* Header du menu mobile */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Logo width={32} height={32} />
                    <span className="text-lg font-semibold text-gray-900">
                      Navigation
                    </span>
                  </div>
                  <button
                    onClick={closeMobileMenu}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Fermer le menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto bg-white">
                  <div className="p-4 space-y-3">
                    {/* Liens rapides */}
                    <div className="space-y-2 mb-6">
                      {quickLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={handleMenuItemClick}
                          className="block p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>

                    {/* Sections du menu avec sous-menus */}
                    <div className="space-y-2">
                      {menuData.map((section) => {
                        const Icon = section.icon;
                        const isOpen = activeMobileSection === section.id;
                        
                        return (
                          <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Header de section */}
                            <button
                              onClick={() => handleMobileSectionToggle(section.id)}
                              className={cn(
                                "w-full flex items-center justify-between p-4 text-left transition-colors",
                                isOpen ? "bg-gray-50" : "bg-white hover:bg-gray-50"
                              )}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center",
                                  getColorClasses(section.color)
                                )}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-gray-900">{section.title}</span>
                              </div>
                              <ChevronDown className={cn(
                                "w-5 h-5 text-gray-500 transition-transform",
                                isOpen && "rotate-180"
                              )} />
                            </button>

                            {/* Sous-menu */}
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-gray-50 p-3 space-y-2">
                                    {section.items.map((item) => {
                                      const ItemIcon = item.icon || section.icon;
                                      return (
                                        <Link
                                          key={item.id}
                                          href={item.href}
                                          onClick={handleMenuItemClick}
                                          className={cn(
                                            "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                                            "hover:bg-white hover:shadow-sm",
                                            item.featured && "bg-white border border-primary/20"
                                          )}
                                        >
                                          <ItemIcon className="w-4 h-4 text-gray-500" />
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                              {item.label}
                                              {item.featured && (
                                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-white">
                                                  ★
                                                </span>
                                              )}
                                            </div>
                                            {item.description && (
                                              <div className="text-xs text-gray-600 mt-1">
                                                {item.description}
                                              </div>
                                            )}
                                          </div>
                                        </Link>
                                      );
                                    })}

                                    {/* Item featured en bas */}
                                    {section.featured && (
                                      <Link
                                        href={section.featured.href}
                                        onClick={handleMenuItemClick}
                                        className="block p-3 mt-3 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg"
                                      >
                                        <div className="flex items-center space-x-3">
                                          {section.featured.icon && (
                                            <section.featured.icon className="w-4 h-4 text-primary" />
                                          )}
                                          <div>
                                            <div className="font-medium text-gray-900">{section.featured.label}</div>
                                            <div className="text-xs text-gray-600">{section.featured.description}</div>
                                          </div>
                                        </div>
                                      </Link>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Screen Reader Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        aria-label="Annonces de navigation"
      >
        {announceText}
      </div>

      {/* Skip Navigation Link pour l'accessibilité */}
      <Link
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Passer au contenu principal
      </Link>
    </header>
  );
}