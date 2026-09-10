const isProduction = process.env.NODE_ENV === "production";

export const AUTH_COOKIE = "access_token";
export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";
export const REFRESH_COOKIE = "refresh_token";

// In production, frontend and backend are on different origins (cross-site),
// so cookies MUST use SameSite=None + Secure to be sent by the browser.
// In development (same-origin), Lax is sufficient and safer.
const sameSiteValue = isProduction ? ("none" as const) : ("lax" as const);

// In production, frontend and backend are on different domains.
// Cookies MUST set domain to the frontend domain so the browser stores them
// under the frontend origin and sends them on subsequent requests.
// COOKIE_DOMAIN should be set to the frontend domain (e.g. ".vercel.app")
const cookieDomain = isProduction ? (process.env.COOKIE_DOMAIN || undefined) : undefined;

export const authCookieOptions = (maxAgeMs: number) =>
  ({
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSiteValue,
    partitioned: isProduction,
    path: "/",
    domain: cookieDomain,
    maxAge: maxAgeMs,
  }) satisfies import("express").CookieOptions;

export const csrfCookieOptions = (maxAgeMs: number) =>
  ({
    httpOnly: false,
    secure: isProduction,
    sameSite: sameSiteValue,
    partitioned: isProduction,
    path: "/",
    domain: cookieDomain,
    maxAge: maxAgeMs,
  }) satisfies import("express").CookieOptions;

export const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: sameSiteValue,
  partitioned: isProduction,
  path: "/",
  domain: cookieDomain,
  maxAge: 0,
} satisfies import("express").CookieOptions;

export const clearCsrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: sameSiteValue,
  partitioned: isProduction,
  path: "/",
  domain: cookieDomain,
  maxAge: 0,
} satisfies import("express").CookieOptions;

export const refreshCookieOptions = (maxAgeMs: number) =>
  ({
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSiteValue,
    partitioned: isProduction,
    path: "/",
    domain: cookieDomain,
    maxAge: maxAgeMs,
  }) satisfies import("express").CookieOptions;

export const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: sameSiteValue,
  partitioned: isProduction,
  path: "/",
  domain: cookieDomain,
  maxAge: 0,
} satisfies import("express").CookieOptions;
