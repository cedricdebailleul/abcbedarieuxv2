"use client";

import Logo from "@/components/logo";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

export default function FooterSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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

  const socialButtons = [
    { icon: "f", label: "Facebook" },
    { icon: "ig", label: "Instagram" },
    { icon: "in", label: "LinkedIn" },
    { icon: "yt", label: "YouTube" },
  ];

  const bottomNavItems = [
    { icon: "📞", label: "Nous Appeler" },
    { icon: "📋", label: "Avis publics" },
    { icon: "ℹ️", label: "Presse" },
    { icon: "📧", label: "Devenir partenaire" },
  ];

  return (
    <footer ref={ref} className="bg-gray-900 text-white mt-16 px-8 mx-auto">
      <div className="py-12">
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
            <motion.div variants={itemVariants}>
              <h3 className="text-sm font-semibold mb-4 tracking-wide">
                SUIVEZ-NOUS
              </h3>
              <div className="flex gap-3">
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
                      href="#"
                      className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                    >
                      <span className="text-sm font-bold">{social.icon}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div className="flex gap-8" variants={itemVariants}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <Link
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Foire aux questions
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Section - Newsletter */}
          <motion.div
            className="flex justify-end h-full"
            variants={itemVariants}
          >
            <div className="bg-blue-100 text-gray-900 p-6 rounded-2xl max-w-md w-full">
              <div className="text-xs text-gray-600 mb-2 tracking-wide">
                POUR PLUS D&apos;INFORMATION
              </div>
              <h3 className="text-xl font-bold mb-6">
                Abonnez-vous à l&apos;essentiel
              </h3>
              <div className="flex gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-full w-full">
                    S&apos;abonner à la newsletter
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    className="border-blue-300 text-gray-900 hover:bg-pink-50 px-6 py-2 rounded-full w-full bg-transparent"
                  >
                    S&apos;abonner aux avis
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
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
              © ABC - Association Bédaricienne des Commerçants,{" "}
              {new Date().getFullYear()}
            </p>
            <div className="flex gap-6 text-sm">
              <motion.div
                whileHover={{ y: -1 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <Link
                  href="/privacy"
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
                  href="#"
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
                  href="#"
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-full transition-colors block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-xs">{item.icon}</span>
                    </div>
                    <span className="font-medium">{item.label}</span>
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
