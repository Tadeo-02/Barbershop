const isProduction = process.env.NODE_ENV === "production";

export const AUTH_COOKIE = "access_token";
export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

// In production, frontend and backend are on different origins (cross-site),
// so cookies MUST use SameSite=None + Secure to be sent by the browser.
// In development (same-origin), Lax is sufficient and safer.
const sameSiteValue = isProduction ? ("none" as const) : ("lax" as const);

export const authCookieOptions = (maxAgeMs: number) =>
  ({
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSiteValue,
    path: "/",
    maxAge: maxAgeMs,
  }) satisfies import("express").CookieOptions;

export const csrfCookieOptions = (maxAgeMs: number) =>
  ({
    httpOnly: false,
    secure: isProduction,
    sameSite: sameSiteValue,
    path: "/",
    maxAge: maxAgeMs,
  }) satisfies import("express").CookieOptions;

export const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: sameSiteValue,
  path: "/",
  maxAge: 0,
} satisfies import("express").CookieOptions;

export const clearCsrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: sameSiteValue,
  path: "/",
  maxAge: 0,
} satisfies import("express").CookieOptions;
