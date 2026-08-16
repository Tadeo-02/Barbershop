type UserRole = "client" | "barber" | "admin";

export interface AuthTokenPayload {
  codUsuario: string;
  codSucursal: string | null;
  rol: UserRole;
  exp?: number;
}

const AUTH_TOKEN_KEY = "token";
const LEGACY_AUTH_KEYS = ["user", "userType"];

function clearLegacyAuthStorage(): void {
  LEGACY_AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return atob(padded);
}

export function decodeAuthToken(token: string): AuthTokenPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const parsed = JSON.parse(
      decodeBase64Url(payload),
    ) as Partial<AuthTokenPayload>;

    if (
      typeof parsed.codUsuario !== "string" ||
      !["client", "barber", "admin"].includes(parsed.rol ?? "")
    ) {
      return null;
    }

    return {
      codUsuario: parsed.codUsuario,
      codSucursal: parsed.codSucursal ?? null,
      rol: parsed.rol as UserRole,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: AuthTokenPayload): boolean {
  return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
}

export function getStoredAuthToken(): string | null {
  try {
    const token =
      sessionStorage.getItem(AUTH_TOKEN_KEY) ?? localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) return null;

    const payload = decodeAuthToken(token);
    if (!payload || isTokenExpired(payload)) {
      clearAuthStorage();
      return null;
    }

    if (!sessionStorage.getItem(AUTH_TOKEN_KEY)) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    localStorage.removeItem(AUTH_TOKEN_KEY);
    clearLegacyAuthStorage();
    return token;
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  clearLegacyAuthStorage();
}

export function clearAuthStorage(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  clearLegacyAuthStorage();
}
