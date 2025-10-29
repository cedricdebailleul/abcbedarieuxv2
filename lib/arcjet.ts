import arcjet, { shield, tokenBucket } from "@arcjet/next";

// Configuration Arcjet pour la protection et rate limiting
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["ip.src"], // Tracking par IP source
  rules: [
    // Protection contre les bots et attaques
    shield({
      mode: "LIVE", // Passer en LIVE en production
    }),
  ],
});

// Rate limiting pour les routes d'authentification
export const authRateLimit = tokenBucket({
  mode: "LIVE",
  refillRate: 5, // 5 requêtes
  interval: "1m", // par minute
  capacity: 10, // Capacité maximale de 10 tokens
});

// Rate limiting pour les uploads
export const uploadRateLimit = tokenBucket({
  mode: "LIVE",
  refillRate: 10, // 10 requêtes
  interval: "1m", // par minute
  capacity: 20, // Capacité maximale de 20 tokens
});

// Rate limiting pour les newsletters (souscription)
export const newsletterRateLimit = tokenBucket({
  mode: "LIVE",
  refillRate: 3, // 3 requêtes
  interval: "10m", // par 10 minutes
  capacity: 5, // Capacité maximale de 5 tokens
});

// Rate limiting pour les APIs générales
export const apiRateLimit = tokenBucket({
  mode: "LIVE",
  refillRate: 60, // 60 requêtes
  interval: "1m", // par minute
  capacity: 100, // Capacité maximale de 100 tokens
});
