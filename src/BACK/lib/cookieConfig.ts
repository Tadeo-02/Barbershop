const isProduction = process.env.NODE_ENV === "production";

export const AUTH_COOKIE = "access_token";
export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

export const authCookieOptions = (maxAgeMs: number) =>
  ({
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeMs,
  }) satisfies import("express").CookieOptions;

export const csrfCookieOptions = (maxAgeMs: number) =>
  ({
    httpOnly: false,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeMs,
  }) satisfies import("express").CookieOptions;

export const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 0,
} satisfies import("express").CookieOptions;

export const clearCsrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 0,
} satisfies import("express").CookieOptions;
