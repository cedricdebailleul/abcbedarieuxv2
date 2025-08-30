"use client";

import { create } from "zustand";
import type { BadgeCelebration } from "@/types/membership";

interface BadgeCelebrationState {
  isOpen: boolean;
  badge: BadgeCelebration | null;
  reason: string;
  showBadge: (badge: BadgeCelebration, reason: string) => void;
  closeBadge: () => void;
}

export const useBadgeCelebration = create<BadgeCelebrationState>((set) => ({
  isOpen: false,
  badge: null,
  reason: "",
  showBadge: (badge: BadgeCelebration, reason: string) => {
    set({ isOpen: true, badge, reason });
  },
  closeBadge: () => {
    set({ isOpen: false, badge: null, reason: "" });
  },
}));