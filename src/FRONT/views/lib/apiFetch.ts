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

// Shared refresh promise — prevents a storm of concurrent refresh calls.
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/usuarios/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = (await res.json()) as { csrfToken?: string };
        if (data.csrfToken) {
          csrfToken = data.csrfToken;
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  // Fallback: try document.cookie (works in same-origin dev, fails cross-site)
  const token =
    csrfToken ??
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("csrf_token="))
      ?.split("=")[1] ??
    null;

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
    const url = new URL(`${API_URL}${path}`, window.location.origin);
    const isAuthEndpoint =
      url.pathname === "/usuarios/login" ||
      url.pathname === "/usuarios/refresh";

    if (!isAuthEndpoint) {
      const refreshed = await attemptRefresh();

      if (refreshed) {
        // Retry the original request once with the new access token
        const retryToken =
          csrfToken ??
          document.cookie
            .split("; ")
            .find((c) => c.startsWith("csrf_token="))
            ?.split("=")[1] ??
          null;

        return fetch(`${API_URL}${path}`, {
          ...options,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(retryToken ? { "X-CSRF-Token": retryToken } : {}),
            ...options.headers,
          },
        });
      }
    }

    clearAuthStorage();
    window.location.href = "/login";
  }

  return res;
}
