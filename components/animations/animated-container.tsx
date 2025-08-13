"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeInUp, stagger } from "@/lib/animations";

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerChildren?: boolean;
}

export function AnimatedContainer({
  children,
  className,
  delay = 0,
  staggerChildren = false,
}: AnimatedContainerProps) {
  return (
    <motion.div
      className={className}
      variants={staggerChildren ? stagger : fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={fadeInUp}>
      {children}
    </motion.div>
  );
}
