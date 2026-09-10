const isProduction = process.env.NODE_ENV === "production";

export const AUTH_COOKIE = "access_token";
export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";
export const REFRESH_COOKIE = "refresh_token";

// In production, frontend and backend are on different origins (cross-site),
// so cookies MUST use SameSite=None + Secure to be sent by the browser.
// In development (same-origin), Lax is sufficient and safer.
const sameSiteValue = isProduction ? ("none" as const) : ("lax" as const);

// In production, frontend and backend are on completely different domains
// (e.g. vercel.app vs render.com). We rely on the Partitioned (CHIPS) flag
// so the browser automatically stores cookies partitioned by the top-level
// site. Do NOT set an explicit domain — Partitioned cookies reject that.
// The browser will store them under the frontend's origin automatically.

export const authCookieOptions = (maxAgeMs: number) =>
  ({
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSiteValue,
    partitioned: isProduction,
    path: "/",
    maxAge: maxAgeMs,
  }) satisfies import("express").CookieOptions;

export const csrfCookieOptions = (maxAgeMs: number) =>
  ({
    httpOnly: false,
    secure: isProduction,
    sameSite: sameSiteValue,
    partitioned: isProduction,
    path: "/",
    maxAge: maxAgeMs,
  }) satisfies import("express").CookieOptions;

export const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: sameSiteValue,
  partitioned: isProduction,
  path: "/",
  maxAge: 0,
} satisfies import("express").CookieOptions;

export const clearCsrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: sameSiteValue,
  partitioned: isProduction,
  path: "/",
  maxAge: 0,
} satisfies import("express").CookieOptions;

export const refreshCookieOptions = (maxAgeMs: number) =>
  ({
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSiteValue,
    partitioned: isProduction,
    path: "/",
    maxAge: maxAgeMs,
  }) satisfies import("express").CookieOptions;

export const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: sameSiteValue,
  partitioned: isProduction,
  path: "/",
  maxAge: 0,
} satisfies import("express").CookieOptions;
