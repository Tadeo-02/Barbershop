import { Request, Response, NextFunction } from "express";

interface SecurityEvent {
  timestamp: Date;
  ip: string;
  endpoint: string;
  method: string;
  type:
    | "rate_limit"
    | "duplicate_request"
    | "validation_error"
    | "auth_failure";
  message: string;
}

/**
 * In-memory log of security events (last 100 events)
 * In production, this should be stored in a database or logging service
 */
const securityEvents: SecurityEvent[] = [];
const MAX_EVENTS = 100;

/**
 * Logs a security event
 */
export function logSecurityEvent(
  req: Request,
  type: SecurityEvent["type"],
  message: string,
): void {
  const event: SecurityEvent = {
    timestamp: new Date(),
    ip: req.ip || req.socket.remoteAddress || "unknown",
    endpoint: req.path,
    method: req.method,
    type,
    message,
  };

  securityEvents.push(event);

  // Keep only last MAX_EVENTS
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.shift();
  }

  // Log to console with color coding
  const timestamp = event.timestamp.toISOString();
  const logMessage = `[SECURITY] ${timestamp} | ${event.ip} | ${event.method} ${event.endpoint} | ${type.toUpperCase()} | ${message}`;

  switch (type) {
    case "rate_limit":
      console.warn(`⚠️  ${logMessage}`);
      break;
    case "duplicate_request":
      console.warn(`⚠️  ${logMessage}`);
      break;
    case "auth_failure":
      console.error(`🚨 ${logMessage}`);
      break;
    case "validation_error":
      console.log(`ℹ️  ${logMessage}`);
      break;
  }
}

/**
 * Gets recent security events (for admin dashboard)
 */
export function getSecurityEvents(limit: number = 50): SecurityEvent[] {
  return securityEvents.slice(-limit);
}

/**
 * Middleware to track suspicious patterns
 * Monitors for rapid failed requests from same IP
 */
export function securityMonitor() {
  const ipAttempts = new Map<string, { count: number; lastAttempt: number }>();

  // Cleanup old entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipAttempts.entries()) {
      if (now - data.lastAttempt > 60000) {
        ipAttempts.delete(ip);
      }
    }
  }, 60000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    // Track response to detect failures
    const originalJson = res.json.bind(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.json = function (body: any): Response {
      // Check if this was an error response
      if (res.statusCode >= 400) {
        const attempts = ipAttempts.get(ip) || { count: 0, lastAttempt: 0 };
        attempts.count += 1;
        attempts.lastAttempt = Date.now();
        ipAttempts.set(ip, attempts);

        // Log if suspicious (more than 10 failed attempts from same IP)
        if (attempts.count > 10) {
          logSecurityEvent(
            req,
            "auth_failure",
            `Suspicious activity: ${attempts.count} failed requests in last minute`,
          );
        }

        // Log specific error types
        if (body && body.message) {
          if (res.statusCode === 429) {
            logSecurityEvent(req, "rate_limit", body.message);
          } else if (
            body.message.includes("duplicada") ||
            body.message.includes("duplicate")
          ) {
            logSecurityEvent(req, "duplicate_request", body.message);
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            logSecurityEvent(req, "auth_failure", body.message);
          }
        }
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        // Reset counter on successful request
        ipAttempts.delete(ip);
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Express route handler to get security events (for admin use)
 */
export function getSecurityEventsHandler(req: Request, res: Response): void {
  const limit = parseInt(req.query.limit as string) || 50;
  const events = getSecurityEvents(limit);

  res.json({
    success: true,
    total: events.length,
    events,
  });
}
