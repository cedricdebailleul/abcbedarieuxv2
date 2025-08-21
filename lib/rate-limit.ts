import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// Configuration Redis (optionnelle, fallback vers mémoire locale)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : undefined;

// Rate limiters pour différents endpoints
export const newsletterSubscribeLimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requêtes par minute
      analytics: true,
      prefix: "ratelimit:newsletter:subscribe",
    })
  : undefined;

export const trackingLimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 tracking par minute
      analytics: true,
      prefix: "ratelimit:tracking",
    })
  : undefined;

export const generalPublicLimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requêtes par minute
      analytics: true,
      prefix: "ratelimit:public",
    })
  : undefined;

// Fonction helper pour obtenir l'IP du client
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIP) return realIP;

  return "unknown";
}

// Types pour la réponse de rate limiting
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  reason?: string;
}

// Fonction helper pour vérifier le rate limiting
export async function checkRateLimit(
  ratelimiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const result = await ratelimiter.limit(identifier);

    if (!result.success) {
      console.warn(
        `🚨 Rate limit dépassé pour ${identifier}: ${result.remaining}/${result.limit} restantes`
      );
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
      reason: result.success ? undefined : "Trop de requêtes",
    };
  } catch (error) {
    console.error("Erreur rate limiting:", error);
    // En cas d'erreur Redis, autoriser la requête mais logger
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date(),
      reason: undefined,
    };
  }
}

// Middleware pour créer des réponses rate limited standardisées
export function createRateLimitResponse(result: RateLimitResult) {
  return Response.json(
    {
      error: "Trop de requêtes",
      message: "Veuillez patienter avant de réessayer",
      retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.getTime().toString(),
        "Retry-After": Math.ceil(
          (result.reset.getTime() - Date.now()) / 1000
        ).toString(),
      },
    }
  );
}
