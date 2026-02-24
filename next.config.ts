import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone',
  
  // Optimisations pour réduire la mémoire pendant le build
  experimental: {
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
        minimize: process.env.NODE_ENV === "production",
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

  // Turbopack configuration (empty to silence error when using webpack config)
  turbopack: {},
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
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
      // Cloudflare R2 domains
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      // pub-*.r2.dev already covered by *.r2.dev above
      {
        protocol: 'https',
        hostname: 'images.abcbedarieux.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;