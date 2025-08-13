"use client";

import { create } from "zustand";

interface Badge {
  title: string;
  description: string;
  iconUrl?: string | null;
  color?: string | null;
  rarity: string;
}

interface BadgeCelebrationState {
  isOpen: boolean;
  badge: Badge | null;
  reason: string;
  showBadge: (badge: Badge, reason: string) => void;
  closeBadge: () => void;
}

export const useBadgeCelebration = create<BadgeCelebrationState>((set) => ({
  isOpen: false,
  badge: null,
  reason: "",
  showBadge: (badge: Badge, reason: string) => {
    set({ isOpen: true, badge, reason });
  },
  closeBadge: () => {
    set({ isOpen: false, badge: null, reason: "" });
  },
}));