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
