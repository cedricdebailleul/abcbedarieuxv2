/**
 * Système de logging sécurisé
 * - Masque les données sensibles en production
 * - Utilise des niveaux de log appropriés
 * - Peut être étendu avec Winston/Pino pour la production
 */

const isProduction = process.env.NODE_ENV === "production";

// Types de données sensibles à masquer
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /credential/i,
];

/**
 * Masque les valeurs sensibles dans un objet
 */
function maskSensitiveData(data: unknown): unknown {
  if (typeof data === "string") {
    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(data))
      ? "[MASKED]"
      : data;
  }

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  if (data && typeof data === "object") {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      masked[key] = SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))
        ? "[MASKED]"
        : maskSensitiveData(value);
    }
    return masked;
  }

  return data;
}

/**
 * Logger avec protection des données sensibles
 */
export const logger = {
  /**
   * Log de debug - uniquement en développement
   */
  debug: (message: string, data?: unknown) => {
    if (!isProduction) {
      console.log(`🔍 [DEBUG] ${message}`, data ? maskSensitiveData(data) : "");
    }
  },

  /**
   * Log d'information
   */
  info: (message: string, data?: unknown) => {
    const logData = isProduction ? maskSensitiveData(data) : data;
    console.log(`ℹ️ [INFO] ${message}`, logData || "");
  },

  /**
   * Log d'avertissement
   */
  warn: (message: string, data?: unknown) => {
    const logData = isProduction ? maskSensitiveData(data) : data;
    console.warn(`⚠️ [WARN] ${message}`, logData || "");
  },

  /**
   * Log d'erreur
   */
  error: (message: string, error?: unknown) => {
    console.error(`❌ [ERROR] ${message}`);
    if (!isProduction && error) {
      console.error("Détails:", error);
    } else if (isProduction && error instanceof Error) {
      // En production, logger seulement le message d'erreur, pas la stack
      console.error(`Message: ${error.message}`);
    }
  },

  /**
   * Log de succès - uniquement en développement
   */
  success: (message: string, data?: unknown) => {
    if (!isProduction) {
      console.log(`✅ [SUCCESS] ${message}`, data || "");
    }
  },

  /**
   * Log de sécurité - toujours actif
   */
  security: (message: string, data?: unknown) => {
    const logData = maskSensitiveData(data);
    console.warn(`🔒 [SECURITY] ${message}`, logData || "");
  },
};

/**
 * Helper pour logger les requêtes API
 */
export function logRequest(
  method: string,
  path: string,
  userId?: string,
  duration?: number
) {
  if (!isProduction) {
    const durationStr = duration ? ` (${duration}ms)` : "";
    const userStr = userId ? ` | User: ${userId}` : "";
    console.log(`📡 [API] ${method} ${path}${userStr}${durationStr}`);
  }
}

/**
 * Helper pour logger les opérations admin sensibles
 */
export function logAdminAction(
  action: string,
  userId: string,
  details?: unknown
) {
  const logData = maskSensitiveData(details);
  console.log(
    `👮 [ADMIN] ${action} | User: ${userId}`,
    logData ? `| ${JSON.stringify(logData)}` : ""
  );
}
