import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site.config";
import { PlaceStatus } from "@/lib/generated/prisma/client";

// Force dynamic rendering to avoid database calls during build
export const dynamic = "force-dynamic";

function absolute(path: string) {
  return `${siteConfig.baseUrl}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Pages statiques
  const staticUrls: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: absolute("/places"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absolute("/events"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absolute("/articles"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absolute("/categories"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absolute("/actions"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absolute("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absolute("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absolute("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absolute("/partenaires"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  // Récupérer les places actives
  const places = await prisma.place.findMany({
    where: { status: PlaceStatus.ACTIVE, isActive: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  // Récupérer les articles publiés
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  // Récupérer les événements
  const events = await prisma.event.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  // Récupérer les catégories
  const categories = await prisma.category.findMany({
    select: { slug: true, updatedAt: true },
  });

  // Récupérer les actions
  const actions = await prisma.action.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  return [
    ...staticUrls,
    ...places.map((place) => ({
      url: absolute(`/places/${place.slug}`),
      lastModified: place.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: absolute(`/posts/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...events.map((event) => ({
      url: absolute(`/events/${event.slug}`),
      lastModified: event.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...categories.map((category) => ({
      url: absolute(`/categories/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...actions.map((action) => ({
      url: absolute(`/actions/${action.slug}`),
      lastModified: action.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
