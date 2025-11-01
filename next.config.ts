import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporairement désactiver pour économiser la mémoire pendant le build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporairement désactiver pour économiser la mémoire pendant le build
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  
  // Optimisations pour réduire la mémoire pendant le build
  experimental: {
    // Retirer isrMemoryCacheSize qui n'existe pas dans Next.js 15
    // Ajouter ces options à la place :
    workerThreads: false,
    cpus: 1,
  },
  
  // Optimiser Webpack pour économiser la mémoire
  webpack: (config, { isServer }) => {
    // Limiter le parallélisme pour réduire l'utilisation mémoire
    config.parallelism = 1;
    
    // Désactiver la minimisation en développement
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Créer un chunk par package node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Utiliser SWC pour la minification (plus rapide et moins gourmand)
  swcMinify: true,
  
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