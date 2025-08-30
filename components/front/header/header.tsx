"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Menu,
  User,
  X,
  Calendar,
  Star,
  Newspaper,
  MapPin} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NavUser } from "@/components/layout/nav_user";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SearchMenu } from "./search-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
  items?: { label: string; href: string }[];
}

interface TopBarLink {
  label: string;
  href: string;
  hasDropdown?: boolean;
  items?: { label: string; href: string }[];
}

interface HeaderProps {
  className?: string;
}

const navItems: NavItem[] = [
  {
    label: "Découvrir",
    href: "/",
    hasDropdown: true,
    items: [
      { label: "Accueil", href: "/" },
      { label: "À propos", href: "/about" },
      { label: "Notre histoire", href: "/histoire" },
    ],
  },
  {
    label: "Services",
    href: "/services",
    hasDropdown: true,
    items: [
      { label: "Tous les services", href: "/services" },
      { label: "Aide & Support", href: "/support" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

const topBarLinks: TopBarLink[] = [
  {
    label: "Établissements",
    href: "/places",
    hasDropdown: true,
    items: [
      { label: "Tous les établissements", href: "/places" },
      { label: "Par catégories", href: "/categories" },
      { label: "Carte interactive", href: "/carte" },
    ],
  },
  {
    label: "Événements",
    href: "/events",
    hasDropdown: true,
    items: [
      { label: "Tous les événements", href: "/events" },
      { label: "Événements simples", href: "/events/simple" },
    ],
  },
  {
    label: "Contenu",
    href: "/articles",
    hasDropdown: true,
    items: [
      { label: "Articles", href: "/articles" },
      { label: "Actualités", href: "/actualites" },
      { label: "Nos Actions", href: "/actions" },
    ],
  },
  { label: "Nous Joindre", href: "/contact" },
];

export default function Header({ className }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeTopBarDropdown, setActiveTopBarDropdown] = useState<
    string | null
  >(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsScrolled(scrolled);

      // Fermer tous les menus quand on scroll
      if (
        scrolled &&
        (isMegaMenuOpen || activeDropdown || activeTopBarDropdown)
      ) {
        setIsMegaMenuOpen(false);
        setActiveDropdown(null);
        setActiveTopBarDropdown(null);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Fermer le mega menu principal si on clique à l'extérieur
      if (isMegaMenuOpen) {
        const megaMenuButton = document.querySelector(
          "[data-mega-menu-button]"
        );
        const megaMenuContent = document.querySelector(
          "[data-mega-menu-content]"
        );

        if (
          megaMenuButton &&
          !megaMenuButton.contains(target) &&
          megaMenuContent &&
          !megaMenuContent.contains(target)
        ) {
          setIsMegaMenuOpen(false);
        }
      }

      // Fermer les mega menus de la top bar si on clique à l'extérieur
      if (activeTopBarDropdown) {
        const topBarButtons = document.querySelectorAll(
          "[data-topbar-dropdown]"
        );
        const topBarMenus = document.querySelectorAll("[data-topbar-menu]");

        let clickedInsideAnyMenu = false;

        // Vérifier si le clic est dans un bouton de la top bar
        topBarButtons.forEach((button) => {
          if (button.contains(target)) {
            clickedInsideAnyMenu = true;
          }
        });

        // Vérifier si le clic est dans un menu de la top bar
        topBarMenus.forEach((menu) => {
          if (menu.contains(target)) {
            clickedInsideAnyMenu = true;
          }
        });

        if (!clickedInsideAnyMenu) {
          setActiveTopBarDropdown(null);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMegaMenuOpen, activeDropdown, activeTopBarDropdown]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setActiveDropdown(null);
    setIsMegaMenuOpen(false);
  };

  const handleDropdownToggle = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  const toggleMegaMenu = () => {
    setIsMegaMenuOpen(!isMegaMenuOpen);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className={cn("relative z-50 bg-white", className)}>
      {/* Top Bar - Hidden on mobile */}
      <div
        className={cn(
          "mx-auto w-full transition-all duration-300 hidden lg:block px-8 py-6",
          isScrolled && "hidden"
        )}
      >
        <div className="border-1 border-gray-200 rounded-full justify-between py-3 pl-3 pr-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1"></div>
            <nav className="flex items-center space-x-6">
              {topBarLinks.map((link) => (
                <div key={link.label} className="relative group">
                  {link.hasDropdown ? (
                    <button
                      className="flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors"
                      onClick={() =>
                        setActiveTopBarDropdown(
                          activeTopBarDropdown === link.label
                            ? null
                            : link.label
                        )
                      }
                      data-topbar-dropdown
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 transition-transform duration-200",
                          activeTopBarDropdown === link.label && "rotate-180"
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-gray-700 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}

                  {/* Mega menu pour top bar */}
                  {link.hasDropdown && link.items && (
                    <AnimatePresence>
                      {activeTopBarDropdown === link.label && (
                        <>
                          {/* Overlay */}
                          <motion.div
                            className="fixed inset-0 bg-black/20 z-30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setActiveTopBarDropdown(null)}
                          />

                          {/* Menu déroulant style "Menu Complet" */}
                          <motion.div
                            className="fixed left-0 right-0 w-full z-40 pt-2"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            <div className="w-full px-6">
                              <div className="max-w-7xl mx-auto">
                                <div
                                  className="bg-white shadow-2xl rounded-3xl w-full border border-gray-100"
                                  data-topbar-menu
                                >
                                  <div className="px-8 lg:px-16 py-12">
                                    {/* En-tête du mega menu */}
                                    <div className="text-center mb-10">
                                      <div className="flex items-center justify-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center">
                                          {link.label === "Établissements" && (
                                            <MapPin className="w-6 h-6 text-primary" />
                                          )}
                                          {link.label === "Événements" && (
                                            <Calendar className="w-6 h-6 text-secondary" />
                                          )}
                                          {link.label === "Contenu" && (
                                            <Newspaper className="w-6 h-6 text-orange-600" />
                                          )}
                                        </div>
                                        <h3 className="font-bold text-2xl text-gray-900">
                                          {link.label}
                                        </h3>
                                      </div>
                                      <p className="text-gray-600 max-w-2xl mx-auto">
                                        {link.label === "Établissements" &&
                                          "Découvrez tous les commerces et services de Bédarieux"}
                                        {link.label === "Événements" &&
                                          "Ne manquez aucun événement de votre ville"}
                                        {link.label === "Contenu" &&
                                          "Restez informé avec nos dernières actualités et actions"}
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                                      {link.items.map((item, index) => (
                                        <motion.div
                                          key={item.href}
                                          className="space-y-6"
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{
                                            delay: index * 0.1,
                                            duration: 0.3,
                                            ease: [0.4, 0.0, 0.2, 1],
                                          }}
                                        >
                                          <Link
                                            href={item.href}
                                            className="group flex flex-col items-center text-center p-6 text-gray-700 hover:text-primary hover:bg-primary/5 transition-all duration-300 rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-md"
                                            onClick={() =>
                                              setActiveTopBarDropdown(null)
                                            }
                                          >
                                            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                              <div className="w-3 h-3 bg-primary rounded-full group-hover:w-4 group-hover:h-4 transition-all"></div>
                                            </div>
                                            <h4 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                                              {item.label}
                                            </h4>
                                            <p className="text-sm text-gray-500 group-hover:text-gray-600">
                                              {item.href === "/places" &&
                                                "Explorez tous nos établissements"}
                                              {item.href === "/categories" &&
                                                "Parcourez par catégorie"}
                                              {item.href === "/carte" &&
                                                "Visualisez sur la carte"}
                                              {item.href === "/events" &&
                                                "Tous les événements"}
                                              {item.href === "/events/simple" &&
                                                "Événements ponctuels"}
                                              {item.href === "/articles" &&
                                                "Nos derniers articles"}
                                              {item.href === "/actualites" &&
                                                "L'actualité de la ville"}
                                              {item.href === "/actions" &&
                                                "Découvrez nos actions"}
                                            </p>
                                          </Link>
                                        </motion.div>
                                      ))}
                                    </div>

                                    {/* Section bonus selon le menu */}
                                    {link.label === "Établissements" && (
                                      <motion.div
                                        className="mt-12 pt-8 border-t border-gray-100"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                      >
                                        <div className="text-center">
                                          <h4 className="font-semibold text-lg text-gray-900 mb-4">
                                            💡 Le saviez-vous ?
                                          </h4>
                                          <p className="text-gray-600 max-w-3xl mx-auto">
                                            Plus de 200 établissements font
                                            confiance à ABC Bédarieux pour leur
                                            visibilité locale
                                          </p>
                                        </div>
                                      </motion.div>
                                    )}

                                    {/* Bouton fermer */}
                                    <motion.div
                                      className="flex justify-center mt-10 pt-6 border-t border-gray-100"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.6 }}
                                    >
                                      <button
                                        onClick={() =>
                                          setActiveTopBarDropdown(null)
                                        }
                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200 px-6 py-3 rounded-xl text-sm font-medium"
                                      >
                                        Fermer le menu
                                        <X className="w-4 h-4" />
                                      </button>
                                    </motion.div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <motion.div
        className={cn(
          "bg-white transition-all duration-300",
          isScrolled ? "fixed top-0 left-0 right-0 w-full" : "relative"
        )}
        animate={{
          transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] },
        }}
      >
        <div className="mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Logo width={50} height={50} />
            </Link>

            {/* Desktop Navigation - Mode scrollé (mega menu) */}
            <motion.nav
              className={cn(
                "hidden lg:flex items-center space-x-6 transition-all duration-300",
                !isScrolled && "opacity-0 pointer-events-none"
              )}
              animate={{
                opacity: isScrolled ? 1 : 0,
                transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] },
              }}
            >
              {topBarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-700 hover:text-primary transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}

              <button
                onClick={toggleMegaMenu}
                data-mega-menu-button
                className="flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors"
              >
                <span className="text-sm">Menu</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isMegaMenuOpen && "rotate-180"
                  )}
                />
              </button>
            </motion.nav>
            {/* Desktop Navigation - Mode normal */}
            <nav
              className={cn(
                "hidden xl:flex  gap-4 transition-all duration-300",
                isScrolled && "opacity-0 pointer-events-none"
              )}
            >
              {navItems.map((item) => (
                <div key={item.label} className="relative group">
                  <button
                    className="flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors py-2"
                    onClick={() => handleDropdownToggle(item.label)}
                  >
                    <span>{item.label}</span>
                    {item.hasDropdown && <ChevronDown className="w-4 h-4" />}
                  </button>

                  {item.hasDropdown && item.items && (
                    <AnimatePresence>
                      {activeDropdown === item.label && (
                        <>
                          {/* Overlay pour le mega menu individuel */}
                          <motion.div
                            className={cn(
                              "fixed left-0 w-screen bg-black/50 z-40",
                              isScrolled
                                ? "top-[80px] h-[calc(100vh-80px)]"
                                : "top-[196px] h-[calc(100vh-200px)]"
                            )}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setActiveDropdown(null)}
                          />

                          {/* Mega menu individuel - Full width */}
                          <motion.div
                            className={cn(
                              "fixed left-0 right-0 w-full z-50 py-6",
                              isScrolled ? "top-[80px]" : "top-[196px]"
                            )}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          >
                            <div className="flex justify-center px-6">
                              <div className="bg-white shadow-xl rounded-3xl w-full ">
                                <div className="px-12 py-10">
                                  <h3 className="font-semibold text-sm text-primary uppercase tracking-wide mb-8 text-center">
                                    {item.label}
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {item.items.map((subItem, index) => (
                                      <motion.div
                                        key={subItem.href}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                          delay: index * 0.1,
                                          duration: 0.3,
                                          ease: [0.4, 0.0, 0.2, 1],
                                        }}
                                      >
                                        <Link
                                          href={subItem.href}
                                          className="block px-6 py-4 text-gray-800 hover:bg-primary/10 hover:text-primary transition-colors rounded-xl font-medium text-center"
                                          onClick={() =>
                                            setActiveDropdown(null)
                                          }
                                        >
                                          {subItem.label}
                                        </Link>
                                      </motion.div>
                                    ))}
                                  </div>

                                  {/* Bouton fermer */}
                                  <div className="flex justify-center mt-8 pt-6 border-t border-gray-100">
                                    <button
                                      onClick={() => setActiveDropdown(null)}
                                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                                    >
                                      Fermer le menu
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
                  )}
                </div>
              ))}

              {/* Bouton Mega Menu toujours visible */}
              <button
                onClick={toggleMegaMenu}
                data-mega-menu-button
                className="flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors py-2"
              >
                <span>Menu Complet</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isMegaMenuOpen && "rotate-180"
                  )}
                />
              </button>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <Button
                className={cn(
                  "hidden md:flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 h-10 cursor-pointer transition-all duration-300",
                  isScrolled ? "text-xs px-3 py-1.5" : "text-sm"
                )}
              >
                <span className="font-medium">Les plus populaires</span>
              </Button>
              <SearchMenu />
              <ThemeToggle variant="navbar" />
              {/* User Icon */}
              <NavUser />

              {/* Mobile Menu Button */}
              <Button
                className="lg:hidden p-2 text-gray-900 bg-transparent hover:bg-transparent rounded-full transition-colors size-10"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? (
                  <X className="size-6" />
                ) : (
                  <Menu className="size-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mega Menu */}
        <AnimatePresence>
          {isMegaMenuOpen && (
            <>
              {/* Overlay */}
              <motion.div
                className={cn(
                  "left-0 w-screen bg-black/50 z-40",
                  isScrolled
                    ? "fixed top-full h-[calc(100vh-theme(spacing.80))]"
                    : "absolute top-full h-screen"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setIsMegaMenuOpen(false)}
              />

              {/* Menu Content */}
              <motion.div
                className={cn(
                  "left-0 right-0 w-full z-50 py-6",
                  isScrolled ? "fixed top-full" : "absolute top-full"
                )}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                }}
              >
                <div className="w-full px-6">
                  <div className="max-w-7xl mx-auto">
                    <div
                      className="bg-white shadow-2xl rounded-3xl w-full border border-gray-100"
                      data-mega-menu-content
                    >
                      <div className="px-8 lg:px-16 py-12">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 max-w-6xl mx-auto">
                          {/* Colonne 1 - Établissements */}
                          <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.1,
                              duration: 0.3,
                              ease: [0.4, 0.0, 0.2, 1],
                            }}
                          >
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-primary" />
                              </div>
                              <h3 className="font-semibold text-lg text-gray-900 capitalize">
                                Établissements
                              </h3>
                            </div>
                            <div className="space-y-4">
                              <Link
                                href="/places"
                                className="group flex items-center gap-3 p-3 text-gray-700 hover:text-primary hover:bg-primary/5 transition-all duration-200 rounded-xl"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="w-2 h-2 bg-primary/60 rounded-full group-hover:bg-primary transition-colors"></div>
                                <span className="font-medium">
                                  Tous les établissements
                                </span>
                              </Link>
                              <Link
                                href="/categories"
                                className="group flex items-center gap-3 p-3 text-gray-700 hover:text-primary hover:bg-primary/5 transition-all duration-200 rounded-xl"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="w-2 h-2 bg-primary/60 rounded-full group-hover:bg-primary transition-colors"></div>
                                <span className="font-medium">
                                  Par catégories
                                </span>
                              </Link>
                              <Link
                                href="/carte"
                                className="group flex items-center gap-3 p-3 text-gray-700 hover:text-primary hover:bg-primary/5 transition-all duration-200 rounded-xl"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="w-2 h-2 bg-primary/60 rounded-full group-hover:bg-primary transition-colors"></div>
                                <span className="font-medium">
                                  Carte interactive
                                </span>
                              </Link>
                            </div>
                          </motion.div>

                          {/* Colonne 2 - Événements */}
                          <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.2,
                              duration: 0.3,
                              ease: [0.4, 0.0, 0.2, 1],
                            }}
                          >
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-secondary" />
                              </div>
                              <h3 className="font-semibold text-lg text-gray-900 capitalize">
                                Événements
                              </h3>
                            </div>
                            <div className="space-y-4">
                              <Link
                                href="/events"
                                className="group flex items-center gap-3 p-3 text-gray-700 hover:text-secondary hover:bg-secondary/5 transition-all duration-200 rounded-xl"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="w-2 h-2 bg-secondary/60 rounded-full group-hover:bg-secondary transition-colors"></div>
                                <span className="font-medium">
                                  Tous les événements
                                </span>
                              </Link>
                              <Link
                                href="/events/simple"
                                className="group flex items-center gap-3 p-3 text-gray-700 hover:text-secondary hover:bg-secondary/5 transition-all duration-200 rounded-xl"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="w-2 h-2 bg-secondary/60 rounded-full group-hover:bg-secondary transition-colors"></div>
                                <span className="font-medium">
                                  Événements simples
                                </span>
                              </Link>
                              <div className="mt-6 p-4 bg-gradient-to-r from-secondary/5 to-secondary/10 rounded-xl border-l-4 border-secondary">
                                <h4 className="text-sm font-semibold text-secondary mb-2">
                                  À venir
                                </h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  Découvrez les prochains événements de votre
                                  ville
                                </p>
                              </div>
                            </div>
                          </motion.div>

                          {/* Colonne 3 - Contenu */}
                          <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.3,
                              duration: 0.3,
                              ease: [0.4, 0.0, 0.2, 1],
                            }}
                          >
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Newspaper className="w-5 h-5 text-orange-600" />
                              </div>
                              <h3 className="font-semibold text-lg text-gray-900 capitalize">
                                Contenu
                              </h3>
                            </div>
                            <div className="space-y-4">
                              <Link
                                href="/articles"
                                className="group flex items-center gap-3 p-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="w-2 h-2 bg-orange-400 rounded-full group-hover:bg-orange-600 transition-colors"></div>
                                <span className="font-medium">Articles</span>
                              </Link>
                              <Link
                                href="/actualites"
                                className="group flex items-center gap-3 p-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="w-2 h-2 bg-orange-400 rounded-full group-hover:bg-orange-600 transition-colors"></div>
                                <span className="font-medium">Actualités</span>
                              </Link>
                              <Link
                                href="/actions"
                                className="group flex items-center gap-3 p-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="w-2 h-2 bg-orange-400 rounded-full group-hover:bg-orange-600 transition-colors"></div>
                                <span className="font-medium">Nos Actions</span>
                              </Link>
                            </div>
                          </motion.div>

                          {/* Colonne 4 - Section spéciale */}
                          <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.4,
                              duration: 0.3,
                              ease: [0.4, 0.0, 0.2, 1],
                            }}
                          >
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Star className="w-5 h-5 text-yellow-600" />
                              </div>
                              <h3 className="font-semibold text-lg text-gray-900 capitalize">
                                Populaires
                              </h3>
                            </div>

                            <div className="space-y-4">
                              <Link
                                href="/places?sort=popular"
                                className="group flex items-center gap-3 p-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 transition-all duration-200 rounded-xl"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="w-2 h-2 bg-yellow-400 rounded-full group-hover:bg-yellow-600 transition-colors"></div>
                                <span className="font-medium">
                                  Établissements populaires
                                </span>
                              </Link>
                              <Link
                                href="/events?sort=popular"
                                className="group flex items-center gap-3 p-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 transition-all duration-200 rounded-xl"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                <div className="w-2 h-2 bg-yellow-400 rounded-full group-hover:bg-yellow-600 transition-colors"></div>
                                <span className="font-medium">
                                  Événements tendance
                                </span>
                              </Link>
                            </div>

                            <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 rounded-2xl p-6 border border-primary/10">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-1">
                                    Newsletter ABC
                                  </h4>
                                  <p className="text-xs text-gray-600 leading-relaxed">
                                    Restez informé des dernières actualités et
                                    événements
                                  </p>
                                </div>
                              </div>
                              <Link
                                href="/newsletter/subscribe"
                                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-all"
                                onClick={() => setIsMegaMenuOpen(false)}
                              >
                                S&apos;abonner
                              </Link>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 relative overflow-hidden border border-yellow-300">
                              <div className="relative z-10">
                                <div className="text-red-600 font-bold text-xl mb-1">
                                  M LOISIRS
                                </div>
                                <div className="text-xs text-red-800 font-medium">
                                  Magazine municipal
                                </div>
                                <Link
                                  href="/m-loisirs"
                                  className="inline-block mt-3 text-xs text-red-800 hover:text-red-900 font-medium underline underline-offset-2"
                                  onClick={() => setIsMegaMenuOpen(false)}
                                >
                                  Découvrir
                                </Link>
                              </div>
                              <div className="absolute top-2 right-2 w-12 h-12 bg-red-500/20 rounded-full"></div>
                              <div className="absolute bottom-2 right-6 w-8 h-8 bg-red-600/10 rounded-full"></div>
                            </div>
                          </motion.div>
                        </div>

                        {/* Bouton fermer */}
                        <motion.div
                          className="flex justify-center mt-10 pt-8 border-t border-gray-100"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            delay: 0.5,
                            duration: 0.3,
                            ease: [0.4, 0.0, 0.2, 1],
                          }}
                        >
                          <button
                            onClick={() => setIsMegaMenuOpen(false)}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200 px-4 py-2 rounded-xl text-sm font-medium"
                          >
                            Fermer le menu
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="lg:hidden mx-auto px-8 bg-white border-t"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0.0, 0.2, 1],
              }}
            >
              <div className="px-4 py-4">
                <nav className="space-y-4">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: index * 0.1,
                        duration: 0.3,
                        ease: [0.4, 0.0, 0.2, 1],
                      }}
                    >
                      <Button
                        className="flex items-center justify-between w-full text-left text-gray-700 hover:text-primary bg-transparent hover:bg-transparent transition-colors py-3 px-[0px]"
                        onClick={() => handleDropdownToggle(item.label)}
                      >
                        <span className="font-medium">{item.label}</span>
                        {item.hasDropdown && (
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform",
                              activeDropdown === item.label && "rotate-180"
                            )}
                          />
                        )}
                      </Button>

                      {item.hasDropdown && item.items && (
                        <AnimatePresence>
                          {activeDropdown === item.label && (
                            <motion.div
                              className=" space-y-2 overflow-hidden px-0"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.2,
                                ease: [0.4, 0.0, 0.2, 1],
                              }}
                            >
                              {item.items.map((subItem, subIndex) => (
                                <motion.div
                                  key={subItem.href}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    delay: subIndex * 0.05,
                                    duration: 0.2,
                                    ease: [0.4, 0.0, 0.2, 1],
                                  }}
                                >
                                  <Link
                                    href={subItem.href}
                                    className="block text-gray-600 hover:text-primary bg-none transition-colors py-1 px-0"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    {subItem.label}
                                  </Link>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </motion.div>
                  ))}
                </nav>

                {/* Mobile Action Button */}
                <motion.div
                  className="mt-6 pt-4 border-t"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.3,
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1],
                  }}
                >
                  <Button className="w-full bg-gray-900 text-white px-4 py-3 rounded-full hover:bg-gray-800 transition-colors cursor-pointer font-medium h-10">
                    Les plus populaires
                  </Button>
                </motion.div>

                {/* Mobile Top Bar Links */}
                <motion.div
                  className="mt-4 pt-4 border-t"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.4,
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1],
                  }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {topBarLinks.map((link, index) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.4 + index * 0.05,
                          duration: 0.2,
                          ease: [0.4, 0.0, 0.2, 1],
                        }}
                      >
                        <Link
                          href={link.href}
                          className="px-4 text-sm text-gray-600 hover:text-primary bg-none transition-colors py-2 block"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}
