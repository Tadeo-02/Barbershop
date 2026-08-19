// lib/apiFetch.ts
import { clearAuthStorage, getStoredAuthToken } from "./authStorage";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getStoredAuthToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearAuthStorage();
    window.location.href = "/login";
  }

  return res;
}
