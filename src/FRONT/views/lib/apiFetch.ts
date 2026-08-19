import { clearAuthStorage } from "./authStorage";

// IMPORTANT: All authenticated requests must go through this function.
// Raw fetch() calls will silently break CSRF protection because they
// won't include the X-CSRF-Token header or send credentials (cookies).
const API_URL = import.meta.env.VITE_API_URL ?? "";

// CSRF token stored in JS memory. In cross-site deployments (different
// registrable domains), document.cookie CANNOT read cookies set by the
// backend — so we store the token returned in the login response body
// and use it from here instead.
let csrfToken: string | null = null;

export function setCsrfToken(token: string) {
  csrfToken = token;
}

export function clearCsrfToken() {
  csrfToken = null;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  // Fallback: try document.cookie (works in same-origin dev, fails cross-site)
  const token = csrfToken ?? document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf_token="))
    ?.split("=")[1] ?? null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-CSRF-Token": token } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearAuthStorage();
    window.location.href = "/login";
  }

  return res;
}
