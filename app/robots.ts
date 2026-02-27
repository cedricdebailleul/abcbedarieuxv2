import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/onboarding/",
          "/_next/",
          "/private/",
        ],
      },
    ],
    sitemap: `${siteConfig.baseUrl}/sitemap.xml`,
  };
}
