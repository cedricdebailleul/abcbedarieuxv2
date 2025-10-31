import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignorer les erreurs ESLint en production
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Ignorer les erreurs TypeScript en production pour le déploiement
    ignoreBuildErrors: false,
  },
  output: 'standalone',
  // Optimisations pour réduire la mémoire pendant le build
  experimental: {
    // Désactiver le cache mémoire de Webpack si nécessaire
    isrMemoryCacheSize: 0, // Désactive le cache ISR en mémoire
  },
  // Limiter le nombre de workers webpack pour économiser la mémoire
  webpack: (config, { isServer }) => {
    // Limiter le parallélisme pour réduire l'utilisation mémoire
    config.parallelism = 1;
    return config;
  },
  // Redirection pour bloquer les URLs Google Photos problématiques
  async redirects() {
    return [
      {
        source: '/maps.googleapis.com/:path*',
        destination: 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Image+bloquee',
        permanent: false,
      },
    ];
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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
