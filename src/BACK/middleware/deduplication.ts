import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * In-memory cache to store recent request hashes
 * Key: request hash
 * Value: timestamp when the request was made
 */
const requestCache = new Map<string, number>();

/**
 * Cleanup interval to remove old entries from cache
 * Runs every 10 seconds
 */
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  requestCache.forEach((timestamp, hash) => {
    // Remove entries older than 10 seconds
    if (now - timestamp > 10000) {
      keysToDelete.push(hash);
    }
  });

  keysToDelete.forEach((key) => requestCache.delete(key));
}, 10000);

/**
 * Creates a hash from request body and client IP
 * This uniquely identifies a request
 */
function createRequestHash(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const body = JSON.stringify(req.body);
  const data = `${ip}:${body}`;

  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Middleware to prevent duplicate requests within a time window
 *
 * @param windowMs - Time window in milliseconds (default: 3000ms = 3 seconds)
 * @returns Express middleware function
 *
 * Use this middleware on endpoints where users might accidentally submit
 * the same data multiple times (e.g., registration, appointment creation)
 */
export function deduplicateRequests(windowMs: number = 3000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only apply to POST, PUT, PATCH requests
    if (!["POST", "PUT", "PATCH"].includes(req.method)) {
      next();
      return;
    }

    const requestHash = createRequestHash(req);
    const now = Date.now();
    const cachedTimestamp = requestCache.get(requestHash);

    if (cachedTimestamp) {
      const timeSinceLastRequest = now - cachedTimestamp;

      // If the same request was made recently, reject it
      if (timeSinceLastRequest < windowMs) {
        res.status(429).json({
          success: false,
          message:
            "Solicitud duplicada detectada. Por favor, espere antes de intentar nuevamente.",
          retryAfter: Math.ceil((windowMs - timeSinceLastRequest) / 1000),
        });
        return;
      }
    }

    // Store this request hash with current timestamp
    requestCache.set(requestHash, now);

    // Continue to next middleware
    next();
  };
}

/**
 * Strict deduplication for critical operations (5 second window)
 * Use for user registration, important updates, etc.
 */
export const strictDeduplication = deduplicateRequests(5000);

/**
 * Standard deduplication for regular operations (3 second window)
 * Use for general POST/PUT operations
 */
export const standardDeduplication = deduplicateRequests(3000);

/**
 * Lenient deduplication for less critical operations (1 second window)
 * Use for operations where fast retries might be acceptable
 */
export const lenientDeduplication = deduplicateRequests(1000);
