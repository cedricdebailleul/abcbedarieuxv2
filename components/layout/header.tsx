"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "../logo";
import { NavUser } from "./nav_user";

export function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-sm text-gray-800 active:text-primary hover:text-primary"
    >
      <div className="mx-auto px-8 flex h-16 items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          <Logo width={50} height={50} />
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/about"
            className="transition-colors hover:text-foreground/80"
          >
            À propos
          </Link>
          <Link
            href="/blog"
            className="transition-colors hover:text-foreground/80"
          >
            Blog
          </Link>
          <Link
            href="/contact"
            className="transition-colors hover:text-foreground/80"
          >
            Contact
          </Link>
        </nav>
        <NavUser />
      </div>
    </motion.header>
  );
}
