import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../base/Base";
import type { Rol } from "../lib/roles";
import { AUTH_COOKIE } from "../lib/cookieConfig";

interface JwtPayload {
  codUsuario: string;
  codSucursal: string | null;
  rol: Rol;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[AUTH_COOKIE] as string | undefined;

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ["HS256"],
    }) as JwtPayload;

    prisma.usuarios
      .findUnique({
        where: { codUsuario: payload.codUsuario },
        select: { activo: true },
      })
      .then((user) => {
        if (!user || !user.activo) {
          return res
            .status(401)
            .json({ message: "Token inválido o expirado" });
        }
        req.user = payload;
        next();
      })
      .catch(() => {
        return res
          .status(500)
          .json({ message: "Error interno del servidor" });
      });
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}
