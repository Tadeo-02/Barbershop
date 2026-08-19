import { clearAuthStorage } from "./authStorage";

// IMPORTANT: All authenticated requests must go through this function.
// Raw fetch() calls will silently break CSRF protection because they
// won't include the X-CSRF-Token header or send credentials (cookies).
const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const csrfToken = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf_token="))
    ?.split("=")[1];

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearAuthStorage();
    window.location.href = "/login";
  }

  return res;
}
