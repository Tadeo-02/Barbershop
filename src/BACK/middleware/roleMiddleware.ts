// middleware/roleMiddleware.ts
import { Request, Response, NextFunction } from "express";
import type { Rol } from "../lib/roles";

export function requireRole(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    next();
  };
}

export function requireOwnershipOrRole(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }
    if (roles.includes(req.user.rol)) {
      return next();
    }
    const paramCodUsuario =
      req.params.codUsuario ?? req.params.id ?? null;
    if (paramCodUsuario && req.user.codUsuario === paramCodUsuario) {
      return next();
    }
    return res.status(403).json({ message: "Acceso denegado" });
  };
}
