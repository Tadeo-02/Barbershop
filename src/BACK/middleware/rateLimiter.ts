import rateLimit from "express-rate-limit";

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
 * Limits: 20 requests per 5 minutes per IP
 * This prevents abuse on create/update/delete operations
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
 * Very strict rate limiter for sensitive operations (password reset, etc.)
 * Limits: 3 requests per 60 minutes per IP
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
