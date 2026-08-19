import toast from "react-hot-toast";
import type { NavigateFunction } from "react-router-dom";

export interface AuthGuardOptions {
  message?: string;
  redirectTo?: string;
  requireSucursal?: boolean;
}

type AuthUserLike =
  | { codUsuario?: string | null; codSucursal?: string | null }
  | null
  | undefined;

export function ensureAuthenticatedUser<T extends AuthUserLike>(
  isAuthenticated: boolean,
  user: T,
  navigate: NavigateFunction,
  options: AuthGuardOptions = {},
): user is NonNullable<T> {
  const hasUser = !!user && !!user.codUsuario;
  const hasSucursal = !!user?.codSucursal;

  const shouldBlock =
    !isAuthenticated ||
    !hasUser ||
    (options.requireSucursal && !hasSucursal);

  if (!shouldBlock) {
    return true;
  }

  toast.error(options.message ?? "Debes iniciar sesión");

  if (options.redirectTo) {
    navigate(options.redirectTo);
  }

  return false;
}