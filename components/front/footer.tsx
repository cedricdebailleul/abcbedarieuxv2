"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import Logo from "@/components/logo";
import FooterNewsletter from "./footer-newsletter";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

interface SiteSettings {
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  siteName?: string | null;
}

export default function FooterSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});

  // Récupérer les paramètres du site
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/site-settings");
        const result = await response.json();
        if (result.success && result.data) {
          setSiteSettings(result.data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres:", error);
      }
    };

    fetchSettings();
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const socialButtonVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.8,
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 120,
        damping: 10,
        delay: index * 0.1,
      },
    }),
  };

  const bottomNavVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.9,
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
        delay: index * 0.15,
      },
    }),
  };

  // Construire dynamiquement la liste des réseaux sociaux disponibles
  const socialButtons = [
    {
      icon: <Facebook className="h-5 w-5" />,
      label: "Facebook",
      url: siteSettings.facebookUrl,
    },
    {
      icon: <Instagram className="h-5 w-5" />,
      label: "Instagram",
      url: siteSettings.instagramUrl,
    },
    {
      icon: <FaXTwitter className="h-5 w-5" />,
      label: "Twitter/X",
      url: siteSettings.twitterUrl,
    },
    {
      icon: <Linkedin className="h-5 w-5" />,
      label: "LinkedIn",
      url: siteSettings.linkedinUrl,
    },
    {
      icon: <Youtube className="h-5 w-5" />,
      label: "YouTube",
      url: siteSettings.youtubeUrl,
    },
    {
      icon: <FaTiktok className="h-5 w-5" />,
      label: "TikTok",
      url: siteSettings.tiktokUrl,
    },
  ].filter((social) => social.url); // Filtrer uniquement les réseaux configurés

  const bottomNavItems = [
    { icon: "📞", label: "Nous Appeler", href: "/contact" },
    { icon: "📋", label: "Avis publics", href: "/avis-publics" },
    { icon: "ℹ️", label: "Presse", href: "/presse" },
    { icon: "📧", label: "Devenir partenaire", href: "/contact" },
  ];

  return (
    <footer ref={ref} className="bg-gray-900 text-white mt-16 px-8 mx-auto">
      <div className="py-12 container mx-auto">
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-start"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Left Section */}
          <div className="space-y-8">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3"
              variants={itemVariants}
            >
              <Logo width={50} height={50} />
              <span className="text-md text-primary font-bold">
                Association Bédaricienne <br />
                des Commerçants
              </span>
            </motion.div>

            {/* Social Media */}
            {socialButtons.length > 0 && (
              <motion.div variants={itemVariants}>
                <h3 className="text-sm font-semibold mb-4 tracking-wide">
                  SUIVEZ-NOUS
                </h3>
                <div className="flex gap-3 flex-wrap">
                  {socialButtons.map((social, index) => (
                    <motion.div
                      key={social.label}
                      variants={socialButtonVariants}
                      custom={index}
                      whileHover={{
                        scale: 1.1,
                        transition: { type: "spring" as const, stiffness: 300 },
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={social.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                        aria-label={social.label}
                      >
                        {social.icon}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Links */}
            <motion.div className="flex gap-8" variants={itemVariants}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <Link
                  href="/faq"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Foire aux questions
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Section - Newsletter */}
          <div>
            <FooterNewsletter />
          </div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          className="mt-12 pt-8 border-t border-gray-800"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Copyright and Policies */}
          <motion.div
            className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8"
            variants={itemVariants}
          >
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()}{" "}
              <span className="text-primary">
                {siteSettings.siteName || "ABC - Association Bédaricienne des Commerçants"}
              </span>
              , propulsé par{" "}
              <Link
                className="text-primary hover:text-white transition-colors"
                href="https://blackbearstudio.fr"
                target="_blank"
                rel="noopener noreferrer"
              >
                Black Bear Studio
              </Link>
            </p>
            <div className="flex gap-6 text-sm">
              <motion.div
                whileHover={{ y: -1 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <Link
                  href="/privacy2"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Politique d&apos;utilisation
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ y: -1 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <Link
                  href="/privacy2"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Politique de confidentialité
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Bottom Navigation */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
          >
            {bottomNavItems.map((item, index) => (
              <motion.div
                key={item.label}
                variants={bottomNavVariants}
                custom={index}
                whileHover={{
                  scale: 1.02,
                  y: -2,
                  transition: { type: "spring" as const, stiffness: 300 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={item.href}
                  className="bg-gray-800 hover:bg-gray-700 p-2.5 sm:p-4 rounded-full transition-colors block"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs">{item.icon}</span>
                    </div>
                    <span className="font-medium text-xs sm:text-sm leading-tight">{item.label}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
