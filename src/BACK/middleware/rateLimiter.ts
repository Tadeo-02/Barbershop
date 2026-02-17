import rateLimit from "express-rate-limit";
import { Request } from "express";

/**
 * Key generator for authenticated users
 * Uses user ID from x-user-id header, falls back to a constant
 */
const userIdKeyGenerator = (req: Request): string => {
  const userId = req.header("x-user-id");
  if (userId) {
    return `user:${userId}`;
  }
  // Fallback to unknown if no user ID (shouldn't happen on authenticated routes)
  // We don't use IP here because this is for authenticated user limiting
  return "user:unknown";
};

/**
 * General rate limiter for all API endpoints
 * Limits: 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message:
      "Demasiadas solicitudes desde esta IP, por favor intente más tarde.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
});

/**
 * Strict rate limiter for authentication endpoints (login, register)
 * Limits: 5 requests per 15 minutes per IP
 * This prevents brute force attacks and spam registrations
 * Uses IP-based limiting (for non-authenticated users)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message:
      "Demasiados intentos de autenticación. Por favor, intente nuevamente en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Don't count successful requests against the limit
  skipSuccessfulRequests: true,
});

/**
 * Moderate rate limiter for data modification endpoints
 * Limits: 20 requests per 5 minutes per IP (for non-authenticated)
 * This prevents abuse on create/update/delete operations
 * @deprecated Use userModificationLimiter for authenticated endpoints
 */
export const modificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message:
      "Demasiadas solicitudes de modificación. Por favor, espere unos minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * User-based rate limiter for data modification endpoints (authenticated users)
 * Limits: 30 requests per 5 minutes per user ID
 * This prevents abuse on create/update/delete operations by authenticated users
 */
export const userModificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each user to 30 requests per windowMs (higher than IP-based)
  message: {
    success: false,
    message:
      "Demasiadas solicitudes de modificación. Por favor, espere unos minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userIdKeyGenerator,
});

/**
 * Very strict rate limiter for sensitive operations (password reset, etc.)
 * Limits: 3 requests per 60 minutes per IP (for non-authenticated)
 * @deprecated Use userSensitiveLimiter for authenticated endpoints
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    success: false,
    message:
      "Ha excedido el límite de intentos para esta operación. Intente nuevamente en 1 hora.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * User-based strict limiter for sensitive operations (authenticated users)
 * Limits: 5 requests per 60 minutes per user ID
 * Use for security-related operations for authenticated users
 */
export const userSensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 5, // Limit each user to 5 requests per windowMs
  message: {
    success: false,
    message:
      "Ha excedido el límite de intentos para esta operación. Intente nuevamente en 1 hora.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userIdKeyGenerator,
});

/**
 * Standard user-based rate limiter for authenticated operations
 * Limits: 100 requests per 15 minutes per user ID
 * Use for general authenticated endpoints (GET, POST, PUT, DELETE)
 */
export const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per windowMs
  message: {
    success: false,
    message: "Demasiadas solicitudes. Por favor, intente más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userIdKeyGenerator,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});
