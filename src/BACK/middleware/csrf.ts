import { Request, Response, NextFunction } from "express";
import { CSRF_COOKIE, CSRF_HEADER } from "../lib/cookieConfig";

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin ?? req.headers.referer;
  const method = req.method.toUpperCase();

  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const csrfCookie = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const csrfHeader = req.headers[CSRF_HEADER] as string | undefined;

  if (!csrfCookie || !csrfHeader) {
    return res.status(403).json({ message: "CSRF token missing" });
  }

  if (csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: "CSRF token mismatch" });
  }

  if (origin) {
    const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
      .split(",")
      .map((o) => o.trim());
    const requestOrigin = new URL(origin).origin;
    if (!allowedOrigins.includes(requestOrigin)) {
      return res.status(403).json({ message: "CSRF origin mismatch" });
    }
  }

  next();
}
