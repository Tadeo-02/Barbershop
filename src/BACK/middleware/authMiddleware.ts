import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
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
  let token: string | undefined;

  const cookieToken = req.cookies?.[AUTH_COOKIE] as string | undefined;
  if (cookieToken) {
    token = cookieToken;
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ["HS256"],
    }) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}
