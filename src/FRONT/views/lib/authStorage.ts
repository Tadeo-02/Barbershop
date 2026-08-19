import { type UserRole, ROLE_VALUES } from "./roles";

export type { UserRole } from "./roles";

export interface AuthTokenPayload {
  codUsuario: string;
  codSucursal: string | null;
  rol: UserRole;
  exp?: number;
}

const SESSION_USER_KEY = "auth_user";
const LEGACY_AUTH_KEYS = ["user", "userType", "token"];

function clearLegacyAuthStorage(): void {
  LEGACY_AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export interface SessionUser {
  codUsuario: string;
  codSucursal: string | null;
  rol: UserRole;
}

export function getSessionUser(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (
      typeof parsed.codUsuario !== "string" ||
      !ROLE_VALUES.includes((parsed.rol ?? "") as UserRole)
    ) {
      sessionStorage.removeItem(SESSION_USER_KEY);
      return null;
    }
    return {
      codUsuario: parsed.codUsuario,
      codSucursal: parsed.codSucursal ?? null,
      rol: parsed.rol as UserRole,
    };
  } catch {
    sessionStorage.removeItem(SESSION_USER_KEY);
    return null;
  }
}

export function setSessionUser(user: SessionUser): void {
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function clearAuthStorage(): void {
  sessionStorage.removeItem(SESSION_USER_KEY);
  clearLegacyAuthStorage();
}
