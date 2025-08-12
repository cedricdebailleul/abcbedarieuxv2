"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, Search, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NavUser } from "@/components/layout/nav_user";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

interface NavItem {
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
    label: "Bédarieux",
    href: "/ville",
    hasDropdown: true,
    items: [
      { label: "À propos", href: "/ville/a-propos" },
      { label: "Histoire", href: "/ville/histoire" },
      { label: "Conseil municipal", href: "/ville/conseil" },
    ],
  },
  {
    label: "Services",
    href: "/services",
    hasDropdown: true,
    items: [
      { label: "Services aux citoyens", href: "/services/citoyens" },
      { label: "Collectes", href: "/services/collectes" },
      { label: "Permis", href: "/services/permis" },
    ],
  },
  {
    label: "L'Association",
    href: "/loisirs",
    hasDropdown: true,
    items: [
      { label: "Bibliothèque", href: "/loisirs/bibliotheque" },
      { label: "Activités", href: "/loisirs/activites" },
      { label: "Installations", href: "/loisirs/installations" },
    ],
  },
];

const topBarLinks = [
  { label: "Nous joindre", href: "/nous-joindre" },
  { label: "Actualités", href: "/actualites" },
  { label: "Calendrier des événements", href: "/calendrier-des-evenements" },
  { label: "Carte Intéractive", href: "/carte-interactive" },
];

export default function Header({ className }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsScrolled(scrolled);

      // Fermer tous les menus quand on scroll
      if (scrolled && (isMegaMenuOpen || activeDropdown)) {
        setIsMegaMenuOpen(false);
        setActiveDropdown(null);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      // Fermer le mega menu principal si on clique à l'extérieur
      if (isMegaMenuOpen) {
        const target = event.target as Element;
        const megaMenuButton = document.querySelector("[data-mega-menu-button]");
        const megaMenuContent = document.querySelector("[data-mega-menu-content]");

        if (
          megaMenuButton &&
          !megaMenuButton.contains(target) &&
          megaMenuContent &&
          !megaMenuContent.contains(target)
        ) {
          setIsMegaMenuOpen(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMegaMenuOpen, activeDropdown]);

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
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
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
                                          onClick={() => setActiveDropdown(null)}
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
              <Button
                size="icon"
                className="bg-primary text-white bg-none size-10 rounded-full hover:bg-primary/90 sm:hover:bg-none transition-colors"
              >
                <Search className="size-6" />
              </Button>
              <ThemeToggle variant="navbar" />
              {/* User Icon */}
              <NavUser />

              {/* Mobile Menu Button */}
              <Button
                className="lg:hidden p-2 text-gray-900 bg-transparent hover:bg-transparent rounded-full transition-colors size-10"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
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
                  "left-0 z-50 py-4",
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
                <div className="flex justify-center px-6 mx-4">
                  <div
                    className="bg-white shadow-xl rounded-3xl w-full mx-auto px-8"
                    data-mega-menu-content
                  >
                    <div className="px-12 py-10">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                        {/* Colonne 1 - Activités et vie de quartier */}
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
                          <h3 className="font-semibold text-sm text-primary uppercase tracking-wide mb-4">
                            ACTIVITÉS ET VIE DE QUARTIER
                          </h3>
                          <div className="space-y-3">
                            <Link
                              href="/calendrier-des-evenements"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Calendrier des événements
                            </Link>
                            <Link
                              href="/camps-de-jour"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Camps de jour
                            </Link>
                            <Link
                              href="/fete-des-voisins"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Fête des voisins
                            </Link>
                            <Link
                              href="/inscription-activites"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Inscription aux activités
                            </Link>
                            <Link
                              href="/jouer-dans-ma-rue"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Jouer dans ma rue
                            </Link>
                            <Link
                              href="/organismes-reconnus"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Organismes reconnus
                            </Link>
                            <Link
                              href="/reservation-salles"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Réservation de salles
                            </Link>
                            <Link
                              href="/ventes-garage"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Ventes de garage
                            </Link>
                          </div>
                        </motion.div>

                        {/* Colonne 2 - Installations sportives */}
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
                          <h3 className="font-semibold text-sm text-primary uppercase tracking-wide mb-4">
                            INSTALLATIONS SPORTIVES ET PLEIN AIR
                          </h3>
                          <div className="space-y-3">
                            <Link
                              href="/activites-sportives"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Activités sportives
                            </Link>
                            <Link
                              href="/parcs-espaces-verts"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Parcs et espaces verts
                            </Link>
                            <Link
                              href="/patinoires-glissades"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Patinoires et glissades
                            </Link>
                            <Link
                              href="/sentiers"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Sentiers
                            </Link>
                          </div>
                        </motion.div>

                        {/* Colonne 3 - Art, culture et patrimoine */}
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
                          <h3 className="font-semibold text-sm text-primary uppercase tracking-wide mb-4">
                            ART, CULTURE ET PATRIMOINE
                          </h3>
                          <div className="space-y-3">
                            <Link
                              href="/bibliotheque"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Bibliothèque
                            </Link>
                            <Link
                              href="/oeuvres-art"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Œuvres d&apos;art
                            </Link>
                            <Link
                              href="/patrimoine"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Patrimoine
                            </Link>
                            <Link
                              href="/soutien-artistes"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Soutien aux artistes
                            </Link>
                            <Link
                              href="/toponymie"
                              className="block text-gray-800 hover:text-primary transition-colors text-sm font-medium"
                              onClick={() => setIsMegaMenuOpen(false)}
                            >
                              Toponymie
                            </Link>
                          </div>
                        </motion.div>

                        {/* Colonne 4 - Section spéciale avec carte */}
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
                          <div className="bg-gray-900 rounded-2xl p-6 text-white">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium leading-tight">
                                  Abonnez-vous à l&apos;infolettre
                                </p>
                                <p className="text-xs text-gray-300 leading-tight">
                                  pour recevoir le M-Loisirs
                                </p>
                                <p className="text-xs text-gray-300 leading-tight">
                                  dès sa sortie!
                                </p>
                              </div>
                            </div>
                            <button className="text-sm underline hover:no-underline transition-all">
                              S&apos;inscrire
                            </button>
                          </div>

                          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 relative overflow-hidden">
                            <div className="relative z-10">
                              <div className="text-red-600 font-bold text-2xl mb-2">M LOISIRS</div>
                              <div className="text-xs text-gray-800">Magazine municipal</div>
                            </div>
                            <div className="absolute inset-0 opacity-20">
                              <div className="w-full h-full bg-gradient-to-br from-transparent to-red-500/20"></div>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Bouton fermer */}
                      <motion.div
                        className="flex justify-center mt-8 pt-6 border-t border-gray-100"
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
                          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                        >
                          Fermer le menu
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
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
