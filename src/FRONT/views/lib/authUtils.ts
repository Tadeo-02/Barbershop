import toast from "react-hot-toast";
import type { NavigateFunction } from "react-router-dom";

export interface AuthGuardOptions {
  message?: string;
  redirectTo?: string;
  requireSucursal?: boolean;
}

export const ensureAuthenticatedUser = (
  isAuthenticated: boolean,
  user: { codUsuario?: string; codSucursal?: string } | null | undefined,
  navigate: NavigateFunction,
  options: AuthGuardOptions = {},
): boolean => {
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
};
