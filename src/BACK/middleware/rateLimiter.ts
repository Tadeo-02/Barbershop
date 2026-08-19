import rateLimit from "express-rate-limit";
import { Request } from "express";

/**
* Key generator for authenticated users
* Uses the user ID from the x-user-id header, with a fallback to a constant
  */
const userIdKeyGenerator = (req: Request): string => {
  const userId = req.header("x-user-id");
  if (userId) {
    return `user:${userId}`;
  }
  // Fallback to unknown if there is no user ID (this should not happen on authenticated routes)
// We don't use the IP here because this rate limiter is for authenticated users.
  return "user:unknown";
};

/**
* General rate limiter for all API endpoints
* Limit: 100 requests every 15 minutes per IP
  */

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300, // Maximum of 300 requests per IP per time window.

  message: {
    success: false,
    message:
      "Demasiadas solicitudes desde esta IP, por favor intente más tarde.",
  },
  standardHeaders: true, // Returns rate limit information in the `RateLimit-*` headers.

  legacyHeaders: false, // Disables the `X-RateLimit-*` headers
  // Do not skip successful requests.
  skipSuccessfulRequests: false,
  // Do not skip failed requests.
  skipFailedRequests: false,
});

/**

* Strict rate limiter for authentication endpoints (login, registration)
* Limit: 5 requests every 15 minutes per IP
* Prevents brute-force attacks and mass registrations
* Uses IP-based rate limiting (for unauthenticated users)
  */

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // Maximum of 5 requests per IP per time window.
  message: {
    success: false,
    message:
      "Demasiados intentos de autenticación. Por favor, intente nuevamente en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Do not count successful requests against the limit
  skipSuccessfulRequests: true,
});

/**
 * Moderate rate limiter for data modification endpoints
 * LLimit: 20 requests every 5 minutes per IP (for unauthenticated users)
 * Prevents abuse in creation, update, and deletion operations
 * @deprecated Use userModificationLimiter for authenticated endpoints
 */
export const modificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Maximum of 20 requests per IP per time window
  message: {
    success: false,
    message:
      "Demasiadas solicitudes de modificación. Por favor, espere unos minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * User-based modification rate limiter (authenticated users)
* Limit: 30 requests every 5 minutes per user ID
* Prevents abuse of create, update, and delete operations
  */

export const userModificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 90, // Maximum of 90 requests per user per time window (higher than IP-based)
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
 * Very strict rate limiter for sensitive operations (password recovery, etc.)
 * LLimit: 3 requests every 60 minutes per IP (for unauthenticated users)
 * @deprecated Use userSensitiveLimiter for authenticated endpoints
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 3, // Maximum of 3 requests per IP per time window
  message: {
    success: false,
    message:
      "Ha excedido el límite de intentos para esta operación. Intente nuevamente en 1 hora.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Very strict rate limiter based on user for sensitive operations (authenticated users)
 * LLimit: 5 requests every 60 minutes per user ID
 * Use for security-related operations in authenticated users
 */
export const userSensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 5, // Maximum of 5 requests per user per time window
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
* Limit: 100 requests every 15 minutes per user ID
* Use for general authenticated endpoints (GET, POST, PUT, DELETE)
  */
export const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Maximum of 300 requests per user per time window
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

/**
* Public read rate limiter for unauthenticated GET endpoints (e.g., landing page data)
* Uses an IP-based key. Allows 300 requests every 15 minutes per IP.
* Skips successful requests, so only errors count toward the limit.
  */

export const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    success: false,
    message: "Demasiadas solicitudes. Por favor, intente más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
