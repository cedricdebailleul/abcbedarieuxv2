import type { MetadataRoute } from "next";
import { absolute } from "@/lib/seo";

// Remplace ces mocks par des requêtes Prisma paginées
async function getCommerceSlugs(): Promise<string[]> {
  return [];
}
async function getArticleSlugs(): Promise<string[]> {
  return [];
}
async function getEventSlugs(): Promise<string[]> {
  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticUrls: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: now },
    { url: absolute("/commerces"), lastModified: now },
    { url: absolute("/evenements"), lastModified: now },
    { url: absolute("/articles"), lastModified: now },
  ];

  const [commerces, articles, events] = await Promise.all([
    getCommerceSlugs(),
    getArticleSlugs(),
    getEventSlugs(),
  ]);

  return [
    ...staticUrls,
    ...commerces.map((slug) => ({ url: absolute(`/commerces/${slug}`) })),
    ...articles.map((slug) => ({ url: absolute(`/articles/${slug}`) })),
    ...events.map((slug) => ({ url: absolute(`/evenements/${slug}`) })),
  ];
}
