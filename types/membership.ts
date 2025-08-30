import { z } from "zod";
import { BadgeRarity } from "@/lib/generated/prisma";

// Schéma pour les données de célébration d'adhésion
export const MembershipCelebrationDataSchema = z.object({
  membershipType: z.string().min(1, "Le type d'adhésion est requis"),
  amount: z.number().positive("Le montant doit être positif"),
  email: z.string().email("Email invalide"),
});

export type MembershipCelebrationData = z.infer<typeof MembershipCelebrationDataSchema>;

// Interface pour les props du composant de célébration d'adhésion
export interface MembershipCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  membershipType: string;
  amount: number;
  email: string;
}

// Schéma pour les badges dans les célébrations
export const BadgeCelebrationSchema = z.object({
  title: z.string(),
  description: z.string(),
  iconUrl: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  rarity: z.nativeEnum(BadgeRarity),
});

export type BadgeCelebration = z.infer<typeof BadgeCelebrationSchema>;

// Interface pour les props du composant de célébration de badge
export interface BadgeCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  badge: BadgeCelebration;
  reason: string;
}