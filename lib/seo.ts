import type { Metadata } from "next";
import { siteConfig } from "./site.config";

export type SeoInput = {
  title?: string;
  description?: string | null;
  path?: string; // ex: "/commerces/boulangerie-xxx"
  images?: string[]; // chemins absolus ou relatifs au site
  robots?: Metadata["robots"];
  noIndex?: boolean;
};

function absoluteUrl(path = "") {
    const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.baseUrl}${p}`;
}

export function buildMetadata(input: SeoInput = {}): Metadata {
  const title = input.title ? `${input.title} | ${siteConfig.name}` : siteConfig.defaultTitle;
  const description = input.description ?? siteConfig.defaultDescription;
  const url = input.path ? absoluteUrl(input.path) : siteConfig.baseUrl;
  const images = (input.images?.length ? input.images : [siteConfig.ogImage]).map((img) =>
    img.startsWith("http") ? img : absoluteUrl(img)
  );

  const robots = input.noIndex ? { index: false, follow: false } : input.robots;

  return {
    metadataBase: new URL(siteConfig.baseUrl),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
      site: siteConfig.twitter,
    },
    robots,
  } satisfies Metadata;
}

export const absolute = absoluteUrl;
