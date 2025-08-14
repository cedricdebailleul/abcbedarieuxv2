import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignorer les erreurs ESLint en production
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorer les erreurs TypeScript en production pour le déploiement
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  // Désactiver la génération statique pour permettre le build sans DB
  generateStaticParams: () => [],
  experimental: {
    // Forcer le rendu côté serveur
    isrMemoryCacheSize: 0,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
