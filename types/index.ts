import { Session } from "@/lib/generated/prisma";
import { z } from "zod";

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.email("Email invalide"),
  name: z.string().optional(),
  role: z.enum(["user", "admin", "moderator", "editor"]),
  slug: z.string().optional(),
  consentGiven: z.boolean().default(false),
});

export const CreateUserSchema = z.object({
  email: z.email().min(1, "Email invalide"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les conditions d'utilisation",
  }),
});

// Auth schemas
export const LoginSchema = z.object({
  email: z.email().min(1, "Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const MagicLinkSchema = z.object({
  email: z.email().min(1, "Email invalide"),
});

// Post schemas
export const PostSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().optional(),
  slug: z.string().min(1, "Le slug est requis"),
  published: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z
    .string()
    .max(160, "La description ne peut pas dépasser 160 caractères")
    .optional(),
});

// Component interfaces
export interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export interface LayoutProps {
  children: React.ReactNode;
}

export interface ComponentWithAuth {
  user?: User;
  session?: Session;
}

// Types
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type Post = z.infer<typeof PostSchema>;
